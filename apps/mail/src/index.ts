import { rabbitMQ } from "./rabbitmq";
import { RegisterSchema } from "./schemas";
import { sendVerificationEmail } from "./mailService";
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
    queue: "target-expired",
    queueOptions: { durable: true },
    qos: { prefetchCount: 2 },
    exchanges: [{ exchange: "target.events", type: "topic" }],
    queueBindings: [
      { exchange: "target.events", routingKey: "target.expired" },
    ],
  },
  async (msg) => {
    console.log(msg.body);
  }
);

expiredSub.on("error", (err: Error) => {
  console.log("consumer error (target-expired)", err);
});
