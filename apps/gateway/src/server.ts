import express, { type Express, json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import { verifyToken } from "./middleware/isAuthenticated";
import { checkPermissions } from "./middleware/checkPermissions";
import proxy from "express-http-proxy";

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
    .post("/auth/*", proxy("http://localhost:3001"));

  return app;
};
