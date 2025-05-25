import { Transfer } from "../../blockchain/substrate/model/raw-transfer";

export interface PricedTransfer extends Transfer {
  price?: number;
  fiatValue?: number;
  coingeckoId?: string;
}
