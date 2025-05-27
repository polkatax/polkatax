import { DateTime } from "luxon";
import { expect, it, describe } from "@jest/globals";
import { getYearRangeInZone } from "./get-range-in-time-zone";

describe("getYearRangeInZone", () => {
  const zone = "America/New_York";

  it("returns correct start and end dates for past year", () => {
    const { startDay, endDay } = getYearRangeInZone(2022, zone);

    expect(startDay).toEqual(
      DateTime.fromObject(
        {
          year: 2022,
          month: 1,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
        },
        { zone },
      ).toJSDate(),
    );

    expect(endDay).toEqual(
      DateTime.fromObject(
        {
          year: 2022,
          month: 12,
          day: 31,
          hour: 23,
          minute: 59,
          second: 59,
          millisecond: 999,
        },
        { zone },
      ).toJSDate(),
    );
  });

  it("returns undefined for endDay if it is in the future", () => {
    const nextYear = new Date().getFullYear() + 1;
    const { endDay } = getYearRangeInZone(nextYear, zone);

    expect(endDay).toBeUndefined();
  });

  it("returns a valid start date even if year is in the future", () => {
    const nextYear = new Date().getFullYear() + 1;
    const { startDay } = getYearRangeInZone(nextYear, zone);

    const expectedStart = DateTime.fromObject(
      {
        year: nextYear,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      },
      { zone },
    ).toJSDate();

    expect(startDay).toEqual(expectedStart);
  });

  it("handles different time zones correctly", () => {
    const utcStart = getYearRangeInZone(2023, "UTC").startDay;
    const nyStart = getYearRangeInZone(2023, "America/New_York").startDay;

    expect(utcStart.getTime()).not.toBe(nyStart.getTime());
  });
});
