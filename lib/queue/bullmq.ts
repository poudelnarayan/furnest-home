import { Job, Queue, Worker } from "bullmq";
import { env } from "@/lib/config/env";

const connection = {
  url: env.REDIS_URL,
};

export const fulfillmentQueue = new Queue("fulfillment", { connection });

type FulfillmentProcessor = (job: Job) => Promise<unknown>;

export function createFulfillmentWorker(processor: FulfillmentProcessor) {
  return new Worker("fulfillment", processor, { connection });
}
