import { Token } from "../model/token";
import { Transaction } from "../model/transaction";
import { RawStakingReward } from "../model/staking-reward";
import { SubscanApi } from "./subscan.api";
import { logger } from "../../../logger/logger";
import { SubscanEvent } from "../model/subscan-event";
import {
  RawEvmTransferDto,
  RawSubstrateTransferDto,
  Transfer,
} from "../model/raw-transfer";

export class SubscanService {
  constructor(private subscanApi: SubscanApi) {}

  async mapToSubstrateAccount(
    chainName: string,
    account: string,
  ): Promise<string> {
    logger.info(
      `Enter mapToSubstrateAccount for chain ${chainName} and account ${account}`,
    );
    const address = await this.subscanApi.mapToSubstrateAccount(
      chainName,
      account,
    );
    logger.info(`Exit mapToSubstrateAccount with address ${address}`);
    return address;
  }

  async fetchNativeToken(chainName: string): Promise<Token> {
    return this.subscanApi.fetchNativeToken(chainName);
  }

  async searchAllEvents(
    chainName: string,
    address: string,
    module: string,
    event_id: string,
    startDate: number,
  ): Promise<SubscanEvent[]> {
    return this.iterateOverPagesParallel<SubscanEvent>((page) =>
      this.subscanApi.searchEvents(
        chainName,
        address,
        module,
        event_id,
        page,
        startDate,
      ),
    );
  }

  async searchAllExtrinsics(
    chainName: string,
    address: string,
    module: string,
    call: string,
    block_min?: number,
    block_max?: number,
  ): Promise<Transaction[]> {
    return this.iterateOverPagesParallel<Transaction>((page) =>
      this.subscanApi.searchExtrinsics(
        chainName,
        address,
        module,
        call,
        page,
        block_min,
        block_max,
      ),
    );
  }

  private async retry<T>(
    query: () => Promise<T>,
    retries = 2,
    backOff = [5000, 10000],
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await query();
      } catch (e) {
        logger.warn(e);
        if (i === retries - 1) throw e;
        await new Promise((res) => setTimeout(res, backOff[i]));
      }
    }
  }

  private async iterateOverPagesParallel<T>(
    fetchPages: (page) => Promise<{ list: T[]; hasNext: boolean }>,
    count = 5,
  ): Promise<T[]> {
    const parallelFn = [...Array(count).keys()].map(
      (offset) => (page) => fetchPages(page + offset),
    );
    let page = 0;
    const result = [];
    let hasNext = false;
    do {
      const intermediate_results = await Promise.all(
        parallelFn.map((fn) => this.retry(() => fn(page))),
      );
      intermediate_results.forEach((intermediate) =>
        result.push(...intermediate.list),
      );
      hasNext = intermediate_results[intermediate_results.length - 1].hasNext;
      page += count;
    } while (hasNext);
    return result;
  }

  fetchAllStakingRewards(
    chainName: string,
    address: string,
    startDate: number,
  ): Promise<RawStakingReward[]> {
    logger.info(
      `fetchAllStakingRewards for ${chainName}, address ${address}, starting from ${new Date(startDate).toISOString()}`,
    );
    return this.iterateOverPagesParallel((page) =>
      this.subscanApi.fetchStakingRewards(
        chainName,
        address,
        page,
        true,
        startDate,
      ), 3
    );
  }

  fetchAllTx(
    chainName: string,
    address: string,
    block_min?: number,
    block_max?: number,
    evm = false,
  ): Promise<Transaction[]> {
    logger.info(
      `fetchAllExtrinsics for ${chainName} and address ${address}. Evm ${evm}`,
    );
    const result = this.iterateOverPagesParallel<Transaction>(
      (page) =>
        this.subscanApi.fetchExtrinsics(
          chainName,
          address,
          page,
          block_min,
          block_max,
          evm,
        ),
      3,
    );
    logger.info(
      `Exit fetchAllExtrinsics for ${chainName} and address ${address}`,
    );
    return result;
  }

  async fetchAllTransfersFrom(
    chainName: string,
    account: string,
    startDate: number,
    evm = false,
  ): Promise<Transfer[]> {
    logger.info(
      `fetchAllTransfers for ${chainName} and account ${account} starting from ${new Date(startDate).toISOString()}. Evm: ${evm}`,
    );
    const result = await this.iterateOverPagesParallel<
      RawSubstrateTransferDto & RawEvmTransferDto
    >(
      (page) =>
        this.subscanApi.fetchTransfersFrom(
          chainName,
          account,
          page,
          startDate,
          evm,
        ),
      3,
    );
    logger.info(
      `Exit fetchAllTransfers for ${chainName} and account ${account}`,
    );
    return result.map((transfer) => {
      return {
        symbol: transfer.symbol || transfer.asset_symbol,
        amount: Number(transfer.amount),
        from: transfer.from,
        to: transfer.to,
        label:
          transfer?.to_display?.evm_contract.contract_name || transfer.module,
        block: transfer.block_num,
        timestamp: transfer.block_timestamp || transfer.create_at,
        hash: transfer.hash,
        tokenId: transfer.asset_unique_id || transfer.contract,
        extrinsic_index: transfer.extrinsic_index,
      };
    });
  }

  async fetchAllTransfers(
    chainName: string,
    account: string,
    block_min?: number,
    block_max?: number,
    evm = false,
  ): Promise<Transfer[]> {
    logger.info(
      `fetchAllTransfers for ${chainName} and account ${account}. Evm: ${evm}`,
    );
    const result = await this.iterateOverPagesParallel<
      RawSubstrateTransferDto & RawEvmTransferDto
    >(
      (page) =>
        this.subscanApi.fetchTransfers(
          chainName,
          account,
          page,
          block_min,
          block_max,
          evm,
        ),
      3,
    );
    logger.info(
      `Exit fetchAllTransfers for ${chainName} and account ${account}`,
    );
    return result.map((transfer) => {
      return {
        symbol: transfer.symbol || transfer.asset_symbol,
        amount: Number(transfer.amount),
        from: transfer.from,
        to: transfer.to,
        label:
          transfer?.to_display?.evm_contract.contract_name || transfer.module,
        block: transfer.block_num,
        timestamp: transfer.block_timestamp || transfer.create_at,
        hash: transfer.hash,
        tokenId: transfer.asset_unique_id || transfer.contract,
        extrinsic_index: transfer.extrinsic_index,
      };
    });
  }

  async fetchAccounts(address: string, chainName: string): Promise<string[]> {
    return this.subscanApi.fetchAccounts(address, chainName);
  }
}
