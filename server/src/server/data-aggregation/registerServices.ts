import { asClass, AwilixContainer } from "awilix";
import { StakingRewardsWithFiatService } from "./services/staking-rewards-with-fiat.service";
import { PaymentsService } from "./services/payments.service";
import { TokenPriceConversionService } from "./services/token-price-conversion.service";
import { CryptoCurrencyPricesService } from "./services/crypto-currency-prices.service";
import { FiatExchangeRateService } from "./services/fiat-exchange-rate.service";
import { ChainAdjustments } from "./helper/chain-adjustments";
import { TransferClassifier } from "./services/transfer-classifier.service";
import { TransferMerger } from "./helper/transfer-merger";
import { CoingeckoIdLookupService } from "./services/coingecko-id-lookup.service";

export const registerServices = (container: AwilixContainer) => {
  container.register({
    stakingRewardsWithFiatService: asClass(StakingRewardsWithFiatService),
    cryptoCurrencyPricesService: asClass(CryptoCurrencyPricesService),
    fiatExchangeRateService: asClass(FiatExchangeRateService),
    tokenPriceConversionService: asClass(TokenPriceConversionService),
    paymentsService: asClass(PaymentsService),
    chainAdjustments: asClass(ChainAdjustments),
    transferClassifier: asClass(TransferClassifier),
    transferMerger: asClass(TransferMerger),
    coingeckoIdLookupService: asClass(CoingeckoIdLookupService),
  });
};
