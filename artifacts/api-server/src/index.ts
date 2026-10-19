import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env.PORT || 8080);
if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error("PORT must be a valid TCP port.");

// Provision a fresh schema explicitly before use. Do not run migrations or
// seeding against a database inherited from another application.
app.listen(port, "0.0.0.0", () => { logger.info({ port }, "AgentOS server listening"); });
