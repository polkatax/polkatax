import Fastify from "fastify";
import { logger } from "./logger/logger";
import dotenv from "dotenv";
import { ExchangeRates } from "../model/fiat-exchange-rates/exchange-rates";
dotenv.config({ path: __dirname + "/../../.env" });

const generateMockData = () => {
  const currencies = [
    "AED",
    "AFN",
    "ALL",
    "AMD",
    "ANG",
    "AOA",
    "ARS",
    "AUD",
    "AWG",
    "AZN",
    "BAM",
    "BBD",
    "BDT",
    "BGN",
    "BHD",
    "BIF",
    "BMD",
    "BND",
    "BOB",
    "BRL",
    "BSD",
    "BTC",
    "BTN",
    "BWP",
    "BYN",
    "BYR",
    "BZD",
    "CAD",
    "CDF",
    "CHF",
    "CLF",
    "CLP",
    "CNY",
    "CNH",
    "COP",
    "CRC",
    "CUC",
    "CUP",
    "CVE",
    "CZK",
    "DJF",
    "DKK",
    "DOP",
    "DZD",
    "EGP",
    "ERN",
    "ETB",
    "EUR",
    "FJD",
    "FKP",
    "GBP",
    "GEL",
    "GGP",
    "GHS",
    "GIP",
    "GMD",
    "GNF",
    "GTQ",
    "GYD",
    "HKD",
    "HNL",
    "HRK",
    "HTG",
    "HUF",
    "IDR",
    "ILS",
    "IMP",
    "INR",
    "IQD",
    "IRR",
    "ISK",
    "JEP",
    "JMD",
    "JOD",
    "JPY",
    "KES",
    "KGS",
    "KHR",
    "KMF",
    "KPW",
    "KRW",
    "KWD",
    "KYD",
    "KZT",
    "LAK",
    "LBP",
    "LKR",
    "LRD",
    "LSL",
    "LTL",
    "LVL",
    "LYD",
    "MAD",
    "MDL",
    "MGA",
    "MKD",
    "MMK",
    "MNT",
    "MOP",
    "MRU",
    "MUR",
    "MVR",
    "MWK",
    "MXN",
    "MYR",
    "MZN",
    "NAD",
    "NGN",
    "NIO",
    "NOK",
    "NPR",
    "NZD",
    "OMR",
    "PAB",
    "PEN",
    "PGK",
    "PHP",
    "PKR",
    "PLN",
    "PYG",
    "QAR",
    "RON",
    "RSD",
    "RUB",
    "RWF",
    "SAR",
    "SBD",
    "SCR",
    "SDG",
    "SEK",
    "SGD",
    "SHP",
    "SLE",
    "SLL",
    "SOS",
    "SRD",
    "STD",
    "SVC",
    "SYP",
    "SZL",
    "THB",
    "TJS",
    "TMT",
    "TND",
    "TOP",
    "TRY",
    "TTD",
    "TWD",
    "TZS",
    "UAH",
    "UGX",
    "UYU",
    "UZS",
    "VES",
    "VND",
    "VUV",
    "WST",
    "XAF",
    "XAG",
    "XAU",
    "XCD",
    "XDR",
    "XOF",
    "XPF",
    "YER",
    "ZAR",
    "ZMK",
    "ZMW",
    "ZWL",
  ];

  const createMockQuotes = () => {
    const result: { [currency: string]: number } = {};
    currencies.forEach((c) => (result[c] = 1.2));
    result["USD"] = 1.0;
    return result;
  };

  const mockQuotes = createMockQuotes();

  const getDailyQuotesForLastTenYears = (): ExchangeRates => {
    const data: ExchangeRates = {};
    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 10);
    startDate.setMonth(0);
    startDate.setDate(0);

    startDate.setUTCHours(0, 0, 0, 0);
    for (
      let date = new Date(startDate);
      date <= now;
      date.setUTCDate(date.getUTCDate() + 1)
    ) {
      data[date.toISOString().split("T")[0]] = mockQuotes;
    }
    return data;
  };
  return getDailyQuotesForLastTenYears();
};

export const startStub = async () => {
  const mockData = generateMockData();

  const fastify = Fastify({
    loggerInstance: logger,
  });

  fastify.route({
    method: "GET",
    url: "/fiat-exchange-rates",
    handler: async () => {
      return mockData;
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
  return fastify;
};
