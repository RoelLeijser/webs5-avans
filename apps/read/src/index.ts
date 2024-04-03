import { rabbit } from "./rabbitmq";
import { mongoConnect } from "./mongooseconnect";
import { LikeModel, TargetModel } from "./models/schema";
import Express from "express";
import { env } from "./env";
import { targetRouter } from "./routes/targetRouter";

mongoConnect();

//sub for target created
const targetcreatedSub = rabbit.createConsumer(
  {
    queue: "read.target.created",
    queueOptions: { durable: true },
    // handle 2 messages at a time
    qos: { prefetchCount: 2 },
    // Optionally ensure an exchange exists
    exchanges: [{ exchange: "target-events", type: "topic" }],
    // With a "topic" exchange, messages matching this pattern are routed to the queue
    queueBindings: [
      { exchange: "target-events", routingKey: "target.created" },
    ],
  },
  async (msg) => {
    //create agenda job
    const { target } = msg.body;
    console.log(target);
    TargetModel.create({
      _id: target.id,
      ownerId: target.ownerId,
      imageUrl: target.imageUrl,
      likes: [],
      reactions: [],
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
      endDate: target.endDate,
      latitude: target.latitude,
      longitude: target.longitude,
    });
  }
);

targetcreatedSub.on("error", (err) => {
  console.error(err);
});

//sub for when the target is updated
const targetReactionSub = rabbit.createConsumer(
  {
    queue: "read.target.reaction",
    queueOptions: { durable: true },
    // handle 2 messages at a time
    qos: { prefetchCount: 2 },
    // Optionally ensure an exchange exists
    exchanges: [{ exchange: "target-events", type: "topic" }],
    // With a "topic" exchange, messages matching this pattern are routed to the queue
    queueBindings: [
      { exchange: "target-events", routingKey: "targetReaction.created" },
    ],
  },
  async (msg) => {
    const { targetReaction } = msg.body;
    console.log(targetReaction);
    const target = await TargetModel.findById(targetReaction.targetId);
    if (target) {
      target.reactions?.push(targetReaction);
      await target.save();
    }
  }
);
const app = Express();
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use("/", targetRouter);
const port =
  new URL(env.READ_URL).port ||
  (new URL(env.READ_URL).protocol === "https:" ? "443" : "80");
app.listen(port, () => {
  console.log(`Read service is running on ${env.READ_URL}`);
});
