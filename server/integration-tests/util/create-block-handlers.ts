import { http, HttpResponse } from "msw";
import { getYearRangeInZone } from "../../src/server/job-management/get-range-in-time-zone";
import { createMockResponseHandler } from "./create-mock-response-handler";

/**
 * Creates a handler to return two blocks, which correspond to beginning and end of a year in the respective timeZone
 * @param year
 * @param timeZone
 * @returns
 */
export const createBlockHandlers = (year: number, timeZone: string) => {
  const { startDay, endDay } = getYearRangeInZone(year, timeZone);
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
