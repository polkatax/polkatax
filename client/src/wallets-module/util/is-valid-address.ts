import { decodeAddress } from '@polkadot/util-crypto';
import { getAddress } from 'ethers';

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

export const isValidAddress = (address: string) => {
  return isValidEvmAddress(address) || isValidSubstrateAddress(address);
};
