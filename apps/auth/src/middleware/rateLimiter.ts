import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";
import { env } from "../env";

const client = createClient({
  url: env.REDIS_URL,
});

(async () => {
  await client.connect().then(() => {
    console.log("Redis connected");
  });
})();

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests, please try again later",
  },
  store: new RedisStore({
    sendCommand: (...args: string[]) => client.sendCommand(args),
  }),
});
