import { Request, Response } from "express";
import { env } from "../env";
import { z } from "zod";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomString } from "../utils/randomString";
import { PrismaClient } from "@prisma/client";
import { pub } from "../rabbitmq";

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: env.S3_BUCKET_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

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

const UpdateTargetRequestSchema = z.object({
  params: z.object({
    targetId: z.string(),
  }),
  body: z.object({
    latitude: z.number(),
    longitude: z.number(),
    endDate: z.string().transform((arg) => new Date(arg)),
  }),
});

const DeleteTargetRequestSchema = z.object({
  targetId: z.string(),
});

const LikeTargetRequestSchema = z.object({
  params: z.object({
    targetId: z.string(),
  }),
  body: z.object({
    userId: z.string(),
    liked: z.boolean().nullable(),
  }),
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

      const imageUrl = `${env.CLOUDFRONT_URL}/${key}`;

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

      await pub.send(
        { exchange: "target-events", routingKey: "target.created" },
        { target }
      );

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
    const { params, body } = UpdateTargetRequestSchema.parse(req);

    const target = await prisma.target.findUnique({
      where: { id: params.targetId },
    });

    if (!target) {
      return res.status(404).json({ error: "Target not found" });
    }

    const updatedTarget = await prisma.target
      .update({
        where: { id: params.targetId },
        data: {
          latitude: body.latitude,
          longitude: body.longitude,
          endDate: body.endDate,
        },
      })
      .then(async (target) => {
        await pub.send(
          { exchange: "target-events", routingKey: "target.updated" },
          { target: target }
        );
      });

    return res.json({ message: "Update target", updatedTarget });
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
        .then(async () => {
          await pub.send(
            { exchange: "target-events", routingKey: "target.deleted" },
            { target }
          );
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
  async like(req: Request, res: Response) {
    try {
      const { params, body } = LikeTargetRequestSchema.parse(req);

      const target = await prisma.target.findUnique({
        where: { id: params.targetId },
      });

      if (!target) {
        return res.status(404).json({ error: "Target not found" });
      }

      const like = await prisma.like.findFirst({
        where: {
          userId: body.userId,
          targetId: params.targetId,
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
        prisma.like.deleteMany({
          where: {
            userId: body.userId,
            targetId: params.targetId,
          },
        });
      } else {
        await prisma.like.create({
          data: {
            userId: body.userId,
            liked: body.liked,
            Target: {
              connect: {
                id: params.targetId,
              },
            },
          },
        });
      }
      const likes = await prisma.like.count({
        where: {
          targetId: params.targetId,
          liked: true,
        },
      });
      const dislikes = await prisma.like.count({
        where: {
          targetId: params.targetId,
          liked: false,
        },
      });
      //create rabbit pub for like
      await pub.send(
        { exchange: "target-events", routingKey: "target.liked" },
        {
          targetId: target.id,
          likes,
          dislikes,
        }
      );
      return res.json({ message: "Success" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      } else {
        return res.status(500).json({ error: error });
      }
    }
  },
};
