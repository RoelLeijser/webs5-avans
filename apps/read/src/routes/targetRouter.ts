import { Router } from "express";
import { readController } from "../controllers/readController";

export const targetRouter: Router = Router({
  mergeParams: true,
});

targetRouter.get("/:id", (req, res) => {
  console.log(req.params);
  readController.getOne(req, res);
});

targetRouter.get("/", (req, res) => {
  readController.getAll(req, res);
});
