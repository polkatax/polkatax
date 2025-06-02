import { Swap } from "./swap";
import { PricedTransfer } from "./priced-transfer";

export interface PaymentsResponse {
  swaps: Swap[];
  transfers: PricedTransfer[];
  tokens: Record<
    string,
    { symbol: string; coingeckoId?: string; latestPrice?: number }
  >;
}
