import dotenv from "dotenv";
import { SubscanService } from "../api/subscan.service";
import { BlockTimeService } from "./block-time.service";
import { Transaction } from "../model/transaction";
import { logger } from "../../../logger/logger";
import { hasChainEvmSupport } from "../util/has-chain-evm-support";
import { Transfer } from "../model/raw-transfer";
import { isEvmAddress } from "../../../data-aggregation/helper/is-evm-address";

dotenv.config({ path: __dirname + "/../.env" });

export class SwapsAndTransfersService {
  constructor(
    private blockTimeService: BlockTimeService,
    private subscanService: SubscanService,
  ) {}

  private async fetchTxAndTransfers(
    chainName: string,
    address: string,
    blockMin: number,
    blockMax: number,
    evm = false,
  ): Promise<{ transactions: Transaction[]; transfersList: Transfer[] }> {
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
    return { transactions, transfersList };
  }

  private async resolveAddresses(chainName: string, address: string) {
    const evmAddress = isEvmAddress(address) ? address : undefined;
    const substrateAddress = isEvmAddress(address)
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
  ): Promise<{ transactions: Transaction[]; transfersList: Transfer[] }> {
    let { transactions, transfersList } = substrateAddress
      ? await this.fetchTxAndTransfers(
          chainName,
          substrateAddress,
          blockMin,
          blockMax,
          false,
        )
      : { transactions: [], transfersList: [] };
    if (evmAddress && hasChainEvmSupport(chainName)) {
      const evmData = await this.fetchTxAndTransfers(
        chainName,
        evmAddress,
        blockMin,
        blockMax,
        true,
      );
      transfersList = transfersList.concat(evmData.transfersList);
      transactions = transactions.concat(evmData.transactions);
    }
    return { transactions, transfersList };
  }

  private filterByDate<T extends { timestamp?: number }>(
    items: T[],
    minDate: Date,
    maxDate?: Date,
  ) {
    const timestamp = (d: number) => d * 1000;
    const filterFn = (item: T) =>
      timestamp(item.timestamp) >= minDate.getTime() &&
      (!maxDate || timestamp(item.timestamp) <= maxDate.getTime());

    return items.filter(filterFn);
  }

  async fetchSwapsAndTransfers(data: {
    chainName: string;
    address: string;
    startDay: Date;
    endDay?: Date;
  }): Promise<{ transactions: Transaction[]; transfersList: Transfer[] }> {
    logger.info(`Enter fetchSwapsAndTransfers for ${data.chainName}`);

    const { substrateAddress, evmAddress } = await this.resolveAddresses(
      data.chainName,
      data.address,
    );
    const { blockMin, blockMax } = await this.blockTimeService.getMinMaxBlock(
      data.chainName,
      data.startDay.getTime(),
      data.endDay?.getTime(),
    );

    let { transactions, transfersList } = await this.loadAllTransfers(
      data.chainName,
      substrateAddress,
      evmAddress,
      blockMin,
      blockMax,
    );
    transactions = this.filterByDate<Transaction>(
      transactions,
      data.startDay,
      data.endDay,
    );
    const transfersListMapped = this.filterByDate(
      transfersList,
      data.startDay,
      data.endDay,
    );

    logger.info(`Exit fetchSwapsAndTransfers for ${data.chainName}`);
    return { transactions, transfersList: transfersListMapped };
  }
}
