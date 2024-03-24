import { Router } from "express";
import { targetController } from "../controllers/targetController";
import multer from "multer";

export const targetRouter: Router = Router();

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

targetRouter.post("/", upload.single("image"), async (req, res) => {
  return await targetController.create(req, res);
});

targetRouter
  .route("/:targetId")
  .patch(async (req, res) => {
    return await targetController.update(req, res);
  })
  .delete(async (req, res) => {
    return await targetController.delete(req, res);
  });
