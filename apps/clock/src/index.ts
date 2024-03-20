import {
  createModel,
  deleteModel,
  getAllModels,
  updateModel,
} from "../models/clock";
import { Connection } from "rabbitmq-client";
import { Agenda } from "@hokify/agenda";

console.log("clockservice has started...");

//connect to mongoose
import mongoose, { model } from "mongoose";
mongoose.connect("mongodb://localhost:27017/clock");

const rabbit = new Connection("amqp://guest:guest@localhost:5672");
rabbit.on("error", (err) => {
  console.log("RabbitMQ connection error", err);
});
rabbit.on("connection", () => {
  console.log("Connection successfully (re)established");
});

const expiredPub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{ exchange: "target-events", type: "topic" }],
});

const agenda = new Agenda({
  db: {
    address: "mongodb://localhost:27017/agenda",
  },
});

agenda.start();

//when the clock expires, send a message to the target service
agenda.define("expired clock", async (job) => {
  console.log("Deleting clock", job.attrs.data.target_id);
  await expiredPub.send(
    { exchange: "target-events", routingKey: "target.expired" }, // metadata
    { target_id: job.attrs.data.target_id }
  ); // message content
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
    console.log("received message", msg);
    const job = await agenda.schedule(msg.body.date, "expired clock", msg.body);
    await job.save();
    console.log("message processed");
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
    console.log("received message", msg);
    //update agenda job
    const job = await agenda.jobs({ "data.target_id": msg.body.target_id });
    job[0].schedule(msg.body.date);
    await job[0].save();
    console.log("message processed");
  }
);

updateSub.on("error", (err) => {
  console.log("consumer error (user-events)", err);
});

(async () =>
  await expiredPub
    .send(
      { exchange: "target-events", routingKey: "target.created" },
      { target_id: "1234", date: Date.now() + 10000 }
    )
    .then(() => {
      console.log("Message sent");
    }))();

expiredPub
  .send(
    { exchange: "target-events", routingKey: "target.updated" },
    { target_id: "1234", date: Date.now() + 30000 }
  )
  .then(() => {
    console.log("Update message send");
  });
