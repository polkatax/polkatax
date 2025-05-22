import { MetaData } from "../model/meta-data";
import { Token } from "../model/token";
import { Block } from "../model/block";
import { RawStakingReward } from "../model/staking-reward";
import { BigNumber } from "bignumber.js";
import { Transaction } from "../model/transaction";
import { RequestHelper } from "../../../../common/util/request.helper";
import { RuntimeMetaData } from "../model/runtime-meta-data";
import { SubscanEvent } from "../model/subscan-event";
import {
  RawEvmTransferDto,
  RawSubstrateTransferDto,
} from "../model/raw-transfer";

export class SubscanApi {
  private requestHelper: RequestHelper;

  constructor() {
    if (!process.env["SUBSCAN_API_KEY"]) {
      throw Error(
        "Subscan api key not found. It must be provided as env var SUBSCAN_API_KEY",
      );
    }
    this.requestHelper = new RequestHelper();
    this.requestHelper.defaultHeader = {
      "Content-Type": "application/json",
      "x-api-key": process.env["SUBSCAN_API_KEY"],
    };
  }

  async mapToSubstrateAccount(
    chainName: string,
    account: string,
  ): Promise<string> {
    const response = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/api/v2/scan/search`,
      "post",
      { key: account },
    );
    const info = response.data;
    return info?.account?.substrate_account?.address;
  }

  async searchEvents(
    chainName: string,
    address: string,
    module: string,
    event_id: string,
    page: number,
    block_min: number,
    block_max?: number,
  ): Promise<{ list: SubscanEvent[]; hasNext: boolean }> {
    const response = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/api/v2/scan/events`,
      "post",
      {
        row: 100,
        page,
        address,
        module,
        event_id,
        success: true,
        block_range:
          block_min !== undefined && block_max !== undefined
            ? `${block_min}-${block_max}`
            : undefined,
        finalized: true,
      },
    );
    const data = response.data;
    return {
      list: data?.events ?? [],
      hasNext: (data?.events ?? []).length >= 100,
    };
  }

  async searchExtrinsics(
    chainName: string,
    address: string,
    module: string,
    call: string,
    page: number,
    block_min: number,
    block_max?: number,
  ): Promise<{ list: Transaction[]; hasNext: boolean }> {
    const responseBody = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/api/v2/scan/extrinsics`,
      `post`,
      {
        row: 100,
        page,
        address,
        module,
        call,
        success: true,
        block_range:
          block_min !== undefined && block_max !== undefined
            ? `${block_min}-${block_max}`
            : undefined,
      },
    );
    return {
      list: (responseBody.data?.extrinsics ?? []).map((entry) => {
        return {
          hash: entry.extrinsic_hash,
          account: entry.account_display.address,
          block_timestamp: entry.block_timestamp,
          block_num: entry.block_num,
          label:
            (entry.call_module || "") + (entry.call_module_function || "."),
        };
      }),
      hasNext: (responseBody.data?.extrinsics ?? []).length >= 100,
    };
  }

  async fetchMetadata(chainName: string): Promise<MetaData> {
    const response = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/api/scan/metadata`,
      `post`,
      {},
    );
    const meta = response.data;
    return {
      avgBlockTime: Number(meta.avgBlockTime) || Number(meta.blockTime),
      blockNum: Number(meta.blockNum),
    };
  }

  async fetchRuntimeMetadata(chainName: string): Promise<RuntimeMetaData> {
    const response = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/api/scan/runtime/metadata`,
      `post`,
      {},
    );
    return response.data;
  }

  async fetchNativeToken(chainName: string): Promise<Token> {
    const response = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/api/scan/token`,
      `post`,
      {},
    );
    const data = response.data;
    return Object.values(data.detail).find(
      (value: Token & { asset_type: string }) => value.asset_type === `native`,
    ) as Token;
  }

  async fetchBlock(chainName: string, blockNum: number): Promise<Block> {
    const response = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/api/scan/block`,
      `post`,
      {
        block_num: blockNum,
        only_head: true,
      },
    );
    return response.data;
  }

  async fetchBlockList(chainName: string, page = 0, row = 1): Promise<Block[]> {
    const response = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/api/v2/scan/blocks`,
      `post`,
      {
        page,
        row,
      },
    );
    return response.data.blocks;
  }

  private mapStakingRewards(
    rawResponseList: any[] | undefined,
  ): RawStakingReward[] {
    return (rawResponseList || []).map((entry) => {
      return {
        event_id: entry.event_id,
        amount: BigNumber(entry.amount),
        timestamp: entry.block_timestamp,
        block: entry.extrinsic_index.split("-")[0],
        hash: entry.extrinsic_hash,
      };
    });
  }

  async fetchStakingRewards(
    chainName: string,
    address: string,
    page: number = 0,
    isStash: boolean,
    block_min?: number,
    block_max?: number,
  ): Promise<{ list: RawStakingReward[]; hasNext: boolean }> {
    const responseBody = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/api/scan/account/reward_slash`,
      `post`,
      {
        row: 100,
        page,
        address,
        is_stash: isStash,
        block_range:
          block_min !== undefined && block_max !== undefined
            ? `${block_min}-${block_max}`
            : undefined,
      },
    );
    return {
      list: this.mapStakingRewards(responseBody.data?.list),
      hasNext: (responseBody.data?.list || []).length >= 100,
    };
  }

  async fetchAccounts(address: string, chainName: string): Promise<string[]> {
    const json = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/api/v2/scan/accounts`,
      `post`,
      {
        address: [address],
        row: 100,
      },
    );
    return (json?.data?.list ?? []).map((entry) => entry.address);
  }

  async fetchExtrinsics(
    chainName: string,
    address: string,
    page: number = 0,
    block_min?: number,
    block_max?: number,
    evm = false,
  ): Promise<{ list: Transaction[]; hasNext: boolean }> {
    const endpoint = evm
      ? "api/scan/evm/v2/transactions"
      : "api/v2/scan/extrinsics";
    const responseBody = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/${endpoint}`,
      `post`,
      {
        row: 100,
        page,
        address,
        success: true,
        block_range:
          block_min !== undefined && block_max !== undefined
            ? `${block_min}-${block_max}`
            : undefined,
      },
    );
    return {
      list: (
        responseBody.data?.extrinsics ||
        responseBody.data?.list ||
        []
      ).map((entry) => {
        if (evm) {
          entry = {
            ...entry,
            account_display: {
              address: entry.from,
            },
            functionName: entry.method,
            callModule: entry.contract_name,
            extrinsic_hash: entry.hash,
            value: entry.value,
          };
        }
        return {
          hash: entry.extrinsic_hash,
          from: entry.account_display.address,
          to: entry.to,
          timestamp: entry.block_timestamp,
          block_num: entry.block_num,
          label: entry.call_module ?? "" + entry.call_module_function ?? "",
          amount: entry.value ? Number(entry.value) : 0,
          extrinsic_index: entry.extrinsic_index,
        };
      }),
      hasNext:
        (responseBody.data?.extrinsics || responseBody.data?.list || [])
          .length >= 100,
    };
  }

  async fetchTransfers(
    chainName: string,
    account: string,
    page: number = 0,
    block_min?: number,
    block_max?: number,
    evm = false,
  ): Promise<{
    list: (RawSubstrateTransferDto & RawEvmTransferDto)[];
    hasNext: boolean;
  }> {
    const endpoint = evm
      ? "api/scan/evm/token/transfer"
      : "api/v2/scan/transfers";
    const responseBody = await this.requestHelper.req(
      `https://${chainName}.api.subscan.io/${endpoint}`,
      `post`,
      {
        row: 100,
        page,
        address: account,
        success: true,
        block_range:
          block_min !== undefined && block_max !== undefined
            ? `${block_min}-${block_max}`
            : undefined,
      },
    );
    const list = responseBody.data?.transfers || responseBody.data?.list || [];
    return {
      list,
      hasNext: list.length >= 100,
    };
  }
}
