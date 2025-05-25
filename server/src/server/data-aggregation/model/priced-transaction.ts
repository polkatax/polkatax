import { Transaction } from "../../blockchain/substrate/model/transaction";

export interface PricedTransaction extends Transaction {
  price?: number;
  fiatValue?: number;
}
