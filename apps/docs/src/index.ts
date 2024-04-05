import Express from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./env";

import * as swaggerDocument from "./swagger.json";

const app = Express();
const port =
  new URL(env.DOCS_URL).port ||
  (new URL(env.DOCS_URL).protocol === "https:" ? "443" : "80");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
  console.log(`Docs server listening at ${env.DOCS_URL}`);
});
