import * as subscanChains from "../../../../res/gen/subscan-chains.json";
import { evmChainConfigs } from "../../blockchain/evm/constants/evm-chains.config";

export const getNativeToken = (chainName: string): string => {
  if (evmChainConfigs[chainName]) {
    return evmChainConfigs[chainName]?.nativeToken;
  } else {
    return subscanChains.chains.find((s) => s.domain === chainName)?.token;
  }
};
