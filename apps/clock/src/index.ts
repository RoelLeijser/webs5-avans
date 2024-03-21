import { Connection } from "rabbitmq-client";
import "node:crypto";
import Queue from "bull";
import { clockQueue } from "./bullsetup";
import { addClock, updateClock, deleteClock } from "./clockjobs";
import { rabbit } from "./rabbitmq";

const expiredPub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{ exchange: "target-events", type: "topic" }],
});

clockQueue.process(async (job, done) => {
  console.log("Job completed", job.data.target_id);
  await expiredPub.send("target.expired", {
    target_id: job.data.target_id,
  });
  done();
});

//for creating a new model
const sub = rabbit.createConsumer(
  {
    queue: "target.created",
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
    console.log("Creating clock", msg.body.target_id);
    await addClock(msg.body.target_id, new Date(msg.body.date));
  }
);

sub.on("error", (err) => {
  console.log("consumer error (user-events)", err);
});

const updateSub = rabbit.createConsumer(
  {
    queue: "target.updated",
    queueOptions: { durable: true },
    qos: { prefetchCount: 2 },
    exchanges: [{ exchange: "target-events", type: "topic" }],
    queueBindings: [
      { exchange: "target-events", routingKey: "target.updated" },
    ],
  },
  async (msg) => {
    //update agenda job
    console.log("Updating clock", msg.body.target_id);
    await updateClock(msg.body.target_id, new Date(msg.body.date));
  }
);

updateSub.on("error", (err) => {
  console.log("consumer error (user-events)", err);
});

const deleteSub = rabbit.createConsumer(
  {
    queue: "target.deleted",
    queueOptions: { durable: true },
    qos: { prefetchCount: 2 },
    exchanges: [{ exchange: "target-events", type: "topic" }],
    queueBindings: [
      { exchange: "target-events", routingKey: "target.deleted" },
    ],
  },
  async (msg) => {
    //delete agenda job
    console.log("Deleting clock", msg.body.target_id);
    await deleteClock(msg.body.target_id);
  }
);

deleteSub.on("error", (err) => {
  console.log("consumer error (user-events)", err);
});

console.log("Clockservice running.");
