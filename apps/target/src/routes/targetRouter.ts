import { Router } from "express";
import { targetController } from "../controllers/targetController";
import multer from "multer";
import { defineAbilityFor } from "../middleware/defineAbility";

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
  const ability = defineAbilityFor(req.user);

  if (!ability.can("create", "Target")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return await targetController.create(req, res);
});

targetRouter.patch("/:targetId/like", async (req, res) => {
  const ability = defineAbilityFor(req.user);

  if (!ability.can("like", "Target")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return await targetController.like(req, res);
});

targetRouter
  .route("/:targetId")
  .patch(async (req, res) => {
    const ability = defineAbilityFor(req.user);

    if (!ability.can("update", "Target")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return await targetController.update(req, res);
  })
  .delete(async (req, res) => {
    const ability = defineAbilityFor(req.user);

    if (!ability.can("delete", "Target")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return await targetController.delete(req, res);
  });
