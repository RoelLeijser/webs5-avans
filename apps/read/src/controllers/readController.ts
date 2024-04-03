import { Request, Response, query } from "express";
import { TargetModel } from "../models/schema";
import { ReturnModelType } from "@typegoose/typegoose";
import { z } from "zod";

const AllTargetsRequestSchema = z
  .object({
    isAfter: z
      .string()
      .transform((arg) => new Date(arg))
      .optional(),
    isBefore: z
      .string()
      .transform((arg) => new Date(arg))
      .optional(),
    lat: z.number().min(-90).max(90).optional(),
    long: z.number().min(-180).max(180).optional(),
    maxDistance: z.number().optional(),
  })
  .refine((data) => data.lat !== undefined && data.long !== undefined, {
    message: "Both latitude and longitude must be provided together",
  });

export const readController = {
  async getAll(req: Request, res: Response) {
    try {
      const { isAfter, isBefore, lat, long } = AllTargetsRequestSchema.parse(
        req.query
      );

      let query = {};

      query = {
        ...(isAfter && { createdAt: { $gte: isAfter } }),
        ...(isBefore && { createdAt: { $lte: isBefore } }),
      };

      const targets = await TargetModel.find(query);
      return res.json(targets);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json(error.errors);
      }
      return res.status(500).json(error);
    }
  },
  async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const target = await TargetModel.findById(id)
        .populate("likes")
        .populate("reactions");
      return res.json(target);
    } catch (error) {
      return res.status(404).send("Target not found");
    }
  },
};
