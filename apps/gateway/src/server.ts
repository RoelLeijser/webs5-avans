import express, { type Express, json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { verifyToken } from "./middleware/verifyToken";

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors())
    .use(cookieParser())
    .get("/message/:name", (req, res) => {
      return res.json({ message: `hello ${req.params.name}` });
    })
    .get("/status", (_, res) => {
      return res.json({ ok: true });
    })
    .get("/protected", verifyToken, (req, res) => {
      res.json({ message: "This is a secret message" });
    })
    .use("/auth/", authRouter)
    .use(verifyToken)
    .use((req, _, next) => {
      console.log("User", req.body.user);
      next();
    });

  return app;
};
