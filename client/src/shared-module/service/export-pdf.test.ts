import { expect, jest, it, describe } from '@jest/globals';
import { exportPdf } from './export-pdf';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Rewards } from '../model/rewards';

const mockDocInstance = {
  setFontSize: jest.fn<any>(),
  text: jest.fn<any>(),
  save: jest.fn<any>(),
  setPage: jest.fn<any>(),
};
jest.mock('jspdf', () => {
  return {
    jsPDF: jest.fn(() => mockDocInstance),
  };
});

jest.mock('jspdf-autotable', () => jest.fn());

jest.mock('../util/number-formatters', () => ({
  formatCurrency: jest.fn(
    (val: number, cur: string) => `$${val.toFixed(2)} ${cur}`
  ),
  formatTokenAmount: jest.fn((val: number) => val.toFixed(4)),
}));

describe('exportPdf', () => {
  it('should generate and save a PDF with meta and table data', () => {
    const mockRewards: Rewards = {
      token: 'DOT',
      chain: 'Polkadot',
      currency: 'USD',
      address: '0x123',
      summary: {
        amount: 123.4567,
        fiatValue: 987.65,
        valueNow: 1050.0,
      },
      dailyValues: {
        '2024-01-01': { amount: 10.1234, fiatValue: 80.12 },
        '2024-01-02': { amount: 5.2345, fiatValue: 40.45 },
      },
      values: [],
    } as any;

    exportPdf(mockRewards, 2024);

    // Basic assertions
    expect(jsPDF).toHaveBeenCalled();
    expect(mockDocInstance.setFontSize).toHaveBeenCalled();
    expect(mockDocInstance.text).toHaveBeenCalledWith(
      'Staking Rewards Report',
      14,
      20
    );
    expect(mockDocInstance.save).toHaveBeenCalledWith('staking-rewards-Polkadot-0x123-2024.pdf');

    // AutoTable called with correct config
    expect(autoTable).toHaveBeenCalled();
    const tableArgs = (autoTable as jest.Mock).mock.calls[0][1] as any; // second param to autoTable
    expect(tableArgs.head[0]).toEqual(['', 'Reward Amount', 'Value']);
    expect(tableArgs.body.length).toBe(2); // 2 rows
  });
});
