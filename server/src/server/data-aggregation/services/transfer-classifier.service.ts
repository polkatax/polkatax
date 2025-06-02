import { processFunctionName } from "../../../common/util/process-function-name";
import { Swap } from "../model/swap";
import { MergedTransfers, TransferMerger } from "../helper/transfer-merger";
import { PricedTransaction } from "../model/priced-transaction";
import { PricedTransfer } from "../model/priced-transfer";
import { SubscanService } from "../../blockchain/substrate/api/subscan.service";
import { isEvmAddress } from "../helper/is-evm-address";
import { getNativeToken } from "../helper/get-native-token";

export class TransferClassifier {
  constructor(
    private transferMerger: TransferMerger,
    private subscanService: SubscanService,
  ) {}

  async extractSwapsAndPayments(
    address: string,
    chainName: string,
    transactions: PricedTransaction[],
    transfersList: PricedTransfer[],
  ) {
    const aliases = isEvmAddress(address)
      ? [await this.subscanService.mapToSubstrateAccount(chainName, address)]
      : await this.subscanService.fetchAccounts(address, chainName);
    return this.extract(
      getNativeToken(chainName),
      transactions,
      transfersList,
      address,
      aliases,
    );
  }

  private isSwap(transfer: {
    [token: string]: Partial<PricedTransaction>;
  }): boolean {
    const received = Object.values(transfer).some((v) => v.amount > 0);
    const sent = Object.values(transfer).some((v) => v.amount < 0);
    return received && sent;
  }

  private extract(
    nativeToken: string,
    transfactions: PricedTransaction[],
    transfers: PricedTransfer[],
    address: string,
    aliases: string[],
  ): { payments: PricedTransfer[]; swaps: Swap[] } {
    const tranfersObj: MergedTransfers =
      this.transferMerger.mergeTxAndTranfersToObject(
        nativeToken,
        transfers,
        transfactions,
        address,
        aliases,
      );
    const payments = this.extractPayments(tranfersObj);
    const swaps = this.extractSwaps(tranfersObj);
    return { payments, swaps };
  }

  extractPayments(transfers: MergedTransfers): PricedTransfer[] {
    const result: PricedTransfer[] = [];
    Object.values(transfers).forEach((transfer) => {
      if (!this.isSwap(transfer.tokens)) {
        Object.values(transfer.tokens).forEach((data) => {
          result.push({
            ...data,
            label: processFunctionName(transfer.label || data.label),
          });
        });
      }
    });
    return result;
  }

  extractSwaps(transfers: MergedTransfers): Swap[] {
    const swaps: Swap[] = [];
    Object.entries(transfers).forEach(([hash, transfer]) => {
      if (this.isSwap(transfer.tokens)) {
        const base = {
          hash,
          label: processFunctionName(transfer.label),
          transfers: [],
          block: undefined,
          timestamp: undefined,
        };

        Object.values(transfer.tokens).forEach((data) => {
          base.block ??= data.block;
          base.timestamp ??= data.timestamp;
          base.label ||= processFunctionName(data.label);
          base.transfers.push({
            symbol: data.symbol,
            tokenId: data.tokenId,
            amount: data.amount,
            from: data.from,
            to: data.to,
            price: data.price,
            fiatValue: data.fiatValue,
            coingeckoId: data.coingeckoId,
            extrinsic_index: data.extrinsic_index,
          });
        });
        swaps.push(base as Swap);
      }
    });
    return swaps;
  }
}
