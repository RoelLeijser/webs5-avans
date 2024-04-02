import { Router } from "express";
import { targetReactionController } from "../controllers/targetReactionController";
import multer from "multer";

export const targetReactionRouter: Router = Router({ mergeParams: true });

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
});

targetReactionRouter.post("/", upload.single("image"), async (req, res) => {
  return await targetReactionController.create(req, res);
});

targetReactionRouter.patch("/:id/like", async (req, res) => {
  return await targetReactionController.like(req, res);
});

targetReactionRouter.route("/:id").delete(async (req, res) => {
  return await targetReactionController.delete(req, res);
});
