import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Rewards } from '../model/rewards';
import {
  formatCurrency,
  formatTokenAmount,
} from '../../shared-module/util/number-formatters';
import { formatTimeFrame } from '../../shared-module/util/date-utils';

export const exportPdf = (rewards: Rewards) => {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text('Staking Rewards Report', 14, 20);

  let y = 30;
  const distance = 8;

  const writeText = (text: string) => {
    doc.text(text, 14, y);
    y += distance;
  };

  // Add meta info
  doc.setFontSize(10);
  writeText(`Timeframe: ${formatTimeFrame(rewards.timeFrame)}`);
  writeText(`Blockchain: ${rewards.chain}`);
  writeText(`Token: ${rewards.token}`);
  writeText(`Wallet: ${rewards.address}`);
  writeText(
    `Total rewards: ${
      rewards.summary.fiatValue
        ? formatCurrency(rewards.summary.fiatValue, rewards.currency)
        : '?'
    }`
  );
  writeText(
    `Total rewards in ${rewards.token}: ${formatTokenAmount(
      rewards.summary.amount,
      4
    )}`
  );

  // Table starts below meta
  autoTable(doc, {
    startY: y,
    head: [['', 'Reward Amount', 'Value']],
    body: Object.keys(rewards.dailyValues).map((key) => {
      const value = rewards.dailyValues[key];
      return [
        key,
        formatTokenAmount(value.amount, 4),
        value.fiatValue
          ? formatCurrency(value.fiatValue, rewards.currency)
          : '?',
      ];
    }),
    styles: { fontSize: 9 },
    theme: 'striped',
    headStyles: { fillColor: [22, 160, 133], halign: 'right' },
    columnStyles: {
      0: { cellWidth: 60, halign: 'left' }, // cell width will add up to 180
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 85, halign: 'right' },
    },
    didDrawCell: (data) => {
      if (data.section === 'head' && data.column.index === 0) {
        const { cell, doc } = data;
        data.cell.text = [''];
        const y = cell.y + cell.height / 2;
        doc.setPage(data.pageNumber);
        doc.text('Date', cell.x + 2, y, { baseline: 'middle' });
      }
    },
  });

  doc.save('staking-rewards.pdf');
};
