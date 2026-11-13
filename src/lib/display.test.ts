import { describe, expect, it } from "vitest";
import { displayUnit, formatClockHours, formatRange, formatValue, isClockUnit } from "./display";

describe("formatClockHours", () => {
  it("wraps past midnight", () => {
    expect(formatClockHours(26.25)).toBe("2:15 AM");
    expect(formatClockHours(24)).toBe("12:00 AM");
    expect(formatClockHours(24.5)).toBe("12:30 AM");
  });
  it("formats evening and morning hours", () => {
    expect(formatClockHours(23.5)).toBe("11:30 PM");
    expect(formatClockHours(6.5)).toBe("6:30 AM");
    expect(formatClockHours(12)).toBe("12:00 PM");
  });
  it("rounds to the nearest minute", () => {
    expect(formatClockHours(23.9999)).toBe("12:00 AM");
    expect(formatClockHours(7.258)).toBe("7:15 AM");
  });
});

describe("formatValue", () => {
  it("uses clock time for sleep time-of-day units", () => {
    expect(isClockUnit("h (24 = midnight)")).toBe(true);
    expect(formatValue(26.25, "number", "h (24 = midnight)")).toBe("2:15 AM");
    expect(formatValue(6.5, "number", "h (6.5 = 6:30 AM)")).toBe("6:30 AM");
  });
  it("keeps durations and plain numbers", () => {
    expect(formatValue(450, "duration", null)).toBe("7h 30m");
    expect(formatValue(5.2, "number", "mg/dL")).toBe("5.2 mg/dL");
    expect(formatValue(5, "number", null)).toBe("5");
  });
  it("formats ranges", () => {
    expect(formatRange(null, 24, "number", "h (24 = midnight)")).toBe("––12:00 AM");
    expect(formatRange(1, 2, "number", "mg/dL")).toBe("1–2");
  });
});

describe("Fahrenheit", () => {
  it("converts absolute temperatures", () => {
    expect(formatValue(37, "number", "°C")).toBe("98.6 °F");
    expect(formatRange(36.1, 37.2, "number", "°C")).toBe("97–99");
  });
  it("converts baseline deltas without the +32 offset", () => {
    expect(formatValue(0.3, "number", "°C vs baseline")).toBe("+0.5 °F vs baseline");
    expect(formatValue(-0.5, "number", "°C vs baseline")).toBe("-0.9 °F vs baseline");
    expect(formatValue(0, "number", "°C vs baseline")).toBe("0 °F vs baseline");
    expect(formatRange(-1, 1, "number", "°C vs baseline")).toBe("-1.8–+1.8");
    expect(displayUnit("°C vs baseline")).toBe("°F vs baseline");
  });
});
