import { createMockResponseHandler } from "./create-mock-response-handler";

export const metaDataHandler = createMockResponseHandler(
  "https://*.api.subscan.io/api/scan/metadata",
  {
    data: {
      avgBlockTime: 6,
      blockNum: 1000,
    },
  },
);
