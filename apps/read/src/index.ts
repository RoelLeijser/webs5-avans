import { rabbit } from "./rabbitmq";
import { mongoConnect } from "./mongooseconnect";
import { TargetModel, TargetReactionModel } from "./models/schema";
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
    const { target } = msg.body;

    TargetModel.create({
      _id: target.id,
      ownerId: target.ownerId,
      imageUrl: target.imageUrl,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
      endDate: target.endDate,
      coordinates: [target.latitude, target.longitude],
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
      const targetReaction2 = {
        _id: targetReaction.id,
        ownerId: targetReaction.ownerId,
        imageUrl: targetReaction.imageUrl,
        createdAt: targetReaction.createdAt,
        updatedAt: targetReaction.updatedAt,
        score: targetReaction.score,
        likes: targetReaction.likes,
        dislikes: targetReaction.dislikes,
      };
      const targetReactionModel = new TargetReactionModel(targetReaction2);
      target.reactions?.push(targetReactionModel);
      await target.save();
    }
  }
);

targetReactionSub.on("error", (err) => {
  console.error(err);
});

const targetLikedSub = rabbit.createConsumer(
  {
    queue: "read.target.liked",
    queueOptions: { durable: true },
    // handle 2 messages at a time
    qos: { prefetchCount: 2 },
    // Optionally ensure an exchange exists
    exchanges: [{ exchange: "target-events", type: "topic" }],
    // With a "topic" exchange, messages matching this pattern are routed to the queue
    queueBindings: [{ exchange: "target-events", routingKey: "target.liked" }],
  },
  async (msg) => {
    console.log(msg.body);
    const target = await TargetModel.findById(msg.body.targetId);
    if (target) {
      target.likes = msg.body.likes;
      target.dislikes = msg.body.dislikes;
    }
    await target?.save();
  }
);

targetLikedSub.on("error", (err) => {
  console.error(err);
});

const targetReactionLikedSub = rabbit.createConsumer(
  {
    queue: "read.target.reaction.liked",
    queueOptions: { durable: true },
    // handle 2 messages at a time
    qos: { prefetchCount: 2 },
    // Optionally ensure an exchange exists
    exchanges: [{ exchange: "target-events", type: "topic" }],
    // With a "topic" exchange, messages matching this pattern are routed to the queue
    queueBindings: [
      { exchange: "target-events", routingKey: "targetReaction.liked" },
    ],
  },
  async (msg) => {
    console.log(msg.body);
    const { targetReaction, likes, dislikes } = msg.body;
    const target = await TargetModel.findById(targetReaction.targetId).populate(
      "reactions"
    );
    if (target) {
      target.reactions?.forEach((reaction) => {
        if (reaction._id === targetReaction.id) {
          reaction.likes = likes;
          reaction.dislikes = dislikes;
        }
      });

      await target?.save();
    }
  }
);

targetReactionLikedSub.on("error", (err) => {
  console.error(err);
});

const targetDeletedSub = rabbit.createConsumer(
  {
    queue: "read.target.deleted",
    queueOptions: { durable: true },
    // handle 2 messages at a time
    qos: { prefetchCount: 2 },
    // Optionally ensure an exchange exists
    exchanges: [{ exchange: "target-events", type: "topic" }],
    // With a "topic" exchange, messages matching this pattern are routed to the queue
    queueBindings: [
      { exchange: "target-events", routingKey: "target.deleted" },
    ],
  },
  async (msg) => {
    const target = msg.body.target;
    await TargetModel.findByIdAndDelete(target.id);
  }
);

targetDeletedSub.on("error", (err) => {
  console.error(err);
});

const targetReactionDeletedSub = rabbit.createConsumer(
  {
    queue: "read.target.reaction.deleted",
    queueOptions: { durable: true },
    // handle 2 messages at a time
    qos: { prefetchCount: 2 },
    // Optionally ensure an exchange exists
    exchanges: [{ exchange: "target-events", type: "topic" }],
    // With a "topic" exchange, messages matching this pattern are routed to the queue
    queueBindings: [
      { exchange: "target-events", routingKey: "targetReaction.deleted" },
    ],
  },
  async (msg) => {
    const targetReaction = msg.body.targetReaction;
    const target = await TargetModel.findById(targetReaction.targetId);
    if (target) {
      target.reactions = target.reactions?.filter(
        (reaction) => reaction._id !== targetReaction.id
      );
      await target.save();
    }
  }
);

const setReactionScoreSub = rabbit.createConsumer(
  {
    queue: "targetReaction.scorecreated",
    queueOptions: { durable: true },
    // handle 2 messages at a time
    qos: { prefetchCount: 2 },
    // Optionally ensure an exchange exists
    exchanges: [{ exchange: "target-events", type: "topic" }],
    // With a "topic" exchange, messages matching this pattern are routed to the queue
    queueBindings: [
      { exchange: "target-events", routingKey: "targetReaction.scorecreated" },
    ],
  },
  async (msg) => {
    console.log(msg);
    const { targetId, responseId, score } = msg.body;
    const target = await TargetModel.findById(targetId).populate("reactions");
    if (target) {
      target.reactions?.forEach((reaction) => {
        if (reaction._id === responseId) {
          reaction.score = score;
        }
      });
      await target.save();
    }
  }
);

setReactionScoreSub.on("error", (err) => {
  console.error(err);
});

const targetUpdatedSub = rabbit.createConsumer(
  {
    queue: "read.target.updated",
    queueOptions: { durable: true },
    // handle 2 messages at a time
    qos: { prefetchCount: 2 },
    // Optionally ensure an exchange exists
    exchanges: [{ exchange: "target-events", type: "topic" }],
    // With a "topic" exchange, messages matching this pattern are routed to the queue
    queueBindings: [
      { exchange: "target-events", routingKey: "target.updated" },
    ],
  },
  async (msg) => {
    const target = msg.body.target;
    await TargetModel.findByIdAndUpdate(target.id, {
      endDate: target.endDate,
      coordinates: [target.latitude, target.longitude],
    });
  }
);

targetUpdatedSub.on("error", (err) => {
  console.error(err);
});

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
