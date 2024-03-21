import { Connection } from "rabbitmq-client";
import { env } from "./env";

export const rabbitMQ = new Connection(env.RABBITMQ_URL);

rabbitMQ.on("error", (err) => {
  console.log("RabbitMQ connection error", err);
});

rabbitMQ.on("connection", () => {
  console.log("RabbitMQ Connection successfully (re)established");
});
