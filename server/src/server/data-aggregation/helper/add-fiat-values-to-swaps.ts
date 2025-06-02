import { formatDate } from "../../../common/util/date-utils";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { addFiatValueToTransfer } from "./add-fiat-values-to-transfers";
import { Swap } from "../model/swap";

export const addFiatValuesToSwaps = (
  swaps: Swap[],
  quotes: { [tokenId: string]: CurrencyQuotes },
): Swap[] => {
  const currentIsoDate = formatDate(new Date());
  for (let swap of swaps) {
    swap.transfers
      .filter((t) => t.coingeckoId)
      .forEach((t) =>
        addFiatValueToTransfer(
          t,
          quotes[t.coingeckoId],
          currentIsoDate,
          swap.timestamp,
        ),
      );
  }
  return swaps;
};
