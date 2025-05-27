import { Job } from "../../model/job";
import { expect, it, describe } from "@jest/globals";
import { determineNextJob } from "./determine-next-job";

describe("determineNextJob", () => {
  const jobs: Job[] = [
    { reqId: 1, wallet: "A", lastModified: 10 },
    { reqId: 2, wallet: "B", lastModified: 5 },
    { reqId: 3, wallet: "A", lastModified: 7 },
    { reqId: 4, wallet: "C", lastModified: 8 },
  ] as any[];

  it("returns undefined when no jobs", () => {
    expect(determineNextJob([])).toBeUndefined();
  });

  it("returns the oldest job when no lastWallet is given", () => {
    const job = determineNextJob(jobs);
    expect(job.reqId).toBe(2); // job with lastModified = 5
  });

  it("returns job with next wallet in round-robin order", () => {
    const job = determineNextJob(jobs, "A");
    expect(job.wallet).toBe("C");
    expect(job.reqId).toBe(4);
  });

  it("wraps around when last wallet is the last in list", () => {
    const job = determineNextJob(jobs, "C");
    expect(job.wallet).toBe("B");
    expect(job.reqId).toBe(2);
  });

  it("returns oldest job if last wallet is unknown", () => {
    const job = determineNextJob(jobs, "Z");
    expect(job.reqId).toBe(2); // same as when no lastWallet
  });
});
