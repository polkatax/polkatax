import { InjectionMode, createContainer } from "awilix";
import { registerServices as registerBlockchainServices } from "./blockchain/registerServices";
import { registerServices as registerDataAggregationServices } from "./data-aggregation/registerServices";
import { registerServices as registerJobServices } from "./job-management/registerServices";
import { registerServices as registerEndpointsServices } from "./endpoints/registerServices";

export const DIContainer = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

registerBlockchainServices(DIContainer);
registerDataAggregationServices(DIContainer);
registerJobServices(DIContainer);
registerEndpointsServices(DIContainer);