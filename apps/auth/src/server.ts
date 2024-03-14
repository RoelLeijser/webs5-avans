import express, { type Express, json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { verifyToken } from "./middleware/verifyToken";
import { checkPermissions } from "./middleware/checkPermissions";

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
    .get("/protected", verifyToken, (req, res) => {
      res.json({ message: "This is a secret message" });
    })
    .use("/auth/", authRouter)
    .all("*", (req, res) => {
      res.status(400).json({ error: `Path ${req.path} not found` });
    });

  return app;
};
