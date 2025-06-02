import { logger } from "../../logger/logger";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { CryptoCurrencyPricesService } from "./crypto-currency-prices.service";
import { FiatExchangeRateService } from "./fiat-exchange-rate.service";
import {
  PreferredQuoteCurrency,
  preferredQuoteCurrencyValues,
} from "../../../model/preferred-quote-currency";

export class TokenPriceConversionService {
  constructor(
    private cryptoCurrencyPricesService: CryptoCurrencyPricesService,
    private fiatExchangeRateService: FiatExchangeRateService,
  ) {}

  private async fetchQuotesInOtherCurrency(
    multiTokenQuotes: { [token: string]: CurrencyQuotes },
    toCurrency: string,
  ): Promise<{ [token: string]: CurrencyQuotes }> {
    const fiatExchangeRates =
      await this.fiatExchangeRateService.fetchExchangeRates();
    const quotesInTargetCurrency: { [token: string]: CurrencyQuotes } = {};

    Object.keys(multiTokenQuotes).forEach((token) => {
      quotesInTargetCurrency[token] = {
        quotes: {
          timestamp: multiTokenQuotes[token].quotes.timestamp,
          latest: multiTokenQuotes[token].quotes.latest,
        },
        currency: toCurrency,
      };
      Object.keys(multiTokenQuotes[token].quotes)
        .filter((key) => key !== "timestamp" && key !== "latest")
        .forEach(
          (timestamp) =>
            (quotesInTargetCurrency[token].quotes[timestamp] =
              multiTokenQuotes[token].quotes[timestamp] *
              fiatExchangeRates[timestamp][toCurrency.toUpperCase()]),
        );
    });
    return quotesInTargetCurrency;
  }

  public async fetchQuotesForTokens(
    tokenIds: string[],
    currency: string,
  ): Promise<{ [token: string]: CurrencyQuotes }> {
    logger.info(
      `Entry fetchQuotesForTokens ${tokenIds.join(", ")} in ${currency}`,
    );
    const quotesCurrency =
      preferredQuoteCurrencyValues.indexOf(currency?.toLowerCase()) > -1
        ? currency
        : "usd";
    const result = {};
    for (let i = 0; i < tokenIds.length; i++) {
      try {
        result[tokenIds[i]] =
          await this.cryptoCurrencyPricesService.fetchHistoricalPrices(
            tokenIds[i],
            quotesCurrency as PreferredQuoteCurrency,
          );
      } catch (e) {
        logger.error("Failed to fetch quotes for token " + tokenIds[i]);
        logger.error(e);
      }
    }
    if (preferredQuoteCurrencyValues.indexOf(currency.toLowerCase()) > -1) {
      logger.info(`Exit fetchQuotesForTokens`);
      return result;
    }
    const resultConverted = await this.fetchQuotesInOtherCurrency(
      result,
      currency,
    );
    logger.info(`Exit fetchQuotesForTokens`);
    return resultConverted;
  }
}
