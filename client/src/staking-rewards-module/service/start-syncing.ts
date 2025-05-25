export const startSyncing = async (
  address: string,
  currency: string,
  year: number
): Promise<any[]> => {
  const result = await fetch(
    `/api/jobs/staking-rewards/${address}/${year}?currency=${currency}&timezone=${
      Intl.DateTimeFormat().resolvedOptions().timeZone
    }`,
    {
      method: 'POST',
    }
  );
  if (!result.ok) {
    throw result;
  }
  return result.json();
};
