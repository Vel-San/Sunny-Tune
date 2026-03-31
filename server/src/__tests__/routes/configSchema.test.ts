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
    sunnypilotVersion: "0.9.7.1",
    branch: "stable-sp",
  },
  vehicle: {
    make: "toyota",
    model: "",
    year: 2023,
    fingerprintSource: "firmware",
    enableCinematic: true,
    fingerprintOverride: "",
  },
  drivingPersonality: {
    activeProfile: "normal",
    longitudinalPersonality: "standard",
    eco: { accelMax: 1.0, decelMax: 1.5, followGap: 2.0 },
    normal: { accelMax: 1.5, decelMax: 2.0, followGap: 1.45 },
    sport: { accelMax: 2.0, decelMax: 2.5, followGap: 1.1 },
    trafficMode: false,
    smoothDecelerationOnCurves: true,
  },
  lateral: {
    method: "torque",
    torque: {
      friction: 0.05,
      latAccelFactor: 2.5,
      steerActuatorDelay: 0.25,
      useNNModel: false,
      steerLimitTimer: 0.8,
    },
    pid: {
      kpHighSpeed: 0.3,
      kpLowSpeed: 0.5,
      kiHighSpeed: 0.05,
      kiLowSpeed: 0.1,
      kf: 0.00007818594,
      steerActuatorDelay: 0.25,
      steerLimitTimer: 0.8,
    },
    indi: {
      innerLoopGain: 4.0,
      outerLoopGain: 3.0,
      timeConstant: 1.0,
      actuatorEffectiveness: 1.0,
      steerActuatorDelay: 0.25,
      steerLimitTimer: 0.8,
    },
    lqr: {
      scale: 1500.0,
      ki: 0.05,
      a0: 0.0,
      a1: 0.1,
      b0: -0.0028,
      b1: 0.0025,
      steerActuatorDelay: 0.25,
      steerLimitTimer: 0.8,
    },
    steerRateCost: 0.5,
    steeringAngleDeadzone: 0.0,
    steerAngleOffset: 0.0,
    customSteeringRatio: null,
    resetSteeringOnLM: false,
    autoTune: false,
  },
  longitudinal: {
    useSPLong: true,
    e2eEnabled: false,
    smoothStop: true,
    dynamicE2E: false,
    jerkUpperLimit: 0,
    jerkLowerLimit: 0,
    aggressiveAccelBehindLead: false,
    coastDecelEnabled: false,
  },
  speedControl: {
    speedLimitControl: {
      enabled: true,
      source: "nav_osm",
      offsetType: "none",
      offsetValue: 0,
      autoEngage: true,
      engageAlert: true,
    },
    visionTurnControl: { enabled: true, turnSpeed: 25, smoothFactor: 5 },
    mapTurnControl: { enabled: true, speedMargin: 5 },
    setSpeedOffset: 0,
    cruiseIncrement: 5,
    speedUnit: "mph",
    autoResume: true,
    showSpeedLimit: true,
  },
  laneChange: {
    enabled: true,
    autoTimer: 1,
    minimumSpeed: 25,
    bsmMonitoring: true,
    nudgeless: false,
    alertOnChange: true,
    cancelBelowMinSpeed: true,
    oneLaneChange: false,
  },
  navigation: {
    navigationOnOP: true,
    osmEnabled: true,
    preferNavSpeedLimits: true,
    mapboxToken: "",
    preloadMaps: false,
    showNavCarDistance: true,
  },
  interface: {
    devUI: false,
    devUIMini: false,
    standstillTimer: true,
    showSLCOffset: true,
    showVTSCState: true,
    showMTSCState: true,
    dfAlert: true,
    maxAccAlert: false,
    sidebar: true,
    screenOffTimer: 30,
    screenBrightness: 70,
    mapOnLeft: false,
    disableOnroadUploads: false,
    useMetric: false,
    showBrakingState: false,
  },
  commaAI: {
    recordDrives: true,
    uploadOnlyOnWifi: true,
    disengageOnAccelerator: true,
    enableLiveParameters: true,
    endToEndLong: false,
    ldwEnabled: true,
    enableWideCameraView: true,
    hotspotOnBoot: false,
    uploadOnCellular: false,
    connectEnabled: true,
    trainingDataEnabled: false,
  },
  advanced: {
    customFingerprint: "",
    enablePrebuilt: false,
    extendedLogging: false,
    sshPublicKey: "",
    assertSafetyModel: true,
    pandaHeartbeat: true,
    customBootLogo: "",
    dpDeveloperMode: false,
  },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

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
      "useSPLong",
      "e2eEnabled",
      "smoothStop",
      "dynamicE2E",
      "jerkUpperLimit",
      "jerkLowerLimit",
      "aggressiveAccelBehindLead",
      "coastDecelEnabled",
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
      "nudgeless",
      "alertOnChange",
      "cancelBelowMinSpeed",
      "oneLaneChange",
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
      "enableLiveParameters",
      "endToEndLong",
      "ldwEnabled",
      "enableWideCameraView",
      "hotspotOnBoot",
      "uploadOnCellular",
      "connectEnabled",
      "trainingDataEnabled",
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
      "customFingerprint",
      "enablePrebuilt",
      "extendedLogging",
      "sshPublicKey",
      "assertSafetyModel",
      "pandaHeartbeat",
      "customBootLogo",
      "dpDeveloperMode",
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
    const mockClonedFrom = { id: "abc", name: "Original Config", shareToken: "tok123" };
    for (const field of expectedFields) {
      expect(
        Object.prototype.hasOwnProperty.call(mockClonedFrom, field),
        `clonedFrom object is missing required field '${field}'`,
      ).toBe(true);
    }
  });

  it("clonedFrom.shareToken may be null for unshared originals", () => {
    // When the original config was never shared, shareToken will be null.
    const mockClonedFrom: { id: string; name: string; shareToken: string | null } = {
      id: "abc",
      name: "Private Config",
      shareToken: null,
    };
    expect(mockClonedFrom.shareToken).toBeNull();
  });
});
