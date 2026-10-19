import express, { type Express } from "express";
import path from "node:path";
import fs from "node:fs";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.use(pinoHttp({
  logger,
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url?.split("?")[0] }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use("/api", router);
app.use("/api", (_req, res) => { res.status(404).json({ error: "Not found" }); });

const publicDir = path.resolve(import.meta.dirname, "../../agent-platform/dist/public");
if (fs.existsSync(path.join(publicDir, "index.html"))) {
  app.use(express.static(publicDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || !req.accepts("html")) { next(); return; }
    res.sendFile(path.join(publicDir, "index.html"));
  });
}
export default app;
