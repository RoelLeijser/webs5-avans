import { DocumentType, getModelForClass, prop } from "@typegoose/typegoose";
import * as mongoose from "mongoose";

class Clock {
  //generate date field
  @prop({ type: () => String, required: true })
  target_id: string;

  @prop({ required: true })
  end_date: Date;
}

async function createModel(target: string, date: Date) {
  const clock = getModelForClass(Clock);
  await clock.create({ target_id: target, end_date: date });
  console.log("Model created");
}

async function updateModel(target: string, date: Date) {
  const clock = getModelForClass(Clock);
  await clock.updateOne({ target_id: target }, { end_date: date });
}

async function getModelById(target_id: string) {
  const clock = getModelForClass(Clock);
  const result = clock.find({ target_id });
  return result;
}

async function getAllModels() {
  const clock = getModelForClass(Clock);
  const result = await clock.find({});
  return result;
}

async function deleteModel(target_id: string) {
  const clock = getModelForClass(Clock);
  await clock.deleteOne({ target_id });
}

export { createModel, getModelById, getAllModels, deleteModel, updateModel };
