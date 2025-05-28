import { InjectionMode, asValue, createContainer } from "awilix";
import { registerServices as registerBlockchainServices } from "./blockchain/registerServices";
import { registerServices as registerDataAggregationServices } from "./data-aggregation/registerServices";
import { registerServices as registerJobServices } from "./job-management/registerServices";
import { registerServices as registerEndpointsServices } from "./endpoints/registerServices";

export const createDIContainer = () => {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  });
  registerBlockchainServices(container);
  registerDataAggregationServices(container);
  registerJobServices(container);
  registerEndpointsServices(container);
  container.register({
    DIContainer: asValue(container),
  });
  return container;
};
