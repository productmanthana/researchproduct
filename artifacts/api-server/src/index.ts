import app from "./app";
import { logger } from "./lib/logger";
import { processNextAnalysis } from "./lib/research-engine";
import { initialiseRegistry } from "./lib/source-registry";
import { initialiseStudio } from "./lib/studio-store";
import { processStudioJob } from "./lib/studio-worker";
import { syncPendingProjectItem } from "./lib/studio-index";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await initialiseRegistry();
await initialiseStudio();
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  setInterval(() => { void processNextAnalysis().catch(() => logger.error("Research worker database unavailable")); }, 2000).unref();
  setInterval(() => { void processStudioJob().catch(() => logger.error("Project worker unavailable")); }, 2000).unref();
  setInterval(() => { void syncPendingProjectItem().catch(() => logger.error("Project index worker unavailable")); }, 5000).unref();
});
