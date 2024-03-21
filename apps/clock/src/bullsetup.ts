import Queue from "bull";

export const clockQueue = new Queue("clock", {
  redis: {
    host: "localhost",
    port: 6379,
  },
});
