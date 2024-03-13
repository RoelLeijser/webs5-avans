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
    .use(json())
    .use(cors())
    .use(cookieParser())
    .get("/status", (_, res) => {
      return res.json({ ok: true });
    })
    .all("/auth/*", requestWrapper(env.AUTH_URL))
    .all("*", (req, res) => {
      res.status(404).json({ error: `Path ${req.path} not found` });
    }); // this route match should be last

  return app;
};
