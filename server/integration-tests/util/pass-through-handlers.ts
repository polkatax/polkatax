import { http, passthrough } from "msw";

export const passThroughHandlers = [
  http.get("http://127.0.0.1:3001/**", () => {
    return passthrough();
  }),
  http.get("http://localhost:3003/**", () => {
    return passthrough();
  }),
  http.post("http://localhost:3003/**", () => {
    return passthrough();
  }),
];
