import dotenv from "dotenv";
import { SubscanService } from "../api/subscan.service";
import { Transfers } from "../model/transfer";
import { BlockTimeService } from "./block-time.service";
import { Transaction } from "../model/transaction";
import { logger } from "../../../logger/logger";
import { Swap } from "../../../../model/swap";
import { TokenTransfers } from "../../../../model/token-transfer";
import { TransferClassifier } from "../util/transfer-classifier";
import { TransferMerger } from "../util/transfer-merger";
import { ChainAdjustments } from "../util/chain-adjustments";
import { hasChainEvmSupport } from "../util/has-chain-evm-support";

dotenv.config({ path: __dirname + "/../.env" });

export class SwapsAndTransfersService {
  constructor(
    private blockTimeService: BlockTimeService,
    private subscanService: SubscanService,
    private transferClassifier: TransferClassifier,
    private transferMerger: TransferMerger,
    private chainAdjustments: ChainAdjustments,
  ) {}

  private async fetchTxAndTransfers(
    chainName: string,
    address: string,
    blockMin: number,
    blockMax: number,
    evm = false,
  ): Promise<{ transactions: Transaction[]; transfers: Transfers }> {
    const accounts = await this.subscanService.fetchAccounts(
      address,
      chainName,
    );
    const isMyAccount = (account: string) =>
      address.toLowerCase() === account.toLowerCase() ||
      accounts.indexOf(address.toLowerCase()) > -1;

    const transactions = await this.subscanService.fetchAllTx(
      chainName,
      address,
      blockMin,
      blockMax,
      evm,
    );
    const transfersList = await this.subscanService.fetchAllTransfers(
      chainName,
      address,
      blockMin,
      blockMax,
      evm,
    );
    const transfers = this.transferMerger.mergeTranferListToObject(
      transfersList,
      address,
      isMyAccount,
    );
    return { transactions, transfers };
  }

  private async resolveAddresses(chainName: string, address: string) {
    const isEvm = address.length <= 42;
    const evmAddress = isEvm ? address : undefined;
    const substrateAddress = isEvm
      ? await this.subscanService.mapToSubstrateAccount(chainName, address)
      : address;
    return { substrateAddress, evmAddress };
  }

  private async loadAllTransfers(
    chainName: string,
    substrateAddress: string,
    evmAddress: string | undefined,
    blockMin: number,
    blockMax: number,
  ) {
    let { transactions, transfers } = substrateAddress
      ? await this.fetchTxAndTransfers(
          chainName,
          substrateAddress,
          blockMin,
          blockMax,
          false,
        )
      : { transactions: [], transfers: {} };

    if (evmAddress && hasChainEvmSupport(chainName)) {
      const evmData = await this.fetchTxAndTransfers(
        chainName,
        evmAddress,
        blockMin,
        blockMax,
        true,
      );
      this.transferMerger.merge(transfers, evmData.transfers);
      transactions = transactions.concat(evmData.transactions);
    }

    return { transactions, transfers };
  }

  private filterByDate<T extends { date: number }>(
    items: T[] | Record<string, T[]>,
    minDate: Date,
    maxDate?: Date,
  ) {
    const timestamp = (d: number) => d * 1000;
    const filterFn = (item: T) =>
      timestamp(item.date) >= minDate.getTime() &&
      (!maxDate || timestamp(item.date) <= maxDate.getTime());

    if (Array.isArray(items)) {
      return items.filter(filterFn);
    }

    const filtered: Record<string, T[]> = {};
    for (const [token, txs] of Object.entries(items)) {
      const valid = txs.filter(filterFn);
      if (valid.length > 0) {
        filtered[token] = valid;
      }
    }
    return filtered;
  }

  private filterEmptyTokens(payments: TokenTransfers): TokenTransfers {
    const result: TokenTransfers = {};
    for (const token of Object.keys(payments)) {
      if (payments[token].length > 0) {
        result[token] = payments[token];
      }
    }
    return result;
  }

  async fetchSwapsAndTransfers(
    chainName: string,
    address: string,
    minDate: Date,
    maxDate?: Date,
  ): Promise<{ swaps: Swap[]; payments: TokenTransfers }> {
    logger.info(`Enter fetchSwapsAndTransfers for ${chainName}`);

    const { substrateAddress, evmAddress } = await this.resolveAddresses(
      chainName,
      address,
    );
    const { blockMin, blockMax } = await this.blockTimeService.getMinMaxBlock(
      chainName,
      minDate.getTime(),
      maxDate?.getTime(),
    );

    let { transactions, transfers } = await this.loadAllTransfers(
      chainName,
      substrateAddress,
      evmAddress,
      blockMin,
      blockMax,
    );

    let swaps = this.transferClassifier.extractSwaps(transactions, transfers);
    if (chainName.toLowerCase() === "hydration") {
      this.chainAdjustments.handleHydration(swaps);
    }

    swaps = this.filterByDate(swaps, minDate, maxDate) as Swap[];
    let payments = this.transferClassifier.extractPayments(
      transactions,
      transfers,
    );
    payments = this.filterEmptyTokens(
      this.filterByDate(payments, minDate, maxDate) as TokenTransfers,
    );

    logger.info(`Exit fetchSwapsAndTransfers for ${chainName}`);
    return { swaps, payments };
  }
}
