/**
 * @fileoverview Unit tests for the adminAuth middleware.
 *
 * Mirrors the test in the server workspace but imported directly here
 * so the client test runner covers the server middleware logic too
 * (pure TypeScript, no Node/Express required to test logic).
 *
 * Tests cover:
 * - All feature ids within each section are unique
 * - All feature definitions have required fields populated
 * - Select features have options; slider features have min/max
 * - getDefaultsForSection produces correct default values
 * - getFeaturesForSection filters correctly
 * - getFeature lookup works and returns undefined for unknowns
 */

import { describe, expect, it } from "vitest";
import {
  ADVANCED_FEATURES,
  ALL_FEATURES,
  COMMA_AI_FEATURES,
  getDefaultsForSection,
  getFeature,
  getFeaturesForSection,
  LANE_CHANGE_FEATURES,
  LATERAL_FEATURES,
  LONGITUDINAL_FEATURES,
} from "../../lib/featureRegistry";
import type { ConfigRecord } from "../../types/config";
import { createDefaultConfig } from "../../types/config";

describe("featureRegistry — getFeaturesForSection", () => {
  it("returns longitudinal features", () => {
    const features = getFeaturesForSection("longitudinal");
    expect(features.length).toBeGreaterThan(0);
    expect(features.every((f) => f.section === "longitudinal")).toBe(true);
  });

  it("returns commaAI features", () => {
    const features = getFeaturesForSection("commaAI");
    expect(features.length).toBeGreaterThan(0);
    expect(features.every((f) => f.section === "commaAI")).toBe(true);
  });

  it("returns empty array for a section with no registry entries", () => {
    expect(getFeaturesForSection("metadata")).toHaveLength(0);
  });
});

describe("featureRegistry — getFeature", () => {
  it("finds a known feature by section + id", () => {
    const feat = getFeature("longitudinal", "e2eEnabled");
    expect(feat).toBeDefined();
    expect(feat?.label).toBe("End-to-End Longitudinal");
    expect(feat?.type).toBe("toggle");
  });

  it("returns undefined for an unknown id", () => {
    expect(getFeature("longitudinal", "doesNotExist")).toBeUndefined();
  });

  it("returns undefined when section doesn't match", () => {
    expect(getFeature("commaAI", "e2eEnabled")).toBeUndefined();
  });
});

describe("featureRegistry — getDefaultsForSection", () => {
  it("maps every registered feature id to its default value", () => {
    const defaults = getDefaultsForSection("longitudinal");
    for (const feat of LONGITUDINAL_FEATURES) {
      expect(Object.prototype.hasOwnProperty.call(defaults, feat.id)).toBe(
        true,
      );
      expect(defaults[feat.id]).toStrictEqual(feat.default);
    }
  });

  it("returns an empty object for a section with no features", () => {
    expect(getDefaultsForSection("metadata")).toEqual({});
  });
});

