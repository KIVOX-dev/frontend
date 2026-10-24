import { describe, expect, it } from "vitest";
import { displayCompanyName } from "./CompanyPicker";

describe("displayCompanyName", () => {
  it("shows every spelling of a listed company the same way", () => {
    expect(displayCompanyName("tcs")).toBe("TCS");
    expect(displayCompanyName("TCS")).toBe("TCS");
    expect(displayCompanyName("  Tcs ")).toBe("TCS");
    expect(displayCompanyName("tech  mahindra")).toBe("Tech Mahindra");
    expect(displayCompanyName("hcl tech")).toBe("HCLTech");
  });

  it("title-cases an unlisted name typed in lower case, but keeps deliberate capitals", () => {
    expect(displayCompanyName("acme robotics")).toBe("Acme Robotics");
    expect(displayCompanyName("iGate")).toBe("iGate");
    expect(displayCompanyName("McKinsey & Co")).toBe("McKinsey & Co");
  });

  it("handles missing values", () => {
    expect(displayCompanyName(undefined)).toBe("");
    expect(displayCompanyName("   ")).toBe("");
  });
});
