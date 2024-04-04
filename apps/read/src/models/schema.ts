import { prop, getModelForClass, type Ref, plugin } from "@typegoose/typegoose";
import { FilterQuery, PaginateOptions, PaginateResult } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

type PaginateMethod<T> = (
  query?: FilterQuery<T>,
  options?: PaginateOptions,
  callback?: (err: any, result: PaginateResult<T>) => void
) => Promise<PaginateResult<T>>;

@plugin(mongoosePaginate)
class Target {
  @prop()
  _id?: string;

  @prop()
  ownerId?: string;

  @prop()
  imageUrl?: string;

  @prop({ type: [Number], index: "2dsphere" }) // Define the location field
  coordinates?: [number, number]; // Array containing [latitude, longitude]

  @prop()
  endDate?: Date;

  @prop({ type: () => [TargetReaction] })
  reactions?: TargetReaction[];

  @prop({ default: Date.now })
  createdAt?: Date;

  @prop({ default: Date.now })
  updatedAt?: Date;

  @prop({ type: Number, default: 0 })
  likes?: number;

  @prop({ type: Number, default: 0 })
  dislikes?: number;

  static paginate: PaginateMethod<Target>;
}

class TargetReaction {
  @prop()
  _id?: string;

  @prop()
  ownerId?: string;

  @prop({ ref: Target })
  target?: Target;

  @prop()
  targetId?: string;

  @prop()
  imageUrl?: string;

  @prop({ default: 0 })
  score?: number;

  @prop({ type: Number, default: 0 })
  likes?: number;

  @prop({ type: Number, default: 0 })
  dislikes?: number;

  @prop({ default: Date.now })
  createdAt?: Date;

  @prop({ default: Date.now })
  updatedAt?: Date;
}

export const TargetModel = getModelForClass(Target);
export const TargetReactionModel = getModelForClass(TargetReaction);
