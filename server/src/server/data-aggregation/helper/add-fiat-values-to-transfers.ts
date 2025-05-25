import { logger } from "../../logger/logger";
import { formatDate } from "../../../common/util/date-utils";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { PricedTransfer } from "../model/priced-transfer";

export const addFiatValuesToTransferList = (
  values: PricedTransfer[],
  quotes: { [tokenId: string]: CurrencyQuotes },
): PricedTransfer[] => {
  const currentIsoDate = formatDate(new Date());
  for (let d of values) {
    if (!d.coingeckoId) {
      continue;
    }
    addFiatValueToTransfer(
      d,
      quotes[d.coingeckoId],
      currentIsoDate,
      d.timestamp,
    );
  }
  return values;
};

export const addFiatValueToTransfer = (
  transfer: {
    price?: number;
    fiatValue?: number;
    amount: number;
  },
  quotes: CurrencyQuotes,
  currentIsoDate: string,
  timestamp: number,
) => {
  const isoDate = formatDate(new Date(timestamp * 1000));
  if (isoDate === currentIsoDate && quotes.quotes.latest) {
    transfer.price = quotes.quotes.latest;
    transfer.fiatValue = transfer.amount * quotes.quotes.latest;
  } else if (quotes.quotes?.[isoDate]) {
    transfer.price = quotes.quotes[isoDate];
    transfer.fiatValue = transfer.amount * transfer.price;
  } else if (isoDate !== currentIsoDate) {
    logger.warn(`No quote found for ${quotes.currency} for date ${isoDate}`);
  }
};
