import { describe, expect, it } from "vitest";
import { toggleSetMember } from "./set-utils";

describe("toggleSetMember", () => {
  it("adds a value that isn't in the set", () => {
    const result = toggleSetMember(new Set(["a"]), "b");
    expect(result.has("b")).toBe(true);
    expect([...result].sort()).toEqual(["a", "b"]);
  });

  it("removes a value that's already in the set", () => {
    const result = toggleSetMember(new Set(["a", "b"]), "b");
    expect(result.has("b")).toBe(false);
    expect([...result]).toEqual(["a"]);
  });

  it("does not mutate the original set", () => {
    const original = new Set(["a"]);
    toggleSetMember(original, "b");
    expect(original.has("b")).toBe(false);
    expect(original.size).toBe(1);
  });
});
