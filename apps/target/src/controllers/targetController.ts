import { Request, Response } from "express";

export const targetController = {
  create: async (req: Request, res: Response) => {
    const { ownerId, location } = req.body;

    // Access uploaded file information
    const imageFile = req.file;

    const locationObject = JSON.parse(location);

    return res.json({
      ownerId,
      locationObject,
      image: {
        originalName: imageFile?.originalname,
        mimetype: imageFile?.mimetype,
        size: imageFile?.size,
      },
    });
  },

  update: async (req: Request, res: Response) => {
    return res.json({ message: `Update target ${req.params.targetId}` });
  },

  delete: async (req: Request, res: Response) => {
    return res.json({ message: `Delete target ${req.params.targetId}` });
  },
};
