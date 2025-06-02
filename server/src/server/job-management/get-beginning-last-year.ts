export const getBeginningLastYear = (): number => {
  return new Date(
    Date.UTC(
      new Date().getUTCFullYear() - 2,
      11, // month index (0-based, so 11 = December)
      31,
      0,
      0,
      0,
      0,
    ),
  ).getTime();
};
