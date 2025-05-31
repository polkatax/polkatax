import { SubscanService } from "../api/subscan.service";
import { StakingReward } from "../model/staking-reward";

export class StakingRewardsViaEventsService {
  constructor(private subscanService: SubscanService) {}

  async fetchStakingRewards(
    chain,
    address,
    module,
    eventId,
    startDate: number,
  ): Promise<StakingReward[]> {
    const events = await this.subscanService.searchAllEvents(
      chain,
      address,
      module,
      eventId,
      startDate,
    );
    const transfers = await this.subscanService.fetchAllTransfersFrom(
      chain,
      address,
      startDate,
    );
    const eventHashes = events.map((e) => e.extrinsic_hash);
    return transfers
      .filter((transfer) => eventHashes.indexOf(transfer.hash) > -1)
      .map((transfer) => {
        return {
          event_id: transfer.amount < 0 ? "Slash" : "Reward",
          amount: transfer.amount,
          timestamp: transfer.timestamp,
          block: Number(transfer.extrinsic_index.split("-")[0]),
          hash: transfer.hash,
        };
      });
  }
}
