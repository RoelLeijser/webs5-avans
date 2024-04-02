import crypto from "node:crypto";

export const randomString = (bytes: number = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};
