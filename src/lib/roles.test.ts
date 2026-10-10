import { describe, it, expect } from "vitest";
import {
  hasRole,
  isRole,
  canAccessPath,
  requiredRolesForPath,
  SELF_ASSIGNABLE_ROLES,
} from "./roles";

describe("isRole", () => {
  it("accepts known roles", () => {
    expect(isRole("client")).toBe(true);
    expect(isRole("admin")).toBe(true);
  });
  it("rejects unknown values", () => {
    expect(isRole("superuser")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});

describe("hasRole", () => {
  it("admin satisfies any requirement", () => {
    expect(hasRole("admin", "vendor")).toBe(true);
    expect(hasRole("admin", ["courier", "client"])).toBe(true);
  });
  it("matches exact roles", () => {
    expect(hasRole("vendor", "vendor")).toBe(true);
    expect(hasRole("vendor", ["vendor", "admin"])).toBe(true);
  });
  it("rejects mismatched roles", () => {
    expect(hasRole("client", "vendor")).toBe(false);
    expect(hasRole(undefined, "client")).toBe(false);
  });
});

describe("requiredRolesForPath", () => {
  it("marks public routes as undefined", () => {
    expect(requiredRolesForPath("/home")).toBeUndefined();
    expect(requiredRolesForPath("/discover")).toBeUndefined();
  });
  it("marks shared authed routes as null", () => {
    expect(requiredRolesForPath("/account")).toBeNull();
    expect(requiredRolesForPath("/Checkout")).toBeNull();
    expect(requiredRolesForPath("/history")).toBeNull();
  });
  it("maps role areas to roles", () => {
    expect(requiredRolesForPath("/admin")).toEqual(["admin"]);
    expect(requiredRolesForPath("/vendor/dashboard")).toEqual(["vendor"]);
    expect(requiredRolesForPath("/courier/dashboard")).toEqual(["courier"]);
  });
});

describe("canAccessPath", () => {
  it("lets anyone view public routes", () => {
    expect(canAccessPath("/home", undefined)).toBe(true);
  });
  it("requires any role for shared authed routes", () => {
    expect(canAccessPath("/account", undefined)).toBe(false);
    expect(canAccessPath("/account", "client")).toBe(true);
  });
  it("enforces role areas", () => {
    expect(canAccessPath("/admin", "client")).toBe(false);
    expect(canAccessPath("/admin", "admin")).toBe(true);
    expect(canAccessPath("/vendor/dashboard", "vendor")).toBe(true);
    expect(canAccessPath("/vendor/dashboard", "courier")).toBe(false);
    // admin can reach everything
    expect(canAccessPath("/vendor/dashboard", "admin")).toBe(true);
  });
});

describe("SELF_ASSIGNABLE_ROLES", () => {
  it("never allows self-assigning admin", () => {
    expect(SELF_ASSIGNABLE_ROLES).not.toContain("admin");
  });
});
