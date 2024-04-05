import { RequestHandler } from "express";

type Options = {
  token?: string;
};

export const opaqueToken = (options?: Options): RequestHandler => {
  return (req, res, next) => {
    const opaqueToken = options?.token ?? process.env.OPAQUE_TOKEN;

    if (!opaqueToken) {
      return res.status(500).json({
        message: "Opaque token not configured",
      });
    }

    if (req.headers.authorization !== opaqueToken) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    next();
  };
};
