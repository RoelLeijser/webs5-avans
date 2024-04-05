import { z } from "zod";

export const UserSchema = z.object({
  _id: z.string(),
  email: z.string(),
});

export const VerificationTokenSchema = z.object({
  identifier: z.string(),
  token: z.string(),
  expires: z.string(),
});

export const RegisterSchema = z.object({
  user: UserSchema,
  verificationToken: VerificationTokenSchema,
});

const User = z.object({
  ownerId: z.string(),
  score: z.number(),
});

export const TargetResultSchema = z.object({
  reactions: z.array(User.optional()),
  winner: User.optional(),
});
