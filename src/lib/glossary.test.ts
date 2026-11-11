import { describe, expect, it } from "vitest";
import { findTerms } from "./glossary";

const terms = (...t: string[]) => findTerms(t).map((e) => e.term);

describe("findTerms", () => {
  it("defines SD for Sleep Consistency", () => {
    expect(terms("Sleep Consistency (Monthly)", "min SD")).toContain("SD");
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
