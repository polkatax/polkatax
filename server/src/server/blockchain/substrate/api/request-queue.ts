import PQueue from "p-queue";

export const apiThrottleQueue = new PQueue({
  interval: 1000,
  intervalCap: 4, // subscan supports 5 calls per minute. To prevent occasional 429 errors, intervalCap is reduced to 4.
  carryoverConcurrencyCount: true,
});
