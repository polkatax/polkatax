import { PricedTransfer } from "./priced-transfer";

export interface Swap {
  hash: string;
  block: number;
  timestamp: number;
  label: string;
  to: string;
  transfers: {
    symbol: string;
    tokenId: string;
    amount: number;
    from: string;
    to: string;
    extrinsic_index?: string;
    price?: number;
    fiatValue?: number;
    coingeckoId?: string;
  }[];
}
