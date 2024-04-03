import { prop, getModelForClass, type Ref } from "@typegoose/typegoose";

class Target {
  @prop()
  _id?: string;

  @prop()
  ownerId?: string;

  @prop({ unique: true })
  imageUrl?: string;

  @prop()
  latitude?: number;

  @prop()
  longitude?: number;

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

  @prop({ unique: true })
  imageUrl?: string;

  @prop({ default: 0 })
  score?: number;

  @prop({ type: () => [String] })
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
