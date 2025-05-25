import { RequestHelper } from "../../../common/util/request.helper";
import { ExchangeRates } from "../../../model/fiat-exchange-rates/exchange-rates";

export class FiatExchangeRateService {
  get port() {
    return process.env["FIAT_EXCHANGE_RATES_PORT"] || 3002;
  }

  fetchExchangeRates(): Promise<ExchangeRates> {
    return new RequestHelper().req(
      `http://localhost:${this.port}/fiat-exchange-rates`,
      "GET",
      {},
    );
  }
}
