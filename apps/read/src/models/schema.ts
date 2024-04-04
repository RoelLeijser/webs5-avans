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
  reactions?: Ref<TargetReaction>[];

  @prop({ default: Date.now })
  createdAt?: Date;

  @prop({ default: Date.now })
  updatedAt?: Date;

  @prop({ type: () => [String] })
  likes?: Ref<Like>[];

  static paginate: PaginateMethod<Target>;
}

class TargetReaction {
  @prop()
  _id?: string;

  @prop()
  ownerId?: string;

  @prop({ ref: () => Target })
  target?: Ref<Target>;

  @prop()
  targetId?: string;

  @prop()
  imageUrl?: string;

  @prop({ default: 0 })
  score?: number;

  @prop({ type: () => [Like] })
  likes?: Ref<Like>[];

  @prop({ default: Date.now })
  createdAt?: Date;

  @prop({ default: Date.now })
  updatedAt?: Date;
}

class Like {
  @prop()
  _id?: string;

  @prop()
  userId?: string;

  @prop({ ref: () => Target })
  target?: Ref<Target>;

  @prop()
  targetId?: string;

  @prop({ ref: () => TargetReaction })
  targetReaction?: Ref<TargetReaction>;

  @prop()
  targetReactionId?: string;

  @prop()
  liked?: boolean;
}

export const TargetModel = getModelForClass(Target);
export const TargetReactionModel = getModelForClass(TargetReaction);
export const LikeModel = getModelForClass(Like);
