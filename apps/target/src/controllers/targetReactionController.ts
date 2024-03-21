import { Request, Response } from "express";

export const targetReactionController = {
  create: async (req: Request, res: Response) => {
    return res.json({
      message: `Created targetReaction for target ${req.params.targetId}`,
    });
  },

  update: async (req: Request, res: Response) => {
    return res.json({ message: `Updated targetReaction ${req.params.id}` });
  },

  delete: async (req: Request, res: Response) => {
    return res.json({ message: `Deleted targetReaction ${req.params.id}` });
  },
};
