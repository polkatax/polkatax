import Fastify from "fastify";
import { logger } from "./logger/logger";
import dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../../.env" });
import { DIContainer } from "./di-container";
import { FiatExchangeRateService } from "./service/fiat-exchange-rate.service";

const init = async () => {
  const fiatExchangeRateService: FiatExchangeRateService =
    await DIContainer.resolve("fiatExchangeRateService");
  try {
    await fiatExchangeRateService.init();
  } catch (error) {
    logger.error(error);
  }

  const fastify = Fastify({
    loggerInstance: logger,
  });

  fastify.route({
    method: "GET",
    url: "/fiat-exchange-rates",
    handler: async () => {
      return fiatExchangeRateService.exchangeRates;
    },
  });

  fastify.listen(
    { port: Number(process.env["FIAT_EXCHANGE_RATES_PORT"] || 3002) },
    (err) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
    },
  );
};

init();
