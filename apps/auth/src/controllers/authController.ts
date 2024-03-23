import { Request, Response } from "express";
import z from "zod";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { pub } from "../rabbitmq";
import crypto from "node:crypto";

const prisma = new PrismaClient();

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

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = LoginSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email } });

      if (user?.isVerified === false) {
        return res.status(400).json({ error: "User not verified" });
      }

      if (!user || !(await argon2.verify(user.password, password))) {
        return res.status(400).json({ error: "Invalid email or password" });
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        {
          expiresIn: "15m",
        }
      );

      const refreshToken = jwt.sign(
        {
          id: user.id,
        },
        env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      return res.status(200).json({
        message: "Login success",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({
          error: "Internal server error",
        });
      }
    }
  },

  async register(req: Request, res: Response) {
    try {
      const { email, password } = RegisterSchema.parse(req.body);

      if (await prisma.user.findUnique({ where: { email } })) {
        return res.status(400).json({ error: "User already exists" });
      }

      const hashedPassword = await argon2.hash(password);

      await prisma.user
        .create({
          data: {
            email,
            password: hashedPassword,
          },
        })
        .then(async (user) => {
          const verificationToken = await prisma.verificationToken.create({
            data: {
              identifier: user.id,
              token: crypto.randomBytes(64).toString("hex"),
              expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
            },
          });

          return { user, verificationToken };
        })
        .then(async ({ user, verificationToken }) => {
          await pub.send(
            { exchange: "user.events", routingKey: "users.register" },
            { user, verificationToken }
          );
        });

      return res.status(201).json({
        message: "User registered successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({
          error: error,
        });
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

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        {
          expiresIn: "15m",
        }
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      return res.status(200).json({ message: "Refresh success" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({
          error: "Internal server error",
        });
      }
    }
  },

  async verify(req: Request, res: Response) {
    try {
      const { token } = VerifySchema.parse(req.query);

      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        return res.status(400).json({ error: "Invalid token" });
      }

      if (verificationToken.expires < new Date()) {
        return res.status(400).json({ error: "Token expired" });
      }

      await prisma.user
        .update({
          where: { id: verificationToken.identifier },
          data: { isVerified: true },
        })
        .then(async () => {
          await prisma.verificationToken.delete({
            where: { token },
          });
        });

      return res.status(200).json({ message: "User verified" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({
          error: "Internal server error",
        });
      }
    }
  },
};
