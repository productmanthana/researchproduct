import app from "./app";
import { logger } from "./lib/logger";
import { processNextAnalysis } from "./lib/research-engine";
import { initialiseRegistry } from "./lib/source-registry";
import { initialiseStudio } from "./lib/studio-store";
import { processStudioJob } from "./lib/studio-worker";
import { syncPendingProjectItem } from "./lib/studio-index";
import { initialiseWatches } from "./lib/watch-store";
import { processResearchWatch } from "./lib/watch-worker";

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
await initialiseWatches();
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  setInterval(() => { void processNextAnalysis().catch(() => logger.error("Research worker database unavailable")); }, 2000).unref();
  setInterval(() => { void processStudioJob().catch(() => logger.error("Project worker unavailable")); }, 2000).unref();
  setInterval(() => { void syncPendingProjectItem().catch(() => logger.error("Project index worker unavailable")); }, 5000).unref();
  // Persistent due dates survive restarts. Catch up once, then check the queue
  // every minute; only one fenced watch job runs in each process at a time.
  void processResearchWatch().catch(()=>logger.error("Research Watch scheduler unavailable"));
  setInterval(()=>{void processResearchWatch().catch(()=>logger.error("Research Watch scheduler unavailable"));},60000).unref();
});
