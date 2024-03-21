import { rabbitMQ } from "./rabbitmq";
import { RegisterSchema } from "./schemas";
import { sendVerificationEmail } from "./mailService";

const sub = rabbitMQ.createConsumer(
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

    await sendVerificationEmail(event);
  }
);

sub.on("error", (err: Error) => {
  console.log("consumer error (user-events)", err);
});
