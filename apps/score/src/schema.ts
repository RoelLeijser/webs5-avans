import { getModelForClass, prop } from "@typegoose/typegoose";

class scoreSchema {
  @prop()
  score?: number;
  @prop()
  targetId?: string;
  @prop()
  responseId?: string;
}

const getScoreByTargetId = async (targetId: string) => {
  const scoreModel = getModelForClass(scoreSchema);
  return scoreModel.find({ targetId });
};

const getScoreByResponseId = async (responseId: string) => {
  const scoreModel = getModelForClass(scoreSchema);
  return scoreModel.find({ responseId });
};

const uploadScore = async (
  score: number,
  targetId: string,
  responseId: string
) => {
  const scoreModel = getModelForClass(scoreSchema);
  return scoreModel.create({ score, targetId, responseId });
};

export { getScoreByTargetId, getScoreByResponseId, uploadScore };
