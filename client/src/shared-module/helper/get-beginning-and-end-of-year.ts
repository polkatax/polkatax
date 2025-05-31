export const getBeginningAndEndOfYear = (year: number): { beginning: number, end: number } => {
  const beginning =
    new Date(
      year,
      0,
      1,
      0,
      0,
      0,
      0
    ).getTime() / 1000;
  const end =
    new Date(
      year,
      11,
      31,
      23,
      59,
      99,
      999
    ).getTime() / 1000;
    return { beginning, end }
}