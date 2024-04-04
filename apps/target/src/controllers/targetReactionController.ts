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

const prisma = new PrismaClient();

const CreateTargetRequestSchema = z.object({
  params: z.object({
    targetId: z.string(),
  }),
  user: z.object({
    id: z.string(),
  }),
  file: z.object({
    buffer: z.instanceof(Buffer),
    mimetype: z.string().startsWith("image/"),
  }),
});

const DeleteTargetReactionRequestSchema = z.object({
  id: z.string(),
});

const LikeTargetReactionRequestSchema = z.object({
  params: z.object({
    id: z.string(),
    targetId: z.string(),
  }),
  body: z.object({
    liked: z.boolean().nullable(),
  }),
  user: z.object({
    id: z.string(),
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
      const { params, user, file } = CreateTargetRequestSchema.parse(req);

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
          ownerId: user.id,
          imageKey: key,
          imageUrl: `${env.CLOUDFRONT_URL}/${key}`,
        },
      });

      await pub.send(
        {
          exchange: "target-events",
          routingKey: "targetReaction.created",
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
    try {
      const { id } = DeleteTargetReactionRequestSchema.parse(req.params);

      const targetReaction = await prisma.targetReaction.findUnique({
        where: { id },
      });

      if (!targetReaction) {
        return res.status(404).json({ message: "Target reaction not found" });
      }

      const command = new DeleteObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: targetReaction.imageKey,
      });

      await prisma.targetReaction
        .delete({
          where: { id },
        })
        .then(async () => {
          await s3.send(command);
        })
        .then(async () => {
          await pub.send(
            {
              exchange: "target-events",
              routingKey: "targetReaction.deleted",
            },
            {
              targetReaction,
            }
          );
        });

      return res.json({ message: `Delete target reaction ${id}` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      } else {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  },
  like: async (req: Request, res: Response) => {
    try {
      const { params, body, user } = LikeTargetReactionRequestSchema.parse(req);

      const targetReaction = await prisma.targetReaction.findUnique({
        where: { id: params.id },
      });

      if (!targetReaction) {
        return res.status(404).json({ message: "Target reaction not found" });
      }

      const like = await prisma.like.findFirst({
        where: {
          userId: user.id,
          targetReactionId: params.id,
        },
      });

      if (like) {
        await prisma.like.delete({
          where: {
            id: like.id,
          },
        });
      }

      if (body.liked === null) {
        await prisma.like.deleteMany({
          where: {
            userId: user.id,
            targetReactionId: params.id,
          },
        });
      } else {
        await prisma.like.create({
          data: {
            TargetReaction: { connect: { id: params.id } },
            userId: user.id,
            liked: body.liked,
          },
        });
      }

      const likes = await prisma.like.count({
        where: {
          targetReactionId: params.id,
          liked: true,
        },
      });
      const dislikes = await prisma.like.count({
        where: {
          targetReactionId: params.id,
          liked: false,
        },
      });
      await pub.send(
        {
          exchange: "target-events",
          routingKey: "targetReaction.liked",
        },
        {
          targetReaction,
          likes,
          dislikes,
        }
      );

      return res.json({ message: "Success" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      } else {
        console.log(error);

        return res.status(500).json({ error });
      }
    }
  },
};
