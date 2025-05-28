import { createMockResponseHandler } from "./create-mock-response-handler";

export const scanTokenHandler = createMockResponseHandler(
  "https://*.api.subscan.io/api/scan/token",
  {
    data: {
      detail: { DOT: { asset_type: "native", token_decimals: "10" } },
    },
  },
);
