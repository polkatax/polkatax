export const getBeginningAndEndOfYear = (
  year: number
): { beginning: number; end: number } => {
  const beginning = new Date(year, 0, 1, 0, 0, 0, 0).getTime();
  const end = new Date(year, 11, 31, 23, 59, 99, 999).getTime();
  return { beginning, end };
};
