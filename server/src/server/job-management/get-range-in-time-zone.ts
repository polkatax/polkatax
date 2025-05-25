import { DateTime } from "luxon";

export const getYearRangeInZone = (
  year: number,
  timeZone: string,
): { startDay: Date; endDay: Date | undefined } => {
  const start = DateTime.fromObject(
    { year, month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 },
    { zone: timeZone },
  );

  const end = DateTime.fromObject(
    {
      year,
      month: 12,
      day: 31,
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    },
    { zone: timeZone },
  );

  return {
    startDay: start.toJSDate(),
    endDay: end.toJSDate() > new Date() ? undefined : end.toJSDate(),
  };
};
