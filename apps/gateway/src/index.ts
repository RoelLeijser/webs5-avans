import { createServer } from "./server";
import { env } from "./env";

const port = env.GATEWAY_PORT || 3000;
const server = createServer();

server.listen(port, () => {
  console.log(`Gateway running on ${port}`);
});
