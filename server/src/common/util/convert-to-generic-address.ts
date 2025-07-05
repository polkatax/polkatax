import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";

export const convertToGenericAddress = (address: string): string => {
  if (isValidSubstrateAddress(address)) {
    const publicKey = decodeAddress(address);
    /**
     * @see https://polkadot.polkassembly.io/referenda/1217
     */
    return encodeAddress(publicKey, 0);
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
