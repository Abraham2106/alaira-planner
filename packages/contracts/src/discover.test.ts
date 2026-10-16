import { describe, expect, it } from "vitest";
import { discoverContractModules } from "./discover.js";

describe("discoverContractModules", () => {
  it("loads poc context without central registry edits", async () => {
    const mods = await discoverContractModules();
    const poc = mods.find((m) => m.context === "poc");
    expect(poc).toBeDefined();
    expect(poc?.schemas.AcceptPocItemBody).toBeDefined();
  });
});
