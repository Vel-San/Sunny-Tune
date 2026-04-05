/**
 * @fileoverview Unit tests for fieldHelp.ts
 *
 * Tests cover:
 * - FIELD_HELP is a non-empty record
 * - All entries have at least one populated field (summary, tips, or tradeoffs)
 * - Known critical SP keys are present (the ones shown in the configurator)
 * - FieldHelp entries with wikiUrl use valid https URLs
 * - No entry has an empty tips or tradeoffs array (should be undefined or non-empty)
 * - HelpTooltip-relevant keys align with keys used in ConfigSection spKey props
 */

import { describe, expect, it } from "vitest";
import { FIELD_HELP, type FieldHelp } from "../../lib/fieldHelp";

// ─── Basic structure ──────────────────────────────────────────────────────────

describe("FIELD_HELP — basic structure", () => {
  it("exports a non-empty record", () => {
    expect(typeof FIELD_HELP).toBe("object");
    expect(Object.keys(FIELD_HELP).length).toBeGreaterThan(10);
  });

  it("all keys are non-empty strings (valid SP parameter names)", () => {
    for (const key of Object.keys(FIELD_HELP)) {
      expect(typeof key).toBe("string");
      expect(key.trim().length).toBeGreaterThan(0);
      // SP keys are PascalCase — no spaces
      expect(key).not.toContain(" ");
    }
  });

  it("no entry is a completely empty object", () => {
    for (const [key, help] of Object.entries(FIELD_HELP)) {
      const hasContent =
        help.summary ||
        (help.tips && help.tips.length > 0) ||
        (help.tradeoffs && help.tradeoffs.length > 0) ||
        help.recommended ||
        help.defaultNote ||
        help.wikiUrl;
      expect(hasContent, `Entry for "${key}" has no content`).toBeTruthy();
    }
  });
});

// ─── Array fields: no empty arrays ────────────────────────────────────────────

describe("FIELD_HELP — array fields are never empty", () => {
  it("tips arrays, when present, have at least one item", () => {
    for (const [key, help] of Object.entries(FIELD_HELP)) {
      if (help.tips !== undefined) {
        expect(
          help.tips.length,
          `Entry "${key}".tips is an empty array — use undefined instead`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("tradeoffs arrays, when present, have at least one item", () => {
    for (const [key, help] of Object.entries(FIELD_HELP)) {
      if (help.tradeoffs !== undefined) {
        expect(
          help.tradeoffs.length,
          `Entry "${key}".tradeoffs is an empty array — use undefined instead`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

// ─── Wiki URLs ────────────────────────────────────────────────────────────────

describe("FIELD_HELP — wikiUrl values", () => {
  it("all wikiUrl values start with https://", () => {
    for (const [key, help] of Object.entries(FIELD_HELP)) {
      if (help.wikiUrl) {
        expect(
          help.wikiUrl.startsWith("https://"),
          `Entry "${key}".wikiUrl does not start with https://`,
        ).toBe(true);
      }
    }
  });

  it("wikiUrl values do not contain whitespace", () => {
    for (const [key, help] of Object.entries(FIELD_HELP)) {
      if (help.wikiUrl) {
        expect(
          /\s/.test(help.wikiUrl),
          `Entry "${key}".wikiUrl contains whitespace`,
        ).toBe(false);
      }
    }
  });
});

// ─── Critical keys must be present ───────────────────────────────────────────

describe("FIELD_HELP — critical SP keys are present", () => {
  // These are the spKey values actually used in the section components and
  // the SharedConfigPage ROW components.  If a key is removed from FIELD_HELP
  // it should be caught here.
  const requiredKeys: string[] = [
    // Lateral
    "CameraOffset",
    "LiveTorqueParamsToggle",
    "NeuralNetworkLateralControl",
    "EnforceTorqueControl",
    "LagdToggle",
    "TorqueControlTune",
    "TorqueParamsOverrideEnabled",
    // Longitudinal
    "ExperimentalMode",
    "DynamicExperimentalControl",
    "AlphaLongitudinalEnabled",
    "HyundaiLongitudinalTuning",
    "PlanplusControl",
    "CustomAccIncrementsEnabled",
    // Speed control
    "SpeedLimitMode",
    "SpeedLimitPolicy",
    "SpeedLimitOffsetType",
    "SmartCruiseControlVision",
    "SmartCruiseControlMap",
    // Lane change
    "AutoLaneChangeTimer",
    "BlindSpot",
    "BlinkerMinLateralControlSpeed",
    "BlinkerPauseLateralControl",
    "BlinkerLateralReengageDelay",
    // Navigation
    "OsmLocal",
    // Interface
    "StandstillTimer",
    "GreenLightAlert",
    "LeadDepartAlert",
    "AlwaysOnDM",
    "ShowTurnSignals",
    "RoadNameToggle",
    "QuietMode",
    "HideVEgoUI",
    "TorqueBar",
    "DevUIInfo",
    "OnroadUploads",
    // Comma AI / MADS
    "RecordFront",
    "GsmMetered",
    "DisengageOnAccelerator",
    "IsLdwEnabled",
    "SunnylinkEnabled",
    "Mads",
    "MadsMainCruiseAllowed",
    "MadsSteeringMode",
    "MadsUnifiedEngagementMode",
    // Advanced
    "QuickBootToggle",
    // Driving personality
    "DrivingPersonality",
  ];

  for (const key of requiredKeys) {
    it(`has an entry for "${key}"`, () => {
      expect(
        Object.prototype.hasOwnProperty.call(FIELD_HELP, key),
        `FIELD_HELP is missing an entry for spKey "${key}"`,
      ).toBe(true);
    });
  }
});

// ─── FieldHelp interface conformance ─────────────────────────────────────────

describe("FIELD_HELP — FieldHelp interface conformance", () => {
  it("all values are valid FieldHelp objects (no unexpected keys)", () => {
    const allowedKeys = new Set<keyof FieldHelp>([
      "summary",
      "tips",
      "tradeoffs",
      "wikiUrl",
      "recommended",
      "defaultNote",
    ]);
    for (const [key, help] of Object.entries(FIELD_HELP)) {
      for (const prop of Object.keys(help)) {
        expect(
          allowedKeys.has(prop as keyof FieldHelp),
          `Entry "${key}" has unexpected property "${prop}"`,
        ).toBe(true);
      }
    }
  });
});
