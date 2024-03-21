import { Router } from "express";
import { targetController } from "../controllers/targetController";

export const targetRouter: Router = Router();

targetRouter.post("/", async (req, res) => {
  return await targetController.create(req, res);
});

targetRouter
  .route("/:targetId")
  .put(async (req, res) => {
    return await targetController.update(req, res);
  })
  .delete(async (req, res) => {
    return await targetController.delete(req, res);
  });
