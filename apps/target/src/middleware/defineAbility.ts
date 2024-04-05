import { TargetReaction, Target } from "@prisma/client";
import { PureAbility, AbilityBuilder } from "@casl/ability";
import { createPrismaAbility, PrismaQuery, Subjects } from "@casl/prisma";

type AppAbility = PureAbility<
  [
    string,
    Subjects<{
      TargetReaction: TargetReaction;
      Target: Target;
    }>,
  ],
  PrismaQuery
>;

export const defineAbilityFor = (user: JwtUser) => {
  const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

  if (user.role === "admin") {
    can("manage", "TargetReaction");
    can("manage", "Target");
  } else if (user.role === "user") {
    can("create", "TargetReaction");
    can("update", "TargetReaction", { ownerId: user.id });
    can("delete", "TargetReaction", { ownerId: user.id });
    can("like", "TargetReaction");

    can("like", "Target");
  } else {
    can("read", "TargetReaction");
    can("read", "Target");
  }

  return build();
};
