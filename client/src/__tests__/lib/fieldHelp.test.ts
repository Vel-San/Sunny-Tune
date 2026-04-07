/**
 * @fileoverview Unit tests for fieldHelp.ts
 *
 * Tests cover:
 * - FIELD_HELP is a non-empty record
 * - All entries have at least one populated field (summary, tips, or tradeoffs)
 * - Known critical SP keys are present (the ones shown in the configurator)
 * - FieldHelp entries with docsUrl use valid https URLs
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
        help.docsUrl;
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

// ─── Docs URLs ────────────────────────────────────────────────────────────────

describe("FIELD_HELP — docsUrl values", () => {
  it("all docsUrl values start with https://", () => {
    for (const [key, help] of Object.entries(FIELD_HELP)) {
      if (help.docsUrl) {
        expect(
          help.docsUrl.startsWith("https://"),
          `Entry "${key}".docsUrl does not start with https://`,
        ).toBe(true);
      }
    }
  });

  it("docsUrl values do not contain whitespace", () => {
    for (const [key, help] of Object.entries(FIELD_HELP)) {
      if (help.docsUrl) {
        expect(
          /\s/.test(help.docsUrl),
          `Entry "${key}".docsUrl contains whitespace`,
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
    "LiveTorqueParamsRelaxedToggle",
    "NeuralNetworkLateralControl",
    "EnforceTorqueControl",
    "LagdToggle",
    "LagdToggleDelay",
    "TorqueControlTune",
    "TorqueParamsOverrideEnabled",
    "TorqueParamsOverrideLatAccelFactor",
    // Longitudinal
    "ExperimentalMode",
    "DynamicExperimentalControl",
    "AlphaLongitudinalEnabled",
    "HyundaiLongitudinalTuning",
    "PlanplusControl",
    "CustomAccIncrementsEnabled",
    "CustomAccShortPressIncrement",
    "CustomAccLongPressIncrement",
    // Driving personality
    "DrivingPersonality",
    // Lane change
    "AutoLaneChangeEnabled",
    "AutoLaneChangeTimer",
    "BlindSpot",
    "BlinkerMinLateralControlSpeed",
    "BlinkerPauseLateralControl",
    "BlinkerLateralReengageDelay",
    "LaneTurnDesire",
    "AdjustLaneTurnSpeed",
    // Speed control
    "SpeedLimitMode",
    "SpeedLimitPolicy",
    "SpeedLimitOffsetType",
    "SpeedLimitValueOffset",
    "SpeedLimitMapAdvisory",
    "SmartCruiseControlVision",
    "SmartCruiseControlMap",
    "IntelligentCruiseButtonManagement",
    // Navigation
    "OsmLocal",
    // Interface / Display
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
    "BlindSpotDetection",
    "SteeringArc",
    "TrueVEgoUI",
    "ChevronInfo",
    "RainbowMode",
    "ShowAdvancedControls",
    "LanguageSetting",
    "InteractivityTimer",
    "RealTimeAccelBar",
    "Brightness",
    "OnroadBrightnessDelay",
    "OnroadScreenOffTimer",
    // Comma AI / MADS
    "RecordFront",
    "RecordAudioFeedback",
    "GsmMetered",
    "GsmApn",
    "GsmRoaming",
    "DisengageOnAccelerator",
    "IsLdwEnabled",
    "SunnylinkEnabled",
    "SunnypilotEnabled",
    "Mads",
    "MadsMainCruiseAllowed",
    "MadsSteeringMode",
    "MadsUnifiedEngagementMode",
    // Advanced / Device
    "QuickBootToggle",
    "MaxTimeOffroad",
    "DisablePowerDown",
    "WakeupBehavior",
    "DisableUpdates",
    // Vehicle-specific
    "TeslaCoopSteering",
    "SubaruStopAndGo",
    "ToyotaEnforceFactoryLong",
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
      "docsUrl",
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
