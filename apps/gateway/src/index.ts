import { createServer } from "./server";
import { env } from "./env";
import { URL } from "url";

// get port from url
const port =
  new URL(env.GATEWAY_URL).port ||
  (new URL(env.GATEWAY_URL).protocol === "https:" ? "443" : "80");
const server = createServer();

server.listen(port, () => {
  console.log(`Gateway running on ${env.GATEWAY_URL}`);
});
