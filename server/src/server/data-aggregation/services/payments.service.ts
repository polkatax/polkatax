import { TokenPriceConversionService } from "./token-price-conversion.service";
import { PaymentsRequest } from "../model/payments.request";
import { PaymentsResponse } from "../model/payments.response";
import { evmChainConfigs } from "../../blockchain/evm/constants/evm-chains.config";
import { SwapsAndTransfersService } from "../../blockchain/substrate/services/swaps-and-transfers.service";
import { EvmSwapsAndPaymentsService } from "../../blockchain/evm/service/evm-swaps-and-payments.service";
import { validateDates } from "../../../common/util/validate-dates";
import { HttpError } from "../../../common/error/HttpError";
import * as subscanChains from "../../../../res/gen/subscan-chains.json";
import { logger } from "../../logger/logger";
import { TransferClassifier } from "./transfer-classifier.service";
import { CoingeckoIdLookupService } from "./coingecko-id-lookup.service";
import { PricedTransfer } from "../model/priced-transfer";
import { PricedTransaction } from "../model/priced-transaction";
import { addFiatValuesToTransferList } from "../helper/add-fiat-values-to-transfers";
import { findCoingeckoIdForNativeToken } from "../helper/find-coingecko-id-for-native-token";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { ChainAdjustments } from "../helper/chain-adjustments";
import { getNativeToken } from "../helper/get-native-token";
import { addFiatValuesToSwaps } from "../helper/add-fiat-values-to-swaps";

export class PaymentsService {
  constructor(
    private swapsAndTransfersService: SwapsAndTransfersService,
    private tokenPriceConversionService: TokenPriceConversionService,
    private evmSwapsAndPaymentsService: EvmSwapsAndPaymentsService,
    private transferClassifier: TransferClassifier,
    private coingeckoIdLookupService: CoingeckoIdLookupService,
  ) {}

  private async fetchQuotes(
    nativeTokenCoingeckoId: string,
    paymentsRequest: PaymentsRequest,
    coingeckoIds: string[],
  ): Promise<{
    quotes: Record<string, CurrencyQuotes>;
    currentPrices: Record<string, number>;
  }> {
    const quotes = await this.tokenPriceConversionService.fetchQuotesForTokens(
      nativeTokenCoingeckoId
        ? [...coingeckoIds, nativeTokenCoingeckoId]
        : coingeckoIds,
      paymentsRequest.currency,
    );
    const currentPrices = {};
    Object.keys(quotes).forEach(
      (tokenId) => (currentPrices[tokenId] = quotes[tokenId].quotes.latest),
    );
    return { currentPrices, quotes };
  }

  private async fetchData(paymentsRequest: PaymentsRequest) {
    const evmChainConfig = evmChainConfigs[paymentsRequest.chainName];
    const {
      transactions,
      transfersList,
    }: { transactions: PricedTransaction[]; transfersList: PricedTransfer[] } =
      evmChainConfig
        ? await this.evmSwapsAndPaymentsService.fetchSwapsAndPayments(
            paymentsRequest,
          )
        : await this.swapsAndTransfersService.fetchSwapsAndTransfers(
            paymentsRequest,
          );
    return { transactions, transfersList };
  }

  private validate(paymentsRequest: PaymentsRequest) {
    let { startDay, endDay, chainName } = paymentsRequest;

    validateDates(startDay, endDay);
    endDay = endDay && endDay < new Date() ? endDay : new Date();
    if (
      !evmChainConfigs[chainName] &&
      !subscanChains.chains.find((p) => p.domain === chainName)
    ) {
      throw new HttpError(400, "Chain " + chainName + " not found");
    }
  }

  private createTokenInfoList(
    nativeToken: string,
    nativeTokenCoingeckoId?: string,
    transfers: PricedTransfer[] = [],
    currentPrices: Record<string, number> = {},
  ) {
    const tokenInfo: Record<
      string,
      { symbol: string; coingeckoId?: string; latestPrice?: number }
    > = {
      [nativeToken]: {
        symbol: nativeToken,
        coingeckoId: nativeTokenCoingeckoId,
        latestPrice: currentPrices[nativeTokenCoingeckoId],
      },
    };
    for (let t of transfers) {
      if (!tokenInfo[t.tokenId]) {
        tokenInfo[t.tokenId] = {
          symbol: t.symbol,
          coingeckoId: t.coingeckoId,
          latestPrice: currentPrices[t.coingeckoId],
        };
      }
    }
    return tokenInfo;
  }

  async processTask(
    paymentsRequest: PaymentsRequest,
  ): Promise<PaymentsResponse> {
    logger.info("PaymentsService: Enter processess Task");
    this.validate(paymentsRequest);
    const { transactions, transfersList } =
      await this.fetchData(paymentsRequest);

    const nativeTokenCoingeckoId = findCoingeckoIdForNativeToken(
      paymentsRequest.chainName,
    );
    const coingeckoIds =
      this.coingeckoIdLookupService.addCoingeckoIds(transfersList);

    const { payments, swaps } =
      await this.transferClassifier.extractSwapsAndPayments(
        paymentsRequest.address,
        paymentsRequest.chainName,
        transactions,
        transfersList,
      );

    if (paymentsRequest.chainName === "hydration") {
      new ChainAdjustments().handleHydration(swaps);
    }

    const { quotes, currentPrices } = await this.fetchQuotes(
      nativeTokenCoingeckoId,
      paymentsRequest,
      coingeckoIds,
    );

    addFiatValuesToTransferList(payments, quotes);
    addFiatValuesToSwaps(swaps, quotes);

    const tokens = this.createTokenInfoList(
      getNativeToken(paymentsRequest.chainName),
      nativeTokenCoingeckoId,
      transfersList,
      currentPrices,
    );

    logger.info("PaymentsService: Exit processess Task");
    return { swaps, transfers: payments, tokens };
  }
}
