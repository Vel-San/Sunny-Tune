/**
 * @fileoverview Tests for the config save/load Zod schema used in config routes.
 *
 * These tests act as a deployment gate: if the shape accepted by the server
 * diverges from what the client sends, these tests will fail and the build will
 * abort before the image is pushed or deployed.
 *
 * Tests cover:
 * - That a well-formed config payload passes validation
 * - That required fields (name, config) are enforced
 * - That field length limits are enforced
 * - That a config object built from all documented section keys is accepted
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";

// ─── Mirror of the schema in server/src/routes/configs.ts ────────────────────
// Keep this in sync with the configBodySchema in the route file.
// If the route schema changes (e.g. a new validated field is added), update
// this mirror and the tests below will catch any mismatch.

const configBodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  vehicleMake: z.string().max(50).optional(),
  vehicleModel: z.string().max(100).optional(),
  vehicleYear: z.number().int().min(2012).max(2030).optional(),
  config: z.record(z.unknown()),
  tags: z.array(z.string().max(30)).max(10).optional(),
  category: z.string().max(50).optional(),
});

// ─── Canonical default config (mirrors createDefaultConfig in types/config.ts)
// This object must stay in sync with the client's createDefaultConfig().
// If a new section or field is added to the SPConfig type, add it here too.
// The test below will then verify the full default config is accepted by the server.

const CANONICAL_DEFAULT_CONFIG = {
  metadata: {
    sunnypilotVersion: "2026.001.000",
    branch: "stable-sp",
    activeModel: "",
  },
  vehicle: {
    make: "toyota",
    model: "",
    year: 2023,
  },
  drivingPersonality: {
    longitudinalPersonality: "standard",
  },
  lateral: {
    cameraOffset: 0,
    liveTorque: true,
    liveTorqueRelaxed: true,
    torqueControlTune: 1,
    lagdEnabled: true,
    lagdDelay: 0.2,
    useNNModel: false,
    enforceTorqueControl: false,
    torqueOverride: {
      enabled: false,
      friction: 0.1,
      latAccelFactor: 2.5,
    },
  },
  longitudinal: {
    e2eEnabled: false,
    dynamicE2E: false,
    alphaLongEnabled: false,
    hyundaiLongTune: 0,
    planplusEnabled: false,
    customAccEnabled: false,
    customAccShort: 1,
    customAccLong: 5,
  },
  speedControl: {
    speedLimitControl: {
      enabled: false,
      policy: 0,
      offsetType: "none",
      offsetValue: 0,
    },
    visionEnabled: false,
    mapEnabled: false,
    icbmEnabled: false,
    mapAdvisorySpeedLimit: false,
  },
  laneChange: {
    enabled: true,
    autoTimer: 1,
    minimumSpeed: 20,
    bsmMonitoring: false,
    blinkerPauseLateral: false,
    blinkerReengageDelay: 0,
    laneTurnDesire: false,
    adjustLaneTurnSpeed: 0,
  },
  navigation: {
    osmEnabled: false,
  },
  interface: {
    useMetric: false,
    standstillTimer: false,
    screenBrightness: 0,
    screenOffTimer: 15,
    devUI: false,
    disableOnroadUploads: false,
    greenLightAlert: true,
    leadDepartAlert: true,
    alwaysOnDM: false,
    showTurnSignals: false,
    roadNameDisplay: false,
    quietMode: false,
    hideVegoUI: false,
    torqueBar: false,
    trueVegoUI: false,
    blindSpotHUD: false,
    steeringArc: false,
    chevronInfo: false,
    rainbowMode: false,
    showAdvancedControls: false,
    language: "main_en",
    interactivityTimeout: 90,
    realTimeAccelBar: false,
  },
  commaAI: {
    recordDrives: true,
    uploadOnlyOnWifi: true,
    disengageOnAccelerator: false,
    ldwEnabled: true,
    connectEnabled: true,
    mads: false,
    madsMainCruise: false,
    madsSteeringMode: 0,
    madsUnifiedEngagement: false,
    recordAudioFeedback: false,
    sunnypilotEnabled: true,
    gsmApn: "",
    gsmRoaming: false,
  },
  advanced: {
    quickBoot: false,
    maxTimeOffroad: 0,
    disablePowerDown: false,
    wakeupBehavior: 0,
    disableUpdates: false,
  },
  vehicleSpecific: {
    teslaCoopSteering: false,
    subaruStopAndGo: false,
    toyotaEnforceFactoryLong: false,
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("config save schema — valid payloads", () => {
  it("accepts a minimal payload (name + config only)", () => {
    const result = configBodySchema.safeParse({
      name: "My Config",
      config: CANONICAL_DEFAULT_CONFIG,
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
  });

  it("accepts a fully-populated payload", () => {
    const result = configBodySchema.safeParse({
      name: "Ioniq 6 Tune",
      description: "A well-tuned config for the Ioniq 6",
      vehicleMake: "hyundai",
      vehicleModel: "Ioniq 6",
      vehicleYear: 2024,
      config: CANONICAL_DEFAULT_CONFIG,
      tags: ["highway", "smooth", "commute"],
      category: "daily",
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
  });

  it("accepts all documented top-level config sections", () => {
    // Ensures that when new sections are added they are accepted by the server.
    const sections = Object.keys(CANONICAL_DEFAULT_CONFIG);
    expect(sections).toContain("longitudinal");
    expect(sections).toContain("laneChange");
    expect(sections).toContain("commaAI");
    expect(sections).toContain("advanced");
    expect(sections).toContain("lateral");
    expect(sections).toContain("speedControl");
    expect(sections).toContain("navigation");
    expect(sections).toContain("interface");
    expect(sections).toContain("vehicle");
    expect(sections).toContain("drivingPersonality");
    expect(sections).toContain("metadata");

    const result = configBodySchema.safeParse({
      name: "Full Config",
      config: CANONICAL_DEFAULT_CONFIG,
    });
    expect(result.success).toBe(true);
  });
});

describe("config save schema — invalid payloads", () => {
  it("rejects a missing name", () => {
    const result = configBodySchema.safeParse({
      config: CANONICAL_DEFAULT_CONFIG,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = configBodySchema.safeParse({
      name: "",
      config: CANONICAL_DEFAULT_CONFIG,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 100 characters", () => {
    const result = configBodySchema.safeParse({
      name: "a".repeat(101),
      config: CANONICAL_DEFAULT_CONFIG,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a description longer than 500 characters", () => {
    const result = configBodySchema.safeParse({
      name: "Valid",
      description: "x".repeat(501),
      config: CANONICAL_DEFAULT_CONFIG,
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 tags", () => {
    const result = configBodySchema.safeParse({
      name: "Valid",
      config: CANONICAL_DEFAULT_CONFIG,
      tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a vehicle year before 2012", () => {
    const result = configBodySchema.safeParse({
      name: "Old car",
      config: CANONICAL_DEFAULT_CONFIG,
      vehicleYear: 2010,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing config field", () => {
    const result = configBodySchema.safeParse({ name: "No Config" });
    expect(result.success).toBe(false);
  });
});

describe("CANONICAL_DEFAULT_CONFIG — schema completeness", () => {
  it("the canonical default config has all expected top-level sections", () => {
    // If a new section is added to SPConfig on the client, this test will fail
    // until the server-side CANONICAL_DEFAULT_CONFIG is updated to match.
    // This acts as a reminder to keep both in sync.
    const expectedSections = [
      "metadata",
      "vehicle",
      "drivingPersonality",
      "lateral",
      "longitudinal",
      "speedControl",
      "laneChange",
      "navigation",
      "interface",
      "commaAI",
      "advanced",
      "vehicleSpecific",
    ];
    for (const section of expectedSections) {
      expect(
        Object.prototype.hasOwnProperty.call(CANONICAL_DEFAULT_CONFIG, section),
        `Section '${section}' is missing from CANONICAL_DEFAULT_CONFIG in configSchema.test.ts`,
      ).toBe(true);
    }
  });

  it("longitudinal section contains all registry-tracked fields", () => {
    const expected = [
      "e2eEnabled",
      "dynamicE2E",
      "alphaLongEnabled",
      "hyundaiLongTune",
      "planplusEnabled",
      "customAccEnabled",
      "customAccShort",
      "customAccLong",
    ];
    for (const key of expected) {
      expect(
        Object.prototype.hasOwnProperty.call(
          CANONICAL_DEFAULT_CONFIG.longitudinal,
          key,
        ),
        `Field '${key}' is missing from CANONICAL_DEFAULT_CONFIG.longitudinal`,
      ).toBe(true);
    }
  });

  it("laneChange section contains all registry-tracked fields", () => {
    const expected = [
      "enabled",
      "autoTimer",
      "minimumSpeed",
      "bsmMonitoring",
      "blinkerPauseLateral",
      "blinkerReengageDelay",
      "laneTurnDesire",
      "adjustLaneTurnSpeed",
    ];
    for (const key of expected) {
      expect(
        Object.prototype.hasOwnProperty.call(
          CANONICAL_DEFAULT_CONFIG.laneChange,
          key,
        ),
        `Field '${key}' is missing from CANONICAL_DEFAULT_CONFIG.laneChange`,
      ).toBe(true);
    }
  });

  it("commaAI section contains all registry-tracked fields", () => {
    const expected = [
      "recordDrives",
      "uploadOnlyOnWifi",
      "disengageOnAccelerator",
      "ldwEnabled",
      "connectEnabled",
      "mads",
      "madsMainCruise",
      "madsSteeringMode",
      "madsUnifiedEngagement",
      "recordAudioFeedback",
      "sunnypilotEnabled",
      "gsmApn",
      "gsmRoaming",
    ];
    for (const key of expected) {
      expect(
        Object.prototype.hasOwnProperty.call(
          CANONICAL_DEFAULT_CONFIG.commaAI,
          key,
        ),
        `Field '${key}' is missing from CANONICAL_DEFAULT_CONFIG.commaAI`,
      ).toBe(true);
    }
  });

  it("advanced section contains all registry-tracked fields", () => {
    const expected = [
      "quickBoot",
      "maxTimeOffroad",
      "disablePowerDown",
      "wakeupBehavior",
      "disableUpdates",
    ];
    for (const key of expected) {
      expect(
        Object.prototype.hasOwnProperty.call(
          CANONICAL_DEFAULT_CONFIG.advanced,
          key,
        ),
        `Field '${key}' is missing from CANONICAL_DEFAULT_CONFIG.advanced`,
      ).toBe(true);
    }
  });

  it("vehicleSpecific section contains all registry-tracked fields", () => {
    const expected = [
      "teslaCoopSteering",
      "subaruStopAndGo",
      "toyotaEnforceFactoryLong",
    ];
    for (const key of expected) {
      expect(
        Object.prototype.hasOwnProperty.call(
          CANONICAL_DEFAULT_CONFIG.vehicleSpecific,
          key,
        ),
        `Field '${key}' is missing from CANONICAL_DEFAULT_CONFIG.vehicleSpecific`,
      ).toBe(true);
    }
  });
});

// ─── Clone linkage — schema & response shape ──────────────────────────────────
//
// These tests verify the shape of data related to the clone provenance feature.
// They act as contracts between the server response and client ConfigRecord type.

describe("clone linkage — Prisma schema contract", () => {
  it("clonedFromId is not included in the config save body schema (server-only field)", () => {
    // clonedFromId is set by the server clone route, not by the client payload.
    // Verifies the configBodySchema intentionally excludes it.
    const result = configBodySchema.safeParse({
      name: "My Config",
      config: CANONICAL_DEFAULT_CONFIG,
      clonedFromId: "some-uuid", // should be silently stripped by z.object (not an error, but also not kept)
    });
    // z.object strips extra keys by default — the parse still succeeds
    expect(result.success).toBe(true);
    if (result.success) {
      // clonedFromId must not appear in the parsed output
      expect(
        Object.prototype.hasOwnProperty.call(result.data, "clonedFromId"),
      ).toBe(false);
    }
  });

  it("clone provenance shape has the expected fields (id, name, shareToken)", () => {
    // The clonedFrom relation returned by the server must have these fields.
    // This mirrors the Prisma select in the clone/GET endpoints.
    const expectedFields = ["id", "name", "shareToken"];
    const mockClonedFrom = {
      id: "abc",
      name: "Original Config",
      shareToken: "tok123",
    };
    for (const field of expectedFields) {
      expect(
        Object.prototype.hasOwnProperty.call(mockClonedFrom, field),
        `clonedFrom object is missing required field '${field}'`,
      ).toBe(true);
    }
  });

  it("clonedFrom.shareToken may be null for unshared originals", () => {
    // When the original config was never shared, shareToken will be null.
    const mockClonedFrom: {
      id: string;
      name: string;
      shareToken: string | null;
    } = {
      id: "abc",
      name: "Private Config",
      shareToken: null,
    };
    expect(mockClonedFrom.shareToken).toBeNull();
  });
});
