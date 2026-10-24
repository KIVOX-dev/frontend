import { describe, expect, it } from "vitest";
import { displayRoleName } from "./roleName";

describe("displayRoleName", () => {
  it("shows short lower-case roles as acronyms", () => {
    expect(displayRoleName("se")).toBe("SE");
    expect(displayRoleName("SE")).toBe("SE");
    expect(displayRoleName(" sde ")).toBe("SDE");
    expect(displayRoleName("qa")).toBe("QA");
  });

  it("title-cases longer lower-case roles and keeps two-letter acronym words", () => {
    expect(displayRoleName("software engineer")).toBe("Software Engineer");
    expect(displayRoleName("se intern")).toBe("SE Intern");
    expect(displayRoleName("head of sales")).toBe("Head of Sales");
  });

  it("leaves roles with deliberate capitals alone and handles empty values", () => {
    expect(displayRoleName("DevOps Engineer")).toBe("DevOps Engineer");
    expect(displayRoleName(undefined)).toBe("");
  });
});
