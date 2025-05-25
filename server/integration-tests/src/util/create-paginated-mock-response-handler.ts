import { http, HttpResponse } from "msw";

/**
 * Creates a mock MSW handler for paginated POST requests.
 *
 * This function simulates paginated API behavior by returning different responses
 * based on the `page` number sent in the request body.
 *
 * @param {string} url - The endpoint URL to mock (e.g., "/api/events").
 * @param {any[]} paginatedResponses - An array of mock responses, one for each page index.
 * @param {any} [emptyResponse={ data: { events: [], list: [] } }] - Optional response to return when requested page index is out of range.
 * @returns {ReturnType<typeof http.post>} An MSW handler that returns the appropriate paginated response.
 *
 * @example
 * const handler = createPaginatedMockResponseHandler('/api/logs', [
 *   { data: { events: ['event1'], list: [1] } }, // page 0
 *   { data: { events: ['event2'], list: [2] } }, // page 1
 * ]);
 *
 * // If request body is { page: 1 }, the second object will be returned.
 */
export const createPaginatedMockResponseHandler = (
  url: string,
  paginatedResponses: any[],
  emptyResponse: any = { data: { events: [], list: [] } },
) => {
  return http.post(url, async ({ request }): Promise<HttpResponse<any>> => {
    const body = await request.json();
    if (paginatedResponses.length > body["page"]) {
      return HttpResponse.json(paginatedResponses[body["page"]]);
    } else {
      return HttpResponse.json(emptyResponse);
    }
  });
};
