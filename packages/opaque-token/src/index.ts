import { RequestHandler } from "express";

export const opaqueToken = (): RequestHandler => {
  return (req, res, next) => {
    if (req.headers.authorization !== process.env.OPAQUE_TOKEN) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    next();
  };
};
