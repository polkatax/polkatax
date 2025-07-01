import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";

export const convertToGenericAddress = (address: string): string => {
  if (isValidSubstrateAddress(address)) {
    const publicKey = decodeAddress(address);
    return encodeAddress(publicKey, 42);
  } else {
    return address;
  }
};

export function isValidSubstrateAddress(addr: string): boolean {
  try {
    decodeAddress(addr);
    return true;
  } catch {
    return false;
  }
}
