import { z } from "zod";
import { decodeAddress } from "@polkadot/util-crypto";
import { getAddress } from "ethers";

function isValidEvmAddress(addr: string): boolean {
  try {
    return getAddress(addr) === addr;
  } catch {
    return false;
  }
}

function isValidSubstrateAddress(addr: string): boolean {
  try {
    decodeAddress(addr);
    return true;
  } catch {
    return false;
  }
}

const isValidWalletAddress = (address: string) => {
  return isValidEvmAddress(address) || isValidSubstrateAddress(address);
};

export const WalletInfoSchema = z.object({
  wallet: z.string().refine(isValidWalletAddress, {
    message: "Wallet must be a valid EVM or Substrate address",
  }),
  currency: z.string(),
  syncFromDate: z.number().optional(),
  blockchains: z.array(z.string()).optional(),
});

export const WebSocketIncomingMessageSchema = z.object({
  type: z.union([
    z.literal("fetchDataRequest"),
    z.literal("unsubscribeRequest"),
  ]),
  timestamp: z.number(),
  reqId: z.string(),
  payload: WalletInfoSchema,
});

export type WalletInfo = z.infer<typeof WalletInfoSchema>;
export type WebSocketIncomingMessage = z.infer<
  typeof WebSocketIncomingMessageSchema
>;
