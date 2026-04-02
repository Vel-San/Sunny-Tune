/**
 * @fileoverview Tests for the verified vehicle list (server/src/lib/vehicles.ts).
 *
 * Tests cover:
 * - VERIFIED_VEHICLES shape (make, displayName, models array)
 * - At least a reasonable number of makes and models per make
 * - No duplicate makes
 * - KNOWN_MAKES Set contains all makes
 * - getModelsForMake returns correct data and handles unknown makes
 */

import { describe, expect, it } from "vitest";
import {
  getModelsForMake,
  KNOWN_MAKES,
  VERIFIED_VEHICLES,
} from "../../lib/vehicles";

describe("VERIFIED_VEHICLES", () => {
  it("contains at least 10 makes", () => {
    expect(VERIFIED_VEHICLES.length).toBeGreaterThanOrEqual(10);
  });

  it("each entry has a non-empty make, displayName, and models array", () => {
    for (const entry of VERIFIED_VEHICLES) {
      expect(entry.make, "make should be non-empty").toBeTruthy();
      expect(entry.displayName, "displayName should be non-empty").toBeTruthy();
      expect(Array.isArray(entry.models), "models should be an array").toBe(
        true,
      );
      // The "other" catch-all entry intentionally has no models listed
      if (entry.make !== "other") {
        expect(
          entry.models.length,
          `${entry.make} should have at least 1 model`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("has no duplicate makes", () => {
    const makes = VERIFIED_VEHICLES.map((v) => v.make);
    const unique = new Set(makes);
    expect(unique.size).toBe(makes.length);
  });

  it("includes toyota with common models", () => {
    const toyota = VERIFIED_VEHICLES.find((v) => v.make === "toyota");
    expect(toyota).toBeDefined();
    expect(toyota!.models).toContain("Camry");
    expect(toyota!.models).toContain("RAV4");
  });

  it("includes honda with common models", () => {
    const honda = VERIFIED_VEHICLES.find((v) => v.make === "honda");
    expect(honda).toBeDefined();
    expect(honda!.models).toContain("Civic");
  });
});

describe("KNOWN_MAKES", () => {
  it("is a Set", () => {
    expect(KNOWN_MAKES).toBeInstanceOf(Set);
  });

  it("contains all makes from VERIFIED_VEHICLES", () => {
    for (const entry of VERIFIED_VEHICLES) {
      expect(
        KNOWN_MAKES.has(entry.make),
        `${entry.make} should be in KNOWN_MAKES`,
      ).toBe(true);
    }
  });

  it("does not contain an unknown make", () => {
    expect(KNOWN_MAKES.has("unicorn")).toBe(false);
  });
});

describe("getModelsForMake", () => {
  it("returns an array of model names for a known make", () => {
    const models = getModelsForMake("toyota");
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
  });

  it("returns an empty array for an unknown make", () => {
    const models = getModelsForMake("notamake");
    expect(models).toEqual([]);
  });

  it("returns the same list as VERIFIED_VEHICLES for that make", () => {
    const entry = VERIFIED_VEHICLES[0];
    const models = getModelsForMake(entry.make);
    expect(models).toEqual(entry.models);
  });
});
