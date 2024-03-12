import { createServer } from "./server";
import { env } from "./env";

const port = env.GATEWAY_PORT;
const server = createServer();

server.listen(port, () => {
  console.log(`Gateway running on ${port}`);
});
