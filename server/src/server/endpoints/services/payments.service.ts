import { addFiatValuesToNestedTransfers } from "../helper/addFiatValuesToNestedTransfers";
import { addFiatValuesToSwaps } from "../helper/addFiatValuesToSwaps";
import { TokenPriceConversionService } from "./token-price-conversion.service";
import { PaymentsRequest } from "../model/payments.request";
import { PaymentsResponse } from "../model/payments.response";
import { evmChainConfigs } from "../../blockchain/evm/constants/evm-chains.config";
import { SwapsAndTransfersService } from "../../blockchain/substrate/services/swaps-and-transfers.service";
import { EvmSwapsAndPaymentsService } from "../../blockchain/evm/service/evm-swaps-and-payments.service";
import { Swap } from "../../../model/swap";
import { validateDates } from "../../../common/util/validate-dates";
import { HttpError } from "../../../common/error/HttpError";
import { coingeckoSupportsToken } from "../helper/coingecko-supports-token";
import { Transfer } from "../../../model/transfer";
import * as subscanChains from "../../../../res/gen/subscan-chains.json";
import { logger } from "../../logger/logger";

export class PaymentsService {
  constructor(
    private swapsAndTransfersService: SwapsAndTransfersService,
    private tokenPriceConversionService: TokenPriceConversionService,
    private evmSwapsAndPaymentsService: EvmSwapsAndPaymentsService,
  ) {}

  getTokens(swaps: Swap[]): string[] {
    const tokens = [];
    swaps.forEach((s) => {
      Object.keys(s.tokens).forEach((t) => {
        if (tokens.indexOf(t) === -1) {
          tokens.push(t);
        }
      });
    });
    return tokens;
  }

  async processTask(
    paymentsRequest: PaymentsRequest,
  ): Promise<PaymentsResponse> {
    logger.info("PaymentsService: Enter processess Task");
    let { startDay, endDay, chainName, address, currency } = paymentsRequest;

    validateDates(startDay, endDay);
    endDay = endDay && endDay < new Date() ? endDay : new Date();
    if (
      !evmChainConfigs[chainName.toLocaleLowerCase()] &&
      !subscanChains.chains.find((p) => p.domain === chainName)
    ) {
      throw new HttpError(400, "Chain " + chainName + " not found");
    }

    const evmChainConfig = evmChainConfigs[chainName.toLocaleLowerCase()];
    const { swaps, payments } = evmChainConfig
      ? await this.evmSwapsAndPaymentsService.fetchSwapsAndPayments(
          chainName,
          address,
          startDay,
          endDay,
        )
      : await this.swapsAndTransfersService.fetchSwapsAndTransfers(
          chainName,
          address,
          startDay,
          endDay,
        );

    const tokens = this.getTokens(swaps);
    tokens.push(...Object.keys(payments));
    const supportedTokens = Array.from(
      new Set(
        tokens.filter((symbol) => coingeckoSupportsToken(symbol, chainName)),
      ),
    );

    const quotes = await this.tokenPriceConversionService.fetchQuotesForTokens(
      supportedTokens,
      chainName,
      currency,
    );

    const listOfTransfers: {
      [symbol: string]: { values: Transfer[]; currentPrice: number };
    } = addFiatValuesToNestedTransfers(payments, quotes);

    const currentPrices = {};
    Object.keys(quotes).forEach(
      (token) => (currentPrices[token] = quotes[token].quotes.latest),
    );
    const swapsExtended = addFiatValuesToSwaps(swaps, quotes);
    logger.info("PaymentsService: Exit processess Task");
    return { currentPrices, swaps: swapsExtended, transfers: listOfTransfers };
  }
}
