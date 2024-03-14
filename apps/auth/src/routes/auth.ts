import { Router } from "express";
import { authController } from "../controllers/authController";

export const authRouter: Router = Router();

authRouter.post("/login", async (req, res) => {
  return await authController.login(req, res);
});

authRouter.post("/register", async (req, res) => {
  return await authController.register(req, res);
});

authRouter.post("/refresh", async (req, res) => {
  return await authController.refresh(req, res);
});
