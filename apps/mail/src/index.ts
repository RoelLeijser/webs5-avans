import { rabbitMQ } from "./rabbitmq";
import { RegisterSchema, TargetResultSchema } from "./schemas";
import { sendVerificationEmail, sendTargetResultEmail } from "./mailService";
import { mongoConnect } from "./mongoConnect";
import { UserModel } from "./models/schema";

mongoConnect();

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
    console.log("Received message", msg.body);

    const event = RegisterSchema.parse(msg.body);

    await sendVerificationEmail(event);

    await UserModel.create({ _id: event.user._id, email: event.user.email });
  }
);

sub.on("error", (err: Error) => {
  console.log("consumer error (user-events)", err);
});

const expiredSub = rabbitMQ.createConsumer(
  {
    queue: "target.result",
    queueOptions: { durable: true },
    qos: { prefetchCount: 2 },
    exchanges: [{ exchange: "target.events", type: "topic" }],
    queueBindings: [{ exchange: "target-events", routingKey: "target.result" }],
  },
  async (msg) => {
    const event = TargetResultSchema.parse(msg.body);
    await sendTargetResultEmail(event);
  }
);

expiredSub.on("error", (err: Error) => {
  console.log("consumer error (target-expired)", err);
});
