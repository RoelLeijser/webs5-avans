import { Router } from "express";
import { ExpressAuth } from "@auth/express";
import GitHubProvider from "@auth/express/providers/github";
import CredentialsProvider from "@auth/express/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import type { Adapter } from "@auth/express/adapters";

const prisma = new PrismaClient();

export const authRouter: Router = Router();

authRouter.use(
  "/api/auth/*",
  ExpressAuth({
    adapter: PrismaAdapter(prisma) as Adapter,
    secret: process.env.AUTH_SECRET,
    providers: [
      // CredentialsProvider({
      //   name: "Credentials",
      //   credentials: {
      //     username: { label: "Username", type: "text" },
      //     password: { label: "Password", type: "password" },
      //   },
      //   async authorize(credentials, req) {
      //     const user = { id: "1", username: "test", email: "root@localhost" };

      //     if (
      //       credentials.username === "test" &&
      //       credentials.password === "test"
      //     ) {
      //       return user;
      //     }

      //     return null;
      //   },
      // }),
      GitHubProvider({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      }),
    ],
    callbacks: {
      async jwt({ token, user, account, profile }) {
        if (user) {
          token.id = user.id;
        }
        return token;
      },
    },
  })
);
