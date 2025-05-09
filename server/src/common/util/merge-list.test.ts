import { test, expect } from "@jest/globals";
import { mergeListElements } from "./merge-list";

test("should merge lists", () => {
  const l: any[] = [
    { hashX: { ETH: { amount: -1 } as any, BTC: { amount: 2 } as any } },
    { hashY: { ETH: { amount: -1 } as any, DOGE: { amount: 6 } as any } },
    { hashZ: { BTC: { amount: 0.5 } as any, DOGE: { amount: 2 } as any } },
  ];
  const result = mergeListElements(l);
  expect(result).toEqual({
    hashX: { ETH: { amount: -1 }, BTC: { amount: 2 } },
    hashY: { ETH: { amount: -1 }, DOGE: { amount: 6 } },
    hashZ: { BTC: { amount: 0.5 }, DOGE: { amount: 2 } },
  });
});
