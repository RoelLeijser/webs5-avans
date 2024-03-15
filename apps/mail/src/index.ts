import { Resend } from "resend";
// import { VerifyEmail } from "@webs5/transactional/dist/index.js";
import { env } from "./env";

console.log(`Mail running on ${env.MAIL_URL}`);

const resend = new Resend(env.RESEND_API_KEY);

// const { data, error } = await resend.emails.send({
//   from: "Acme <no-reply@asdf.test>",
//   to: ["roelleijser@gmail.com"],
//   subject: "hello world",
//   react: VerifyEmail({
//     url: "https://resend.dev",
//   }),
// });

// if (error) {
//   console.log(error);
// } else if (data) {
//   console.log(data);
// }
