import express, {
  type Express,
  json,
  urlencoded,
  RequestHandler,
} from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import { env } from "./env";
import { createProxyMiddleware } from "http-proxy-middleware";
import { requestWrapper } from "./requestWrapper";

const createProxy = (url: string): RequestHandler => {
  return (req, res, next) => {
    return createProxyMiddleware({
      target: url,
      changeOrigin: true,
      secure: env.NODE_ENV === "production",
      logLevel: "debug",
      pathRewrite: {
        [`^/target`]: "/",
        [`^/auth`]: "/",
      },
    })(req, res, next);
  };
};

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
    .use("/auth", requestWrapper(env.AUTH_URL));

  app.use(json());

  return app;
};
