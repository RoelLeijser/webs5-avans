import { Router } from "express";
import { authController } from "../controllers/authController";
import { rateLimiter } from "../middleware/rateLimiter";

export const authRouter: Router = Router();

authRouter.post("/login", rateLimiter, (req, res) => {
  return authController.login(req, res);
});

authRouter.post("/register", async (req, res) => {
  return await authController.register(req, res);
});

authRouter.post("/refresh", (req, res) => {
  return authController.refresh(req, res);
});
