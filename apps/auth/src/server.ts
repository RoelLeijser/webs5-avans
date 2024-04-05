import express, { type Express, json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import { authRouter } from "./routes/auth";

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors())
    .use(cookieParser());

  app.use("/", authRouter);
  app.all("*", (req, res) => {
    res.status(400).json({ error: `Path ${req.path} not found` });
  });

  return app;
};
