import express, { type Express, json, urlencoded } from "express";
import { opaqueToken } from "@webs5/opaque-token";
import { targetRouter } from "./routes/targetRouter";

export const createServer = (): Express => {
  const app = express();
  app
    .use(json())
    .use(urlencoded({ extended: true }))
    .use(opaqueToken());

  app.use("/", targetRouter);

  return app;
};
