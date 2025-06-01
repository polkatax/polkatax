import { Block } from "../model/block";
import { SubscanApi } from "../api/subscan.api";
import { logger } from "../../../logger/logger";
import { HttpError } from "../../../../common/error/HttpError";

const MAX_DEPTH = 20;

export class BlockTimeService {
  constructor(private subscanApi: SubscanApi) {}

  private async searchBlock(
    chainName: string,
    date: number,
    minBlock: Block,
    maxBlock: Block,
    tolerance = 3 * 24 * 60 * 60,
    depth = 0,
  ): Promise<number> {
    if (depth > MAX_DEPTH) {
      throw new HttpError(
        500,
        "The block matching the given date could not be found. Please try again later or raise a github issue",
      );
    }
    const estimate = this.estimateBlockNum(minBlock, maxBlock, date);
    const currentBlock: Block = await this.subscanApi.fetchBlock(
      chainName,
      estimate,
    );
    if (Math.abs(currentBlock.block_timestamp - date) > tolerance) {
      if (currentBlock?.block_timestamp > date) {
        return this.searchBlock(
          chainName,
          date,
          minBlock,
          currentBlock,
          tolerance,
          depth + 1,
        );
      } else {
        return this.searchBlock(
          chainName,
          date,
          currentBlock,
          maxBlock,
          tolerance,
          depth + 1,
        );
      }
    }
    return currentBlock.block_num;
  }

  private estimateBlockNum(
    beforeBlock: Block,
    afterBlock: Block,
    date: number,
  ): number {
    const timeDiffRel =
      (date - beforeBlock.block_timestamp) /
      (afterBlock.block_timestamp - beforeBlock.block_timestamp);
    return Math.min(
      afterBlock.block_num,
      Math.max(
        1,
        Math.round(
          beforeBlock.block_num +
            (afterBlock.block_num - beforeBlock.block_num) * timeDiffRel,
        ),
      ),
    );
  }

  async getMinMaxBlock(
    chainName: string,
    minDate: number,
    maxDate?: number,
  ): Promise<{ blockMin: number; blockMax: number }> {
    logger.info(
      `Entry getMinMaxBlock for chain ${chainName} and minDate ${new Date(minDate).toISOString()}, maxDate ${maxDate ? new Date(maxDate).toISOString() : "undefined"}`,
    );
    const tolerance = 3 * 24 * 60 * 60;
    const [meta, firstBlock, blockList] = await Promise.all([
      this.subscanApi.fetchMetadata(chainName),
      this.subscanApi.fetchBlock(chainName, 1),
      this.subscanApi.fetchBlockList(chainName, 0, 1),
    ]);
    const lastBlock: Block = blockList[0];
    const blockMin = await this.searchBlock(
      chainName,
      Math.max(minDate, firstBlock.block_timestamp),
      firstBlock,
      lastBlock,
    );
    const blockMax = maxDate
      ? await this.searchBlock(
          chainName,
          Math.min(maxDate, lastBlock.block_timestamp),
          firstBlock,
          lastBlock,
        )
      : lastBlock.block_num;
    logger.info(`Exit getMinMaxBlock for chain ${chainName}`);
    return {
      blockMin: Math.max(
        1,
        Math.round(blockMin - (3 * tolerance) / meta.avgBlockTime),
      ),
      blockMax: Math.min(
        lastBlock.block_num,
        Math.round(blockMax + (3 * tolerance) / meta.avgBlockTime),
      ),
    };
  }
}
