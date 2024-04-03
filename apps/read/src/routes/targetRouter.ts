import { Router } from "express";
import { readController } from "../controllers/readController";

export const targetRouter: Router = Router();

targetRouter.get("/target/:id", (req, res) => {
  console.log(req.params);
  readController.getOne(req, res);
});

targetRouter.get("/targets", (req, res) => {
  readController.getAll(req, res);
});