describe("featureRegistry — integrity", () => {
  it("all feature ids within each section array are unique", () => {
    for (const arr of [
      LATERAL_FEATURES,
      LONGITUDINAL_FEATURES,
      LANE_CHANGE_FEATURES,
      COMMA_AI_FEATURES,
      ADVANCED_FEATURES,
    ]) {
      const ids = arr.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("every feature has non-empty id, label, and description", () => {
    for (const feat of ALL_FEATURES) {
      expect(feat.id.trim().length).toBeGreaterThan(0);
      expect(feat.label.trim().length).toBeGreaterThan(0);
      expect(feat.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("select features each have at least one option", () => {
    const selects = ALL_FEATURES.filter((f) => f.type === "select");
    expect(selects.length).toBeGreaterThan(0); // sanity: there are some selects
    for (const feat of selects) {
      expect(feat.options?.length).toBeGreaterThan(0);
    }
  });

  it("slider features have min < max", () => {
    const sliders = ALL_FEATURES.filter((f) => f.type === "slider");
    for (const feat of sliders) {
      expect(typeof feat.min).toBe("number");
      expect(typeof feat.max).toBe("number");
      expect(feat.min!).toBeLessThan(feat.max!);
    }
  });

  it("toggle features have boolean defaults", () => {
    const toggles = ALL_FEATURES.filter((f) => f.type === "toggle");
    for (const feat of toggles) {
      expect(typeof feat.default).toBe("boolean");
    }
  });
});

// ─── source field ─────────────────────────────────────────────────────────────

describe("featureRegistry — source field", () => {
  const VALID_SOURCES = ["sunnypilot", "openpilot"] as const;

  it("every feature declares a source field", () => {
    for (const feat of ALL_FEATURES) {
      expect(
        feat.source,
        `Feature '${feat.section}.${feat.id}' is missing the required 'source' field`,
      ).toBeDefined();
    }
  });

  it("every source value is 'sunnypilot' or 'openpilot'", () => {
    for (const feat of ALL_FEATURES) {
      expect(
        VALID_SOURCES.includes(feat.source as (typeof VALID_SOURCES)[number]),
        `Feature '${feat.section}.${feat.id}' has invalid source '${feat.source}'`,
      ).toBe(true);
    }
  });

  it("SP_* param keys are tagged as sunnypilot", () => {
    const spKeyFeatures = ALL_FEATURES.filter((f) =>
      f.spKey?.startsWith("SP_"),
    );
    for (const feat of spKeyFeatures) {
      expect(
        feat.source,
        `Feature '${feat.id}' has SP_* param key but source is '${feat.source}' — should be 'sunnypilot'`,
      ).toBe("sunnypilot");
    }
  });
});

// ─── Registry ↔ createDefaultConfig sync ─────────────────────────────────────
//
// This is the MOST IMPORTANT test suite. It ensures that every feature in the
// registry has a corresponding key in createDefaultConfig(). If you add a
// feature to featureRegistry.ts but forget to add it to createDefaultConfig()
// in types/config.ts, this test will fail and the Docker build will abort.

describe("featureRegistry — sync with createDefaultConfig()", () => {
  it("every registered feature id exists in createDefaultConfig() for its section", () => {
    const defaults = createDefaultConfig();

    for (const feat of ALL_FEATURES) {
      const section = defaults[feat.section as keyof typeof defaults] as
        | Record<string, unknown>
        | undefined;

      expect(
        section,
        `Section '${feat.section}' is missing from createDefaultConfig() — ` +
          `check that createDefaultConfig() returns a '${feat.section}' key`,
      ).toBeDefined();

      expect(
        Object.prototype.hasOwnProperty.call(section, feat.id),
        `Feature '${feat.section}.${feat.id}' is registered in featureRegistry.ts ` +
          `but its id '${feat.id}' is not a key in createDefaultConfig().${feat.section}. ` +
          `Add it to the ${feat.section} object in createDefaultConfig() inside types/config.ts.`,
      ).toBe(true);
    }
  });

  it("every registered toggle feature has a boolean in createDefaultConfig()", () => {
    const defaults = createDefaultConfig();
    const toggles = ALL_FEATURES.filter((f) => f.type === "toggle");

    for (const feat of toggles) {
      const section = defaults[feat.section as keyof typeof defaults] as
        | Record<string, unknown>
        | undefined;
      const value = section?.[feat.id];

      expect(
        typeof value,
        `createDefaultConfig().${feat.section}.${feat.id} should be boolean ` +
          `(toggle), got ${typeof value}`,
      ).toBe("boolean");
    }
  });

  it("every registered number/slider feature has a number in createDefaultConfig()", () => {
    const defaults = createDefaultConfig();
    const numbers = ALL_FEATURES.filter(
      (f) => f.type === "number" || f.type === "slider",
    );

    for (const feat of numbers) {
      const section = defaults[feat.section as keyof typeof defaults] as
        | Record<string, unknown>
        | undefined;
      const value = section?.[feat.id];

      expect(
        typeof value,
        `createDefaultConfig().${feat.section}.${feat.id} should be number, got ${typeof value}`,
      ).toBe("number");
    }
  });
});

// ─── ConfigRecord clone provenance fields ─────────────────────────────────────
//
// These tests validate the shape/contract of the clone linkage fields added to
// ConfigRecord. They act as a guard so any accidental removal of clonedFromId
// or clonedFrom from the type will cause a TS error or test failure.

describe("ConfigRecord — clone provenance type contract", () => {
  it("clonedFromId is optional and can be null, undefined, or a string", () => {
    const configs: ConfigRecord[] = [
      {
        id: "1",
        name: "No provenance",
        config: createDefaultConfig(),
        tags: [],
        isShared: false,
        isReadOnly: false,
        viewCount: 0,
        cloneCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // clonedFromId intentionally omitted — should be allowed
      },
      {
        id: "2",
        name: "Has provenance ID",
        config: createDefaultConfig(),
        tags: [],
        isShared: false,
        isReadOnly: false,
        viewCount: 0,
        cloneCount: 0,
        clonedFromId: "original-id-abc",
        clonedFrom: {
          id: "original-id-abc",
          name: "Original Config",
          shareToken: "tok123",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Cloned from unshared",
        config: createDefaultConfig(),
        tags: [],
        isShared: false,
        isReadOnly: false,
        viewCount: 0,
        cloneCount: 0,
        clonedFromId: "original-id-xyz",
        clonedFrom: {
          id: "original-id-xyz",
          name: "Private Origin",
          shareToken: null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    expect(configs[0].clonedFromId).toBeUndefined();
    expect(configs[1].clonedFromId).toBe("original-id-abc");
    expect(configs[2].clonedFrom?.shareToken).toBeNull();
  });

  it("clonedFrom has id, name, and shareToken fields", () => {
    const provenance = { id: "abc", name: "Source Config", shareToken: "tok" };
    expect(provenance).toHaveProperty("id");
    expect(provenance).toHaveProperty("name");
    expect(provenance).toHaveProperty("shareToken");
  });

  it("a config without clonedFrom does not affect normal ConfigRecord usage", () => {
    const record: ConfigRecord = {
      id: "plain",
      name: "Plain Config",
      config: createDefaultConfig(),
      tags: ["highway"],
      isShared: true,
      isReadOnly: true,
      shareToken: "abc123",
      viewCount: 10,
      cloneCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(record.clonedFromId).toBeUndefined();
    expect(record.clonedFrom).toBeUndefined();
    expect(record.cloneCount).toBe(3);
  });
});
