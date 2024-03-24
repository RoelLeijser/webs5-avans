import { Request, Response } from "express";
import { env } from "../env";
import { z } from "zod";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: env.S3_BUCKET_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const randomString = (bytes: number = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

const CreateTargetRequestSchema = z.object({
  body: z.object({
    ownerId: z.string(),
    latitude: z.preprocess((val) => Number(val), z.number()),
    longitude: z.preprocess((val) => Number(val), z.number()),
    endDate: z.string().transform((arg) => new Date(arg)),
  }),
  file: z.object({
    buffer: z.instanceof(Buffer),
    mimetype: z.string().startsWith("image/"),
  }),
});

const DeleteTargetRequestSchema = z.object({
  targetId: z.string(),
});

export const targetController = {
  create: async (req: Request, res: Response) => {
    try {
      const { body, file } = CreateTargetRequestSchema.parse(req);

      const key = randomString();

      const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3.send(command);

      const imageUrl = `${env.CLOUDFLARE_URL}/${key}`;

      const target = await prisma.target.create({
        data: {
          ownerId: body.ownerId,
          latitude: body.latitude,
          longitude: body.longitude,
          endDate: body.endDate,
          imageKey: key,
          imageUrl,
        },
      });

      return res.json({
        message: target,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      } else {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  },

  update: async (req: Request, res: Response) => {
    return res.json({ message: `Update target ${req.params.targetId}` });
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { targetId } = DeleteTargetRequestSchema.parse(req.params);

      const target = await prisma.target.findUnique({
        where: { id: targetId },
      });

      if (!target) {
        return res.status(404).json({ error: "Target not found" });
      }

      const command = new DeleteObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: target.imageKey,
      });

      await prisma.target
        .delete({ where: { id: targetId } })
        .then(async () => {
          await s3.send(command);
        })
        .then((target) => {
          //send to rabbitmq
        });

      return res.json({ message: `Delete target ${targetId}` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      } else {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  },
};
