import { Resend } from "resend";
import { VerifyEmail } from "@webs5/transactional/dist/index.js";
import { env } from "./env";
import { Connection } from "rabbitmq-client";
import { z } from "zod";

console.log(`Mail running on ${env.MAIL_URL}`);

const resend = new Resend(env.RESEND_API_KEY);

// Initialize:
const rabbit = new Connection("amqp://guest:guest@localhost:5672");
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

// Consume messages from a queue:
// See API docs for all options
const sub = rabbit.createConsumer(
  {
    queue: "user-events",
    queueOptions: { durable: true },
    // handle 2 messages at a time
    qos: { prefetchCount: 2 },
    // Optionally ensure an exchange exists
    exchanges: [{ exchange: "my-events", type: "topic" }],
    // With a "topic" exchange, messages matching this pattern are routed to the queue
    queueBindings: [{ exchange: "my-events", routingKey: "users.*" }],
  },
  async (msg) => {
    console.log(msg.body);
    const user = UserSchema.parse(msg.body.user);

    const { data, error } = await resend.emails.send({
      from: "Photo pRESTiges <onboarding@resend.dev>",
      to: [user.email],
      subject: "Photo pRESTiges email verification",
      react: VerifyEmail({
        url: "https://resend.dev",
      }),
    });
    if (error) {
      console.log(error);
    } else if (data) {
      console.log(data);
    }

    // The message is automatically acknowledged (BasicAck) when this function ends.
    // If this function throws an error, then msg is rejected (BasicNack) and
    // possibly requeued or sent to a dead-letter exchange. You can also return a
    // status code from this callback to control the ack/nack behavior
    // per-message.
  }
);

sub.on("error", (err) => {
  // Maybe the consumer was cancelled, or the connection was reset before a
  // message could be acknowledged.
  console.log("consumer error (user-events)", err);
});
