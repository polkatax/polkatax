import { logger } from "../logger/logger";
import { CoingeckoRestService } from "../coingecko-api/coingecko.rest-service";
import {
  CurrencyQuotes,
  Quotes,
} from "../../model/crypto-currency-prices/crypto-currency-quotes";
import * as substrateTokenToCoingeckoId from "../../../res/substrate-token-to-coingecko-id.json";
import { formatDate } from "../../common/util/date-utils";
import {
  PreferredQuoteCurrency,
  preferredQuoteCurrencyValues,
} from "../../model/preferred-quote-currency";

const MAX_AGE = 4 * 60 * 60 * 1000;

export class TokenPriceHistoryService {
  private cachedPrices: { [coingeckoId: string]: Quotes } = {};
  private timer;
  private tokensToSync = [
    ...substrateTokenToCoingeckoId.tokens.map((t) => t.coingeckoId),
    "ethereum",
    "usd-coin",
    "moonwell-artemis",
    "mulitchain-bridged-wbtc-moonbeam",
    "interbtc",
  ];

  constructor(private coingeckoRestService: CoingeckoRestService) {}

  public init() {
    logger.info("Initalizing TokenPriceHistoryService");
    if (!this.timer) {
      this.timer = setInterval(() => this.sync(), 3 * 60 * 1000);
    }
    this.sync();
  }

  async getHistoricPrices(
    coingeckoId: string,
    currency: PreferredQuoteCurrency = "usd",
  ): Promise<CurrencyQuotes> {
    const result = await this.fetchQuotesForId(coingeckoId, currency);
    this.addTokenToSyncList(coingeckoId);
    return { quotes: result, currency };
  }

  private currenciesToSync = preferredQuoteCurrencyValues;

  private async sync() {
    logger.info("TokenPriceHistoryService syncing");
    const coingeckoIdsToSync = [...this.tokensToSync];
    for (let currency of this.currenciesToSync) {
      for (let coingeckoId of coingeckoIdsToSync) {
        try {
          if (!this.informationUpToDate(coingeckoId, currency)) {
            const quotes = await this.fetchQuotesForId(coingeckoId, currency);
            if (!quotes) {
              logger.warn(
                `Syncing for ${coingeckoId} failed. Removing token from sync list`,
              );
              this.tokensToSync = this.tokensToSync.filter(
                (t) => t !== coingeckoId,
              );
            }
            logger.info(
              `TokenPriceHistoryService syncing done for token ${coingeckoId} and currency ${currency}`,
            );
            break;
          }
        } catch (error) {
          logger.warn(
            `Error syncing token ${coingeckoId} for currency ${currency}`,
            error,
          );
          logger.warn(error);
          this.tokensToSync = this.tokensToSync.filter(
            (t) => t !== coingeckoId,
          );
          break;
        }
      }
    }
    if (
      coingeckoIdsToSync.every((id) =>
        this.currenciesToSync.every((currency) =>
          this.informationUpToDate(id, currency),
        ),
      )
    ) {
      logger.info(`TokenPriceHistoryService syncing completed!`);
    }
  }

  private combine(id: string, currency: string) {
    return id + "_" + currency;
  }

  private addTokenToSyncList(coingeckoId: string) {
    const tokensToSync = this.tokensToSync;
    if (tokensToSync.indexOf(coingeckoId) === -1) {
      tokensToSync.push(coingeckoId);
    }
  }

  private informationUpToDate(coingeckoId: string, currency: string) {
    const combinedIdx = this.combine(coingeckoId, currency);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return (
      this.cachedPrices[combinedIdx] &&
      (this.cachedPrices[combinedIdx][formatDate(yesterday)] ||
        new Date().getTime() - this.cachedPrices[combinedIdx].timestamp <
          MAX_AGE)
    );
  }

  private async fetchQuotesForId(
    coingeckoId: string,
    currency: string = "usd",
  ) {
    if (this.informationUpToDate(coingeckoId, currency)) {
      return this.cachedPrices[this.combine(coingeckoId, currency)];
    }
    const quotes: Quotes = await this.coingeckoRestService.fetchHistoricalData(
      coingeckoId,
      currency,
    );
    const idCurr = this.combine(coingeckoId, currency);
    this.cachedPrices[idCurr] = quotes;
    return this.cachedPrices[idCurr];
  }
}
