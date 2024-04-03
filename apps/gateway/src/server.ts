import express, { type Express, json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import { env } from "./env";
import { requestWrapper } from "./requestWrapper";

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(cors())
    .use(cookieParser());

  app
    .use("/target", requestWrapper(env.TARGET_URL))
    .use("/auth", requestWrapper(env.AUTH_URL))
    .use("/api-docs", requestWrapper(env.DOCS_URL));

  app.use(json());

  return app;
};
