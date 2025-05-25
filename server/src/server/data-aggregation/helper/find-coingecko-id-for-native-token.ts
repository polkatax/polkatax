import { evmChainConfigs } from "../../blockchain/evm/constants/evm-chains.config";
import * as substrateTokenToCoingeckoId from "../../../../res/substrate-token-to-coingecko-id.json";
import * as subscanChains from "../../../../res/gen/subscan-chains.json";

export const findCoingeckoIdForNativeToken = (
  chainName: string,
): string | undefined => {
  if (evmChainConfigs[chainName]) {
    return evmChainConfigs[chainName]?.nativeTokenCoingeckoId;
  } else {
    const chainInfo = subscanChains.chains.find(
      (c) => c.domain === chainName,
    ) || { token: "" };
    return substrateTokenToCoingeckoId.tokens.find(
      (t) => t.token.toUpperCase() === chainInfo.token.toUpperCase(),
    )?.coingeckoId;
  }
};
