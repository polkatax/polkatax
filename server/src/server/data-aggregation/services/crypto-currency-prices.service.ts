import { RequestHelper } from "../../../common/util/request.helper";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";

export class CryptoCurrencyPricesService {
  get port() {
    return process.env["CRYPTO_CURRENCY_PRICES_PORT"] || 3003;
  }

  fetchCurrentPrices(
    tokenIds: string[],
    currency: string,
  ): Promise<{ [symbol: string]: number }> {
    const helper = new RequestHelper();
    helper.defaultHeader = {
      ...helper.defaultHeader,
      "Content-Type": "application/json",
    };
    return helper.req(
      `http://localhost:${this.port}/crypto-current-prices`,
      "POST",
      { tokenIds, currency },
    );
  }

  fetchHistoricalPrices(
    tokenId: string,
    currency: string,
  ): Promise<CurrencyQuotes> {
    return new RequestHelper().req(
      `http://localhost:${this.port}/crypto-historic-prices/${tokenId}?currency=${currency}`,
      "GET",
    );
  }
}
