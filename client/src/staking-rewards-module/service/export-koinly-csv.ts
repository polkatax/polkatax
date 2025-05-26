import { Parser } from '@json2csv/plainjs';
import { Rewards } from '../model/rewards';
import { formatDateUTC } from '../../shared-module/util/date-utils';
import saveAs from 'file-saver';

export const exportKoinlyCsv = (stakingRewards: Rewards) => {
  const parser = new Parser();
  const values = [...(stakingRewards.values || [])].map((v) => {
    return {
      'Koinly Date': formatDateUTC(v.timestamp * 1000),
      Amount: v.amount,
      Currency: stakingRewards.token,
      Label: v.amount > 0 ? 'Reward' : 'Cost',
      TxHash: v.hash,
    };
  });
  const csv = parser.parse(values);
  saveAs(
    new Blob([csv], { type: 'text/plain;charset=utf-8' }),
    'staking-rewards.csv'
  );
};
