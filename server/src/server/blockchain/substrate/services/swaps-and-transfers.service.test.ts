import { expect, it, jest, describe, beforeEach } from "@jest/globals";
import { Transaction } from "../model/transaction";
import { Transfer } from "../model/raw-transfer";
import * as helper from "../../../data-aggregation/helper/is-evm-address";
import * as util from "../util/has-chain-evm-support";
import { SwapsAndTransfersService } from "./swaps-and-transfers.service";

// Mock all imported functions/modules
jest.mock("../../../logger/logger", () => ({
  logger: { info: jest.fn() },
}));
jest.mock("../../../data-aggregation/helper/is-evm-address", () => ({
  isEvmAddress: jest.fn(),
}));
jest.mock("../util/has-chain-evm-support", () => ({
  hasChainEvmSupport: jest.fn(),
}));

describe("SwapsAndTransfersService", () => {
  let service: SwapsAndTransfersService;

  // Mocked dependencies
  const mockSubscanService = {
    fetchAllTx: jest.fn<any>(),
    fetchAllTransfers: jest.fn<any>(),
    mapToSubstrateAccount: jest.fn<any>(),
  };

  const mockBlockTimeService = {
    getMinMaxBlock: jest.fn<any>(),
  };

  beforeEach(() => {
    service = new SwapsAndTransfersService(
      mockBlockTimeService as any,
      mockSubscanService as any,
    );
    jest.clearAllMocks();
  });

  const chainName = "test-chain";
  const address = "0xabc";
  const startDay = new Date("2023-01-01T00:00:00Z");
  const endDay = new Date("2023-01-02T00:00:00Z");

  it("fetches transfers with evm + substrate when evm supported", async () => {
    (helper.isEvmAddress as jest.Mock).mockImplementation(
      (testAdr) => testAdr === address,
    );
    (util.hasChainEvmSupport as jest.Mock).mockReturnValue(true);

    mockSubscanService.mapToSubstrateAccount.mockResolvedValue(
      "substrate-addr",
    );
    mockBlockTimeService.getMinMaxBlock.mockResolvedValue({
      blockMin: 100,
      blockMax: 200,
    });

    const tx = { timestamp: 1672531400 } as Transaction;
    const transfer = { timestamp: 1672531400 } as Transfer;

    // first call: substrate
    mockSubscanService.fetchAllTx.mockResolvedValueOnce([tx]);
    mockSubscanService.fetchAllTransfers.mockResolvedValueOnce([transfer]);
    // second call: evm
    mockSubscanService.fetchAllTx.mockResolvedValueOnce([tx]);
    mockSubscanService.fetchAllTransfers.mockResolvedValueOnce([transfer]);

    const result = await service.fetchSwapsAndTransfers({
      chainName,
      address,
      startDay,
      endDay,
    });

    expect(result.transactions).toEqual([tx, tx]);
    expect(result.transfersList).toEqual([transfer, transfer]);
    expect(mockSubscanService.mapToSubstrateAccount).toHaveBeenCalled();
    expect(mockSubscanService.fetchAllTx).toHaveBeenCalledTimes(2);
    expect(mockSubscanService.fetchAllTransfers).toHaveBeenCalledTimes(2);
  });

  it("skips evm fetch when no evm support", async () => {
    (helper.isEvmAddress as jest.Mock).mockReturnValue(true);
    (util.hasChainEvmSupport as jest.Mock).mockReturnValue(false);

    mockSubscanService.mapToSubstrateAccount.mockResolvedValue(
      "substrate-addr",
    );
    mockBlockTimeService.getMinMaxBlock.mockResolvedValue({
      blockMin: 100,
      blockMax: 200,
    });

    const tx = { timestamp: 1672531200 } as Transaction;
    const transfer = { timestamp: 1672531200 } as Transfer;

    mockSubscanService.fetchAllTx.mockResolvedValue([tx]);
    mockSubscanService.fetchAllTransfers.mockResolvedValue([transfer]);

    const result = await service.fetchSwapsAndTransfers({
      chainName,
      address,
      startDay,
      endDay,
    });

    expect(result.transactions).toEqual([tx]);
    expect(result.transfersList).toEqual([transfer]);
    expect(mockSubscanService.fetchAllTx).toHaveBeenCalledTimes(1);
    expect(mockSubscanService.fetchAllTransfers).toHaveBeenCalledTimes(1);
  });

  it("handles substrate-only address", async () => {
    (helper.isEvmAddress as jest.Mock).mockReturnValue(false);

    mockBlockTimeService.getMinMaxBlock.mockResolvedValue({
      blockMin: 100,
      blockMax: 200,
    });

    const tx = { timestamp: 1672531200 } as Transaction;
    const transfer = { timestamp: 1672531200 } as Transfer;

    mockSubscanService.fetchAllTx.mockResolvedValue([tx]);
    mockSubscanService.fetchAllTransfers.mockResolvedValue([transfer]);

    const result = await service.fetchSwapsAndTransfers({
      chainName,
      address,
      startDay,
      endDay,
    });

    expect(result.transactions).toEqual([tx]);
    expect(result.transfersList).toEqual([transfer]);
    expect(mockSubscanService.fetchAllTx).toHaveBeenCalledTimes(1);
    expect(mockSubscanService.fetchAllTransfers).toHaveBeenCalledTimes(1);
  });
});
