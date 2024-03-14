import { createServer } from "./server";
import { env } from "./env";
import { URL } from "url";

const port =
  new URL(env.AUTH_URL).port ||
  (new URL(env.AUTH_URL).protocol === "https:" ? "443" : "80");
const server = createServer();

server.listen(port, () => {
  console.log(`Auth running on ${env.AUTH_URL}`);
});
