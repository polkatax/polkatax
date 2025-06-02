import { Job } from "../../model/job";

export const determineNextJob = (
  pendingJobs: Job[],
  lastWallet?: string,
): Job | undefined => {
  if (pendingJobs.length === 0) return undefined;

  const sorted = pendingJobs
    .slice()
    .sort((a, b) => a.lastModified - b.lastModified);
  if (!lastWallet) return sorted[0];

  const wallets = Array.from(new Set(sorted.map((j) => j.wallet)));
  const idx = wallets.indexOf(lastWallet);

  const nextWallet =
    idx === -1 ? wallets[0] : wallets[(idx + 1) % wallets.length];
  return sorted.find((j) => j.wallet === nextWallet);
};
