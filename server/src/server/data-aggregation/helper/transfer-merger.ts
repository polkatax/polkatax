import { logger } from "../../logger/logger";
import { PricedTransaction } from "../model/priced-transaction";
import { PricedTransfer } from "../model/priced-transfer";

export interface MergedTransfers {
  [hash: string]: {
    tokens: { [tokenId: string]: PricedTransfer };
    label?: string;
  };
}

export class TransferMerger {
  private merge(
    target: MergedTransfers,
    nativeToken: string,
    address: string,
    transferList: PricedTransfer[],
    isMyAccount: (acc: string) => boolean,
    tx?: PricedTransaction,
  ) {
    if (tx && tx.amount > 0) {
      transferList.push({
        ...tx,
        from: tx.from,
        to: tx.to,
        symbol: nativeToken,
        tokenId: nativeToken,
      });
    }
    let hash = undefined;
    transferList.forEach((entry) => {
      hash ??= entry.hash;
      if (!entry.hash) {
        return;
      }
      const otherAddress = isMyAccount(entry.from) ? entry.to : entry.from;
      if (!target[entry.hash]) {
        target[entry.hash] = { tokens: {} };
      }
      if (!target[entry.hash].tokens[entry.tokenId]) {
        target[entry.hash].tokens[entry.tokenId] = {
          ...entry,
          amount: 0,
        };
      }
      const currentTransfer = target[entry.hash].tokens[entry.tokenId];
      if (isMyAccount(entry.to)) {
        currentTransfer.amount += Number(entry.amount);
      } else if (isMyAccount(entry.from)) {
        currentTransfer.amount -= Number(entry.amount);
      } else {
        logger.warn("no match for transfer!");
      }
      if (currentTransfer.amount > 0) {
        currentTransfer.to = address;
        currentTransfer.from = otherAddress;
      } else {
        currentTransfer.from = address;
        currentTransfer.to = otherAddress;
      }
    });
    const toRemove = [];
    Object.entries(target[hash]?.tokens || []).forEach(
      ([token, priceTransfer]) => {
        if (priceTransfer.amount === 0) {
          toRemove.push(token);
        }
      },
    );
    toRemove.forEach((t) => delete target[hash].tokens[t]);
    if (tx && target[tx.hash]) {
      target[tx.hash].label = tx.label;
    }
  }

  mergeTxAndTranfersToObject(
    nativeToken: string,
    transferList: PricedTransfer[],
    txList: PricedTransaction[],
    address: string,
    aliases: string[],
  ): MergedTransfers {
    const isMyAccount = (addressToTest: string) =>
      address.toLowerCase() === addressToTest.toLowerCase() ||
      aliases.indexOf(addressToTest) > -1;

    const mergedTransfers: MergedTransfers = {};

    const hashToTransferMap = {};
    for (let transfer of transferList) {
      if (!transfer.hash) {
        continue;
      }
      if (!hashToTransferMap[transfer.hash]) {
        hashToTransferMap[transfer.hash] = [];
      }
      hashToTransferMap[transfer.hash].push(transfer);
    }

    for (let tx of txList) {
      this.merge(
        mergedTransfers,
        nativeToken,
        address,
        hashToTransferMap[tx.hash] || [],
        isMyAccount,
        tx,
      );
    }

    const remainingUnprocessedTransfers = transferList.filter(
      (t) => !mergedTransfers[t.hash],
    );
    this.merge(
      mergedTransfers,
      nativeToken,
      address,
      remainingUnprocessedTransfers,
      isMyAccount,
    );

    return mergedTransfers;
  }
}
