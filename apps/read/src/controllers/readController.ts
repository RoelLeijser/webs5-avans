import { Request, Response } from "express";
import { TargetModel } from "../models/schema";
import { z } from "zod";

const AllTargetsRequestSchema = z.object({
  isAfter: z
    .string()
    .transform((arg) => new Date(arg))
    .optional(),
  isBefore: z
    .string()
    .transform((arg) => new Date(arg))
    .optional(),
  lat: z
    .preprocess((val) => Number(val), z.number().min(-90).max(90))
    .optional(),
  lng: z
    .preprocess((val) => Number(val), z.number().min(-180).max(180))
    .optional(),
  maxDistance: z.preprocess((val) => Number(val), z.number().min(0)).optional(),
});

export const readController = {
  async getAll(req: Request, res: Response) {
    try {
      const { isAfter, isBefore, lat, lng, maxDistance } =
        AllTargetsRequestSchema.parse(req.query);

      let query = {};

      query = {
        ...(isAfter && { endDate: { $gte: isAfter } }),
        ...(isBefore && { endDate: { $lte: isBefore } }),
        ...(lat &&
          lng && {
            coordinates: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [lat, lng],
                },
                $maxDistance: maxDistance || 5000, // Maximum distance from the given point in meters (default is 5km)
              },
            },
          }),
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
