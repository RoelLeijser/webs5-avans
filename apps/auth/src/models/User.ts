import { getModelForClass, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";

class User {
  @prop({ default: () => new mongoose.Types.ObjectId() })
  _id!: mongoose.Types.ObjectId;

  @prop({ required: true, unique: true })
  email!: string;

  @prop({ required: true })
  password!: string;

  @prop({ default: "user" })
  role!: string;

  @prop({ default: false })
  isVerified!: boolean;
}

export const UserModel = getModelForClass(User, {
  schemaOptions: { timestamps: true },
});
