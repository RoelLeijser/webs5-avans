import { createServer } from "./server";

const port = process.env.GATEWAY_PORT || 3000;
const server = createServer();

server.listen(port, () => {
  console.log(`api running on ${port}`);
});
