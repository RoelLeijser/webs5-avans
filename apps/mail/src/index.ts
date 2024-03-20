import { Resend } from "resend";
import { VerifyEmail } from "@webs5/transactional/dist/index.js";
import { env } from "./env";
import { Connection } from "rabbitmq-client";
import { z } from "zod";

console.log(`Mail running on ${env.MAIL_URL}`);

const resend = new Resend(env.RESEND_API_KEY);

// Initialize:
const rabbit = new Connection(env.RABBITMQ_URL);
rabbit.on("error", (err) => {
  console.log("RabbitMQ connection error", err);
});
rabbit.on("connection", () => {
  console.log("RabbitMQ Connection successfully (re)established");
});

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

const VerificationTokenSchema = z.object({
  identifier: z.string(),
  token: z.string(),
  expires: z.string(),
});

const RegisterSchema = z.object({
  user: UserSchema,
  verificationToken: VerificationTokenSchema,
});

// Consume messages from a queue:
// See API docs for all options
const sub = rabbit.createConsumer(
  {
    queue: "user-events",
    queueOptions: { durable: true },
    // handle 2 messages at a time
    qos: { prefetchCount: 2 },
    // Optionally ensure an exchange exists
    exchanges: [{ exchange: "user.events", type: "topic" }],
    // With a "topic" exchange, messages matching this pattern are routed to the queue
    queueBindings: [{ exchange: "user.events", routingKey: "users.register" }],
  },
  async (msg) => {
    const event = RegisterSchema.parse(msg.body);

    const { data, error } = await resend.emails.send({
      from: "Photo pRESTiges <onboarding@resend.dev>",
      to: [event.user.email],
      subject: "Photo pRESTiges email verification",
      react: VerifyEmail({
        url: `${env.GATEWAY_URL}/auth/verify?token=${event.verificationToken.token}`,
      }),
    });
    if (error) {
      throw new Error(error.message);
    } else if (data) {
      console.log(data);
    }

    // The message is automatically acknowledged (BasicAck) when this function ends.
    // If this function throws an error, then msg is rejected (BasicNack) and
    // possibly requeued or sent to a dead-letter exchange. You can also return a
    // status code from this callback to control the ack/nack behavior
    // per-message.

    // If you want to manually acknowledge the message, you can return a function
    // that accepts an optional error and a status code, and returns a Promise.
  }
);

sub.on("error", (err) => {
  // Maybe the consumer was cancelled, or the connection was reset before a
  // message could be acknowledged.
  console.log("consumer error (user-events)", err);
});

async function onShutdown() {
  // Stop consuming. Wait for any pending message handlers to settle.
  await sub.close();
  await rabbit.close();
}

process.on("SIGINT", onShutdown);
process.on("SIGTERM", onShutdown);
