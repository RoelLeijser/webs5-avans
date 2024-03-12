import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { env } from "../env";

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.accessToken;

  if (!token && req.cookies.refreshToken) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Missing access token" });
  }

  jwt.verify(
    token,
    env.JWT_SECRET,
    (
      err: jwt.VerifyErrors | null,
      decoded: string | jwt.JwtPayload | undefined
    ) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }

      req.body.user = decoded;
      next();
    }
  );
};
