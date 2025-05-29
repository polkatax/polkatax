import Fastify, { FastifyRequest } from "fastify";
import { logger } from "./logger/logger";
import dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../../.env" });
import { TokenPriceHistoryService } from "./services/token-price-history.service";
import { TokenPriceService } from "./services/token-price.service";
import { DIContainer } from "./di-container";
import { PreferredQuoteCurrency } from "../model/preferred-quote-currency";
import { formatDate } from "../common/util/date-utils";

export const cryptoCurrencyPricesServer = {
  init: async () => {
    const tokenPriceHistoryService: TokenPriceHistoryService =
      DIContainer.resolve("tokenPriceHistoryService");
    const tokenPriceService: TokenPriceService =
      DIContainer.resolve("tokenPriceService");

    tokenPriceHistoryService.init();

    const fastify = Fastify({
      loggerInstance: logger,
    });

    fastify.route({
      method: "GET",
      url: "/crypto-historic-prices/:tokenId",
      handler: async (
        request: FastifyRequest<{
          Params: { tokenId: string };
          Querystring: { currency: PreferredQuoteCurrency };
        }>,
      ) => {
        const { tokenId } = request.params;
        const { currency } = request.query;
        const [ current, historic ] = await Promise.all([
          tokenPriceService.fetchCurrentPrices([tokenId], currency),
          tokenPriceHistoryService.getHistoricPrices(tokenId, currency)
        ])
        const today = formatDate(new Date())
        if (current && current[tokenId] && !historic.quotes[today]) {
          historic.quotes[today] = current[tokenId]
        }
        return historic
      },
    });

    fastify.listen(
      { port: Number(process.env["CRYPTO_CURRENCY_PRICES_PORT"] || 3003) },
      (err) => {
        if (err) {
          fastify.log.error(err);
          process.exit(1);
        }
      },
    );
  },
};

cryptoCurrencyPricesServer.init();
