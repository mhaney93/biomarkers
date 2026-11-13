import { describe, expect, it } from "vitest";
import { findTerms } from "./glossary";

const terms = (...t: string[]) => findTerms(t).map((e) => e.term);

describe("findTerms", () => {
  it("defines SD for Sleep Consistency", () => {
    expect(terms("Sleep Consistency (Monthly)", "min SD")).toContain("SD");
  });
  it("defines the sleep stage and efficiency terms", () => {
    expect(terms("REM Sleep (Monthly)")).toEqual(expect.arrayContaining(["Sleep stages", "REM"]));
    expect(terms("Sleep Efficiency (Monthly)")).toContain("Sleep efficiency");
    expect(terms("Awake Time After Falling Asleep (Monthly)")).toContain("WASO");
    expect(terms("REMOTE")).not.toContain("REM");
  });
  it("matches whole units only", () => {
    expect(terms("items", "mmHg")).not.toContain("ms");
    expect(terms("ms")).toContain("ms");
    expect(terms("Total Body Fat %")).toContain("%");
  });
  it("returns nothing for plain text", () => {
    expect(terms("Hello")).toEqual([]);
  });
});
