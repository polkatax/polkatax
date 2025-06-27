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
        let { currency } = request.query;
        currency = currency?.toLocaleLowerCase()
        logger.info("Entry /crypto-historic-prices/ with token " + tokenId + " and currency " + currency)
        const quotes = await tokenPriceHistoryService.getHistoricPrices(
          tokenId,
          currency,
        );
        const todayFormatted = formatDate(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (
          quotes?.quotes &&
          quotes?.quotes[formatDate(yesterday)] &&
          !quotes.quotes[todayFormatted]
        ) {
          // use yesterday eod quotes if current day not finished yet
          quotes.quotes[todayFormatted] = quotes.quotes[formatDate(yesterday)];
        }
        logger.info("Exit /crypto-historic-prices/")
        return quotes;
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
