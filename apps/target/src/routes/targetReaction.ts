import { Router } from "express";
import { targetReactionController } from "../controllers/targetReactionController";
import multer from "multer";
import { defineAbilityFor } from "../middleware/defineAbility";

export const targetReactionRouter: Router = Router({ mergeParams: true });

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (_, file, cb) => {
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
  const ability = defineAbilityFor(req.user);

  if (!ability.can("create", "TargetReaction")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return await targetReactionController.create(req, res);
});

targetReactionRouter.patch("/:id/like", async (req, res) => {
  const ability = defineAbilityFor(req.user);

  if (!ability.can("like", "TargetReaction")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return await targetReactionController.like(req, res);
});

targetReactionRouter.route("/:id").delete(async (req, res) => {
  const ability = defineAbilityFor(req.user);

  if (!ability.can("delete", "TargetReaction")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return await targetReactionController.delete(req, res);
});
