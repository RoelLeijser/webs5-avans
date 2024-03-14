import { Request, Response, NextFunction } from "express";
import { AbilityBuilder } from "@casl/ability";

export const checkPermissions = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.body.user;

  switch (user.role) {
    case "user":
      console.log("User");
      break;
    case "owner":
      console.log("Owner");
      break;
    case "admin":
      console.log("Admin");
      break;

    default:
      throw new Error("Unauthorized");
  }

  next();
};

export const defineAbilitiesFor = (user: any) => {};
