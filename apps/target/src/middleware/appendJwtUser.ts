import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";

export const appendJwtUser = (): RequestHandler => {
  return (req, res, next) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({ message: "Access token not found" });
    }

    try {
      const decoded = jwt.verify(accessToken, env.JWT_SECRET) as JwtUser;

      req.user = decoded;

      next();
    } catch (error) {
      return res.status(403).json({ message: "Invalid token" });
    }
  };
};
