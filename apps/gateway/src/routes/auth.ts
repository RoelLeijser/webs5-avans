import { Router } from "express";
import { Lucia } from "lucia";

export const authRouter: Router = Router();

authRouter.post("/login", (req, res) => {
  res.json({ message: "User logged in" });
});

authRouter.post("/register", (req, res) => {
  res.json({ message: "User registered" });
});
