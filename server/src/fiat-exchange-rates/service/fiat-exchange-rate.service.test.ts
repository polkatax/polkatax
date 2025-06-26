import {
  test,
  expect,
  describe,
  beforeEach,
  jest,
  afterEach,
} from "@jest/globals";
import { ExchangeRateRestService } from "../exchange-rate-api/exchange-rate.rest-service";
import { FiatExchangeRateService } from "./fiat-exchange-rate.service";
import * as dateUtils from "../../common/util/date-utils";

jest.useFakeTimers();
jest.mock("../logger/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("FiatExchangeRateService", () => {
  let mockRestService: jest.Mocked<ExchangeRateRestService>;
  let service: FiatExchangeRateService;

  beforeEach(() => {
    mockRestService = {
      fetchTimeSeries: jest.fn(),
    } as unknown as jest.Mocked<ExchangeRateRestService>;

    jest.spyOn(dateUtils, "formatDate").mockReturnValue("2024-05-02");
    service = new FiatExchangeRateService(mockRestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize and sync immediately, then set interval for future syncs", async () => {
    const fakeData = { "2024-01-01": 1.1 };
    mockRestService.fetchTimeSeries.mockResolvedValue(fakeData as any);

    const syncSpy = jest.spyOn(service as any, "sync");

    await service.init();

    expect(syncSpy).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(12 * 60 * 60 * 1000); // advance 12 hours
    expect(syncSpy).toHaveBeenCalledTimes(2);
  });

  test("should fetch data for 11 years if exchangeRates is empty", async () => {
    const fakeData = { "2020-01-01": 1.0 };
    mockRestService.fetchTimeSeries.mockResolvedValue(fakeData as any);

    await (service as any).sync(); // call private method directly

    expect(mockRestService.fetchTimeSeries).toHaveBeenCalledTimes(11); // 10 years back + current
  });

  test("should fetch data for 2 years if exchangeRates has existing data", async () => {
    service.exchangeRates = { "2023-01-01": { usd: 1.2 } };

    const fakeData = { "2023-01-01": { usd: 1.1 } };
    mockRestService.fetchTimeSeries.mockResolvedValue(fakeData as any);

    await (service as any).sync();

    expect(mockRestService.fetchTimeSeries).toHaveBeenCalledTimes(2); // current + last year
  });

  test("should use December 31 if past year, otherwise formatDate", () => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const lastYear = thisYear - 1;

    // test future year
    const result1 = (service as any).endOfYearOrNow(thisYear + 1);
    expect(result1).toBe("2024-05-02"); // mocked formatDate

    // test past year
    const result2 = (service as any).endOfYearOrNow(lastYear);
    expect(result2).toBe(`${lastYear}-12-31`);
  });
});
