import { http, HttpResponse } from "msw";
import { Block } from "../../../src/server/blockchain/substrate/model/block";
import { createMockResponseHandler } from "./create-mock-response-handler";

export const createBlockHandlers = (timestamp: number) => {
  return [
    createMockResponseHandler("https://*.api.subscan.io/api/scan/block", {
      data: {
        block_num: 1000,
        block_timestamp: timestamp / 1000,
      },
    }),
    createMockResponseHandler("https://*.api.subscan.io/api/v2/scan/blocks", {
      data: {
        blocks: [
          {
            block_num: 1000,
            block_timestamp: timestamp / 1000,
          },
        ],
      },
    }),
  ];
};
