import { getModelForClass, prop } from "@typegoose/typegoose";

class VerificationToken {
  @prop({ required: true })
  identifier!: string;

  @prop({ required: true, unique: true })
  token!: string;

  @prop({ required: true })
  expires!: Date;
}

export const VerificationTokenModel = getModelForClass(VerificationToken);
