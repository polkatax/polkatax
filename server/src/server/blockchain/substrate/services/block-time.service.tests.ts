import { expect, it, jest, describe, beforeEach } from "@jest/globals";

import { BlockTimeService } from "./block-time.service";
import { SubscanApi } from "../api/subscan.api";
import { HttpError } from "../../../../common/error/HttpError";

describe("BlockTimeService", () => {
  let subscanApi: jest.Mocked<SubscanApi>;
  let service: BlockTimeService;

  beforeEach(() => {
    subscanApi = {
      fetchMetadata: jest.fn(),
      fetchBlock: jest.fn(),
      fetchBlockList: jest.fn(),
    } as any;

    service = new BlockTimeService(subscanApi);
  });

  describe("estimateBlockNum", () => {
    it("estimates block number within bounds", () => {
      const beforeBlock = { block_num: 100, block_timestamp: 1000 };
      const afterBlock = { block_num: 200, block_timestamp: 2000 };
      const estimated = (service as any).estimateBlockNum(
        beforeBlock,
        afterBlock,
        1500,
      );
      expect(estimated).toBe(150);
    });

    it("clamps estimate to at least 1", () => {
      const beforeBlock = { block_num: 1, block_timestamp: 0 };
      const afterBlock = { block_num: 100, block_timestamp: 100 };
      const estimated = (service as any).estimateBlockNum(
        beforeBlock,
        afterBlock,
        -100,
      );
      expect(estimated).toBe(1);
    });
  });

  describe("searchBlock", () => {
    const chain = "testchain";
    const minBlock = { block_num: 100, block_timestamp: 1000 };
    const maxBlock = { block_num: 200, block_timestamp: 2000 };

    it("returns block number if timestamp is within tolerance", async () => {
      subscanApi.fetchBlock.mockResolvedValue({
        block_num: 150,
        block_timestamp: 1600,
      });

      const result = await (service as any).searchBlock(
        chain,
        1600,
        minBlock,
        maxBlock,
      );
      expect(result).toBe(150);
    });

    it("recurses toward earlier block when timestamp is too high", async () => {
      const midBlock = { block_num: 150, block_timestamp: 1900 };
      const lowBlock = { block_num: 125, block_timestamp: 1400 };

      subscanApi.fetchBlock
        .mockResolvedValueOnce(midBlock)
        .mockResolvedValueOnce(lowBlock);

      const result = await (service as any).searchBlock(
        chain,
        1400,
        minBlock,
        maxBlock,
      );
      expect(result).toBe(125);
    });

    it("throws error if recursion depth exceeds MAX_DEPTH", async () => {
      subscanApi.fetchBlock.mockResolvedValue({
        block_num: 150,
        block_timestamp: 9999999,
      });

      await expect(
        (service as any).searchBlock(chain, 1000, minBlock, maxBlock, 1, 21),
      ).rejects.toThrow(HttpError);
    });
  });

  describe("getMinMaxBlock", () => {
    const mockMeta = { avgBlockTime: 6 };
    const firstBlock = { block_num: 1, block_timestamp: 1000 };
    const lastBlock = { block_num: 1000, block_timestamp: 2000 };

    beforeEach(() => {
      subscanApi.fetchMetadata.mockResolvedValue(mockMeta as any);
      subscanApi.fetchBlock.mockResolvedValueOnce(firstBlock); // fetchBlock(1)
      subscanApi.fetchBlockList.mockResolvedValue([lastBlock]);
    });

    it("calculates blockMin and blockMax with default tolerance", async () => {
      const searchSpy = jest
        .spyOn<any, any, any>(service, "searchBlock")
        .mockResolvedValueOnce(200) // for minDate
        .mockResolvedValueOnce(800); // for maxDate

      const minDate = 1200;
      const maxDate = 1800;

      const result = await service.getMinMaxBlock(
        "testchain",
        minDate,
        maxDate,
      );

      expect(searchSpy).toHaveBeenCalledTimes(2);
      expect(result.blockMin).toBeGreaterThan(0);
      expect(result.blockMax).toBeLessThanOrEqual(lastBlock.block_num);
    });

    it("sets blockMax to lastBlock if maxDate not provided", async () => {
      const searchSpy = jest
        .spyOn<any, any, any>(service, "searchBlock")
        .mockResolvedValueOnce(300);

      const result = await service.getMinMaxBlock("testchain", 1200);

      expect(searchSpy).toHaveBeenCalledTimes(1);
      expect(result.blockMax).toBeLessThanOrEqual(lastBlock.block_num);
    });
  });
});
