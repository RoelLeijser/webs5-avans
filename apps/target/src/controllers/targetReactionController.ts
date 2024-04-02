import { Request, Response } from "express";
import { env } from "../env";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomString } from "../utils/randomString";
import { pub } from "../rabbitmq";
import { Envelope } from "rabbitmq-client";

const prisma = new PrismaClient();

const CreateTargetRequestSchema = z.object({
  params: z.object({
    targetId: z.string(),
  }),
  body: z.object({
    ownerId: z.string(),
  }),
  file: z.object({
    buffer: z.instanceof(Buffer),
    mimetype: z.string().startsWith("image/"),
  }),
});

const s3 = new S3Client({
  region: env.S3_BUCKET_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export const targetReactionController = {
  create: async (req: Request, res: Response) => {
    try {
      const { params, body, file } = CreateTargetRequestSchema.parse(req);

      const target = await prisma.target.findUnique({
        where: { id: params.targetId },
      });

      if (!target) {
        return res.status(404).json({ message: "Target not found" });
      }

      if (target.endDate < new Date()) {
        return res.status(400).json({ message: "Target has already ended" });
      }

      const key = randomString();

      const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3.send(command);

      const targetReaction = await prisma.targetReaction.create({
        data: {
          Target: { connect: { id: params.targetId } },
          ownerId: body.ownerId,
          imageKey: key,
          imageUrl: `${env.CLOUDFRONT_URL}/${key}`,
        },
      });

      await pub.send(
        {
          exchange: "target-events",
          routingKey: "targetReactionCreated",
        },
        {
          target,
          targetReaction,
        }
      );

      return res.json({
        target,
        targetReaction,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      } else {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  },

  delete: async (req: Request, res: Response) => {
    return res.json({ message: `Deleted targetReaction ${req.params.id}` });
  },
};
