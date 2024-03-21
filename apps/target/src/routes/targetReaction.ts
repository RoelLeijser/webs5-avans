import { Router } from "express";
import { targetReactionController } from "../controllers/targetReactionController";

export const targetReactionRouter: Router = Router({ mergeParams: true });

targetReactionRouter.post("/", async (req, res) => {
  return await targetReactionController.create(req, res);
});

targetReactionRouter
  .route("/:id")
  .put(async (req, res) => {
    return await targetReactionController.update(req, res);
  })
  .delete(async (req, res) => {
    return await targetReactionController.delete(req, res);
  });
