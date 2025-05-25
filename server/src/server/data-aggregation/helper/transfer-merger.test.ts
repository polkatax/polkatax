import { expect, it, describe } from "@jest/globals";
import { PricedTransaction } from "../model/priced-transaction";
import { PricedTransfer } from "../model/priced-transfer";
import { TransferMerger } from "./transfer-merger";

describe("TransferMerger", () => {
  const merger = new TransferMerger();
  const nativeToken = "ETH";
  const myAddress = "0xMe";
  const alias = "0xAlias";

  it("merges a simple incoming transfer correctly", () => {
    const transfers: PricedTransfer[] = [
      {
        hash: "0x123",
        from: "0xSomeone",
        to: myAddress,
        symbol: "DAI",
        tokenId: "DAI",
        amount: 50,
      },
    ] as any;

    const txs: PricedTransaction[] = [];

    const result = merger.mergeTxAndTranfersToObject(
      nativeToken,
      transfers,
      txs,
      myAddress,
      [],
    );

    expect(result["0x123"]).toBeDefined();
    expect(result["0x123"].tokens["DAI"].amount).toBe(50);
    expect(result["0x123"].tokens["DAI"].to).toBe(myAddress);
    expect(result["0x123"].tokens["DAI"].from).toBe("0xSomeone");
  });

  it("merges a simple outgoing transfer correctly", () => {
    const transfers: PricedTransfer[] = [
      {
        hash: "0xabc",
        from: myAddress,
        to: "0xOther",
        symbol: "USDC",
        tokenId: "USDC",
        amount: 100,
      },
    ] as any;

    const txs: PricedTransaction[] = [];

    const result = merger.mergeTxAndTranfersToObject(
      nativeToken,
      transfers,
      txs,
      myAddress,
      [],
    );

    expect(result["0xabc"].tokens["USDC"].amount).toBe(-100);
    expect(result["0xabc"].tokens["USDC"].from).toBe(myAddress);
    expect(result["0xabc"].tokens["USDC"].to).toBe("0xOther");
  });

  it("handles incoming and outgoing for same token in same tx", () => {
    const transfers: PricedTransfer[] = [
      {
        hash: "0xmix",
        from: myAddress,
        to: "0xA",
        symbol: "DAI",
        tokenId: "DAI",
        amount: 30,
      },
      {
        hash: "0xmix",
        from: "0xA",
        to: myAddress,
        symbol: "DAI",
        tokenId: "DAI",
        amount: 20,
      },
    ] as any;

    const result = merger.mergeTxAndTranfersToObject(
      nativeToken,
      transfers,
      [],
      myAddress,
      [],
    );

    // Net amount: -10
    expect(result["0xmix"].tokens["DAI"].amount).toBe(-10);
    expect(result["0xmix"].tokens["DAI"].from).toBe(myAddress);
    expect(result["0xmix"].tokens["DAI"].to).toBe("0xA"); // from last isMyAccount check
  });

  it("adds native token from transaction when amount is positive", () => {
    const txs: PricedTransaction[] = [
      {
        hash: "0xnative",
        from: "0xSender",
        to: myAddress,
        amount: 0.5,
        label: "Bridge In",
      },
    ] as any;

    const result = merger.mergeTxAndTranfersToObject(
      nativeToken,
      [],
      txs,
      myAddress,
      [],
    );

    const tx = result["0xnative"].tokens[nativeToken];
    expect(tx.amount).toBe(0.5);
    expect(tx.symbol).toBe(nativeToken);
    expect(tx.to).toBe(myAddress);
    expect(tx.from).toBe("0xSender");
    expect(result["0xnative"].label).toBe("Bridge In");
  });

  it("handles aliases as my address", () => {
    const transfers: PricedTransfer[] = [
      {
        hash: "0xa",
        from: alias,
        to: "0xMarket",
        symbol: "ETH",
        tokenId: "ETH",
        amount: 1.2,
      },
    ] as any;

    const result = merger.mergeTxAndTranfersToObject(
      nativeToken,
      transfers,
      [],
      myAddress,
      [alias],
    );

    expect(result["0xa"].tokens["ETH"].amount).toBe(-1.2);
    expect(result["0xa"].tokens["ETH"].from).toBe(myAddress);
    expect(result["0xa"].tokens["ETH"].to).toBe("0xMarket");
  });

  it("removes zero-amount tokens from merged result", () => {
    const transfers: PricedTransfer[] = [
      {
        hash: "0xzero",
        from: myAddress,
        to: "0xA",
        symbol: "FOO",
        tokenId: "FOO",
        amount: 50,
      },
      {
        hash: "0xzero",
        from: "0xB",
        to: myAddress,
        symbol: "FOO",
        tokenId: "FOO",
        amount: 50,
      },
    ] as any;

    const result = merger.mergeTxAndTranfersToObject(
      nativeToken,
      transfers,
      [],
      myAddress,
      [],
    );

    expect(result["0xzero"].tokens["FOO"]).toBeUndefined(); // canceled out
  });

  it("merges transfers not associated with any transaction", () => {
    const transfers: PricedTransfer[] = [
      {
        hash: "0xstandalone",
        from: "0xC",
        to: myAddress,
        symbol: "USDT",
        tokenId: "USDT",
        amount: 20,
      },
    ] as any;

    const result = merger.mergeTxAndTranfersToObject(
      nativeToken,
      transfers,
      [], // no tx
      myAddress,
      [],
    );

    expect(result["0xstandalone"]).toBeDefined();
    expect(result["0xstandalone"].tokens["USDT"].amount).toBe(20);
  });
});
