import { CoingeckoRestService } from "../coingecko-api/coingecko.rest-service";

const MAX_AGE = 6 * 60 * 60 * 1000;

export class TokenPriceService {
  private static quotes: {
    [coingeckoId: string]: {
      [currency: string]: { price: number; timestamp: number };
    };
  } = {};

  constructor(private coingeckoRestService: CoingeckoRestService) {}

  private hasAllQuotes(coingeckoIds: string[], currency: string) {
    return coingeckoIds.every((id) => {
      return (
        TokenPriceService.quotes[id]?.[currency.toLowerCase()]?.price !==
          undefined &&
        new Date().getTime() -
          TokenPriceService.quotes[id]?.[currency.toLowerCase()].timestamp <
          MAX_AGE
      );
    });
  }

  private getCachedPrices(
    coingeckoIds: string[],
    currency: string,
  ): { [currency: string]: number } {
    const response = {};
    coingeckoIds.forEach((id) => {
      response[id] ??= {};
      response[id][currency.toLowerCase()] =
        TokenPriceService.quotes[id]?.[currency.toLowerCase()].price;
    });
    return response;
  }

  async fetchCurrentPrices(
    coingeckoIds: string[],
    currency: string,
  ): Promise<{ [symbol: string]: number }> {
    const refresh = !this.hasAllQuotes(coingeckoIds, currency);
    const response = refresh
      ? await this.coingeckoRestService.fetchPrices(
          coingeckoIds,
          currency.toLowerCase(),
        )
      : this.getCachedPrices(coingeckoIds, currency);
    const final = {};
    for (const id of coingeckoIds) {
      if (refresh) {
        TokenPriceService.quotes[id] = TokenPriceService.quotes[id] || {};
        TokenPriceService.quotes[id][currency] = {
          price: response[id][currency.toLowerCase()],
          timestamp: new Date().getTime(),
        };
      }
      final[id] = response[id][currency.toLowerCase()];
    }
    return final;
  }
}
