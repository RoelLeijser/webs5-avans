import { RegisterSchema } from "./schemas";
import { Resend } from "resend";
import { VerifyEmail } from "@webs5/transactional";
import { env } from "./env";
import { z } from "zod";

const resend = new Resend(env.RESEND_API_KEY);

type Event = z.infer<typeof RegisterSchema>;

export async function sendVerificationEmail(event: Event) {
  const { data, error } = await resend.emails.send({
    from: "Photo pRESTiges <noreply@silly.media>",
    to: [event.user.email],
    subject: "Photo pRESTiges email verification",
    react: VerifyEmail({
      url: `${env.GATEWAY_URL}/auth/verify?token=${event.verificationToken.token}`,
    }),
  });
  if (error) {
    throw new Error(error.message);
  } else if (data) {
    console.log(data);
  }
}
