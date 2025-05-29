import { http, HttpResponse } from "msw";
import { getYearRange } from "../../src/server/job-management/get-time-range";
import { createMockResponseHandler } from "./create-mock-response-handler";

/**
 * Creates a handler to return two blocks, which correspond to beginning and end of a year 
 * @param year
 * @returns
 */
export const createBlockHandlers = (year: number) => {
  const { startDay, endDay } = getYearRange(year);
  return [
    http.post(
      "https://*.api.subscan.io/api/scan/block",
      async ({ request }): Promise<HttpResponse<any>> => {
        const body = await request.json();
        const block_num = Number(body["block_num"]);
        if (block_num === 1) {
          return HttpResponse.json({
            data: {
              block_num: 1,
              block_timestamp: startDay.getTime() / 1000,
            },
          });
        } else {
          return HttpResponse.json({
            data: {
              block_num: 2,
              block_timestamp: endDay.getTime() / 1000,
            },
          });
        }
      },
    ),
    createMockResponseHandler("https://*.api.subscan.io/api/v2/scan/blocks", {
      data: {
        blocks: [
          {
            block_num: 2,
            block_timestamp: endDay.getTime() / 1000,
          },
          {
            block_num: 1,
            block_timestamp: startDay.getTime() / 1000,
          },
        ],
      },
    }),
  ];
};
