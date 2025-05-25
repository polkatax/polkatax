import { http, HttpResponse } from "msw";

/**
 * Creates an MSW (Mock Service Worker) handler for mocking POST requests to a specific URL.
 *
 * @param {string} url - The endpoint URL to mock (e.g., "/api/submit").
 * @param {any} responseBody - The mock JSON response to return.
 * @returns {ReturnType<typeof http.post>} An MSW request handler that responds with the given JSON body.
 *
 * @example
 * createMockResponseHandler('/api/login', { success: true });
 */
export const createMockResponseHandler = (url, responseBody: any) =>
  http.post(url, async ({}): Promise<HttpResponse<any>> => {
    return HttpResponse.json(responseBody);
  });
