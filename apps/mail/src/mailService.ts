import { RegisterSchema, TargetResultSchema } from "./schemas";
import { Resend } from "resend";
import { VerifyEmail, ResultEmail } from "@webs5/transactional";
import { env } from "./env";
import { z } from "zod";
import { UserModel } from "./models/schema";

const resend = new Resend(env.RESEND_API_KEY);

type Event = z.infer<typeof RegisterSchema>;

export async function sendVerificationEmail(event: Event) {
  const { error } = await resend.emails.send({
    from: "Photo pRESTiges <noreply@silly.media>",
    to: [event.user.email],
    subject: "Photo pRESTiges email verification",
    react: VerifyEmail({
      url: `${env.GATEWAY_URL}/auth/verify?token=${event.verificationToken.token}`,
    }),
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function sendTargetResultEmail(
  event: z.infer<typeof TargetResultSchema>
) {
  // get list of emails from event.reactions
  const userRecords = await UserModel.find({
    _id: { $in: event.reactions.map((r) => r!.ownerId) },
  }).select("email");

  // create an array of emails, with id's and scores
  const users = userRecords.map((r) => ({
    email: r.email,
    score: event.reactions.find((re) => re!.ownerId === r._id)?.score,
  }));

  for (const user of users) {
    //check if user has a score
    if (user.score === undefined) {
      console.log("No score found for user", user.email);
      continue;
    }

    //check is user has an email
    if (!user.email) {
      console.log("No email found for user", user.email);
      continue;
    }

    const { data, error } = await resend.emails.send({
      from: "Photo pRESTiges <noreply@silly.media>",
      to: [user.email],
      subject: "Photo pRESTiges results",
      react: ResultEmail({
        score: user.score,
        winner: event.winner || { score: 0 },
      }),
    });

    if (error) {
      throw new Error(error.message);
    } else if (data) {
      console.log("Email successfully sent to", user.email);
    }
  }
}
