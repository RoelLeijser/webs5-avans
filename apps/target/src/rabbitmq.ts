import { Connection } from "rabbitmq-client";
import { env } from "./env";

const rabbit = new Connection(env.RABBITMQ_URL);
rabbit.on("error", (err) => {
  console.log("RabbitMQ connection error", err);
});
rabbit.on("connection", () => {
  console.log("Connection successfully (re)established");
});

export const pub = rabbit.createPublisher({
  // Enable publish confirmations, similar to consumer acknowledgements
  confirm: true,
  // Enable retries
  maxAttempts: 2,
  // Optionally ensure the existence of an exchange before we use it
  exchanges: [{ exchange: "target-events", type: "topic" }],
});
