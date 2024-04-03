import Express from "express";
import swaggerUi from "swagger-ui-express";
import { env } from ".";

import * as swaggerDocument from "./swagger.json";

const app = Express();
const port =
  new URL(env.).port ||
  (new URL(env.AUTH_URL).protocol === "https:" ? "443" : "80");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3005, () => {
  console.log("Docs server is running on port 3005");
});
