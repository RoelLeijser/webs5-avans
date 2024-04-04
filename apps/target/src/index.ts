import express from "express";
import { env } from "./env";
import morgan from "morgan";
import { urlencoded, json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { targetRouter } from "./routes/targetRouter";
import { targetReactionRouter } from "./routes/targetReaction";
import { appendJwtUser } from "./middleware/appendJwtUser";

const app = express();
app
  .disable("x-powered-by")
  .use(morgan("dev"))
  .use(urlencoded({ extended: true }))
  .use(json())
  .use(cors())
  .use(cookieParser())
  .use(appendJwtUser());

app.use(targetRouter);
app.use(":targetId/", targetReactionRouter);

const port =
  new URL(env.TARGET_URL).port ||
  (new URL(env.TARGET_URL).protocol === "https:" ? "443" : "80");

app.listen(port, () => {
  console.log(`Target running on ${env.TARGET_URL}`);
});
