import { describe, expect, it } from "vitest";
import { discoverWorkerJobs } from "../src/bootstrap/load-jobs.js";

describe("worker job autodiscovery", () => {
  it("loads poc job folder", async () => {
    const jobs = await discoverWorkerJobs();
    expect(jobs.map((j) => j.name)).toContain("poc");
  });
});
