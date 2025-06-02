import { asClass, AwilixContainer, Lifetime } from "awilix";
import { JobsCache } from "./jobs.cache";
import { JobManager } from "./job.manager";
import { JobConsumer } from "./job.consumer";

export const registerServices = (container: AwilixContainer) => {
  container.register({
    jobsCache: asClass(JobsCache, {
      lifetime: Lifetime.SINGLETON,
    }),
    jobManager: asClass(JobManager, {
      lifetime: Lifetime.SINGLETON,
    }),
    jobConsumer: asClass(JobConsumer),
  });
};
