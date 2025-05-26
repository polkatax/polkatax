import { Parser } from '@json2csv/plainjs';
import { Reward, Rewards } from '../model/rewards';
import { formatDateUTC } from '../../shared-module/util/date-utils';
import saveAs from 'file-saver';

interface RewardsTableHeader extends Reward {
  'Reward token': string;
  Chain: string;
  Currency: string;
  'Wallet address': string;
  totalAmount: number;
  totalValue: number;
  totalValueNow: number;
  utcDate: string;
}

export const exportDefaultCsv = (rewards: Rewards) => {
  const parser = new Parser();
  const values = [...(rewards.values || [])].map((v) => {
    return {
      ...v,
      utcDate: formatDateUTC(v.timestamp * 1000),
    };
  });
  values[0] = {
    'Reward token': rewards.token,
    Chain: rewards.chain,
    Currency: rewards.currency,
    'Wallet address': rewards.address,
    ...values[0],
    totalAmount: rewards.summary.amount,
    totalValue: rewards.summary.fiatValue,
    totalValueNow: rewards.summary?.valueNow,
  } as RewardsTableHeader;
  const csv = parser.parse(values);
  saveAs(
    new Blob([csv], { type: 'text/plain;charset=utf-8' }),
    'staking-rewards.csv'
  );
};
