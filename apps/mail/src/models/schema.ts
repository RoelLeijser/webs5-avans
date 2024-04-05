import { prop, getModelForClass } from "@typegoose/typegoose";

export class User {
  @prop({ required: true })
  _id!: string;

  @prop({ required: true, unique: true })
  email?: string;
}

export const UserModel = getModelForClass(User);
