import { Request, Response } from "express";
import z from "zod";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { pub } from "../rabbitmq";
import crypto from "node:crypto";
import { UserModel } from "../models/User";
import { VerificationTokenModel } from "../models/VerificationToken";
import { mongoConnect } from "../mongoConnect";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const RefreshSchema = z.string();

const VerifySchema = z.object({
  token: z.string(),
});

mongoConnect();

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = LoginSchema.parse(req.body);

      const user = await UserModel.findOne({ email });

      if (!user || !(await argon2.verify(user.password, password))) {
        return res.status(400).json({ error: "Invalid email or password" });
      }

      if (!user.isVerified) {
        return res.status(400).json({ error: "User not verified" });
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign({ id: user.id }, env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        expires: new Date(Date.now() + 15 * 60 * 1000),
      });

      return res.status(200).json({ message: "Login success" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      } else {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  },

  async register(req: Request, res: Response) {
    try {
      const { email, password } = RegisterSchema.parse(req.body);

      if (await UserModel.findOne({ email })) {
        return res.status(400).json({ error: "User already exists" });
      }

      const hashedPassword = await argon2.hash(password);

      const user = await UserModel.create({ email, password: hashedPassword });

      const verificationToken = await VerificationTokenModel.create({
        identifier: user.id,
        token: crypto.randomBytes(64).toString("hex"),
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });

      await pub.send(
        { exchange: "user.events", routingKey: "users.register" },
        { user, verificationToken }
      );

      return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      } else {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = RefreshSchema.parse(req.cookies.refreshToken);

      const decoded = jwt.verify(refreshToken, env.JWT_SECRET, {});

      if (typeof decoded === "string") {
        throw new Error("Invalid token");
      }

      const user = await UserModel.findById(decoded.id);

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        expires: new Date(Date.now() + 15 * 60 * 1000),
      });

      return res.status(200).json({ message: "Refresh success" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      } else {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  },

  async verify(req: Request, res: Response) {
    try {
      const { token } = VerifySchema.parse(req.query);

      const verificationToken = await VerificationTokenModel.findOne({ token });

      if (!verificationToken) {
        return res.status(400).json({ error: "Invalid token" });
      }

      if (verificationToken.expires < new Date()) {
        return res.status(400).json({ error: "Token expired" });
      }

      await UserModel.findByIdAndUpdate(verificationToken.identifier, {
        isVerified: true,
      });

      await VerificationTokenModel.deleteOne({ token });

      return res.status(200).json({ message: "User verified" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      } else {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  },
};
