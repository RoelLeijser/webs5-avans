import { Request, Response } from "express";
import { TargetModel } from "../models/schema";
import { z } from "zod";

const TargetParamsSchema = z.object({
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
  page: z
    .preprocess((val) => Number(val), z.number())
    .optional()
    .default(1),
  limit: z
    .preprocess((val) => Number(val), z.number())
    .optional()
    .default(10),
});

export const readController = {
  async getAll(req: Request, res: Response) {
    try {
      const params = TargetParamsSchema.parse(req.query);

      let query = {};

      query = {
        ...(params.isAfter && { endDate: { $gte: params.isAfter } }),
        ...(params.isBefore && { endDate: { $lte: params.isBefore } }),
        ...(params.lat &&
          params.lng && {
            coordinates: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [params.lat, params.lng],
                },
                $maxDistance: params.maxDistance || 5000, // Maximum distance from the given point in meters (default is 5km)
              },
            },
          }),
      };

      const targets = await TargetModel.paginate(query, {
        page: params.page,
        limit: params.limit,
      });
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
