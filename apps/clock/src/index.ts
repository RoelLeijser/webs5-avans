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
    const { target } = msg.body;
    console.log("Adding clock", target.id);
    await addClock(target.id, new Date(target.endDate));
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
    const { target } = msg.body;
    console.log("Updating clock", target.id);
    await updateClock(target.id, new Date(target.endDate));
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
    const { target } = msg.body;
    console.log("Deleting clock", target.id);
    await deleteClock(target.id);
  }
);

deleteSub.on("error", (err) => {
  console.log("consumer error (user-events)", err);
});

console.log("Clockservice running.");
