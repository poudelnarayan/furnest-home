import { createFulfillmentWorker } from "@/lib/queue/bullmq";

createFulfillmentWorker(async (job) => {
  // Keep fulfillment steps modular for future game vendor APIs.
  if (job.name === "deliver-topup") {
    return { delivered: true, provider: "manual-or-future-api" };
  }

  if (job.name === "ship-physical") {
    return { packed: true };
  }

  return { skipped: true };
});
