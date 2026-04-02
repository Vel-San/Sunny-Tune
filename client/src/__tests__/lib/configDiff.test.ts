import { describe, expect, it } from "vitest";
import { computeConfigDiff } from "../../lib/configDiff";
import type { SPConfig } from "../../types/config";

// ─── Minimal SPConfig fixture ─────────────────────────────────────────────────

function makeConfig(overrides: Partial<SPConfig> = {}): SPConfig {
  const base: SPConfig = {
    metadata: {
      sunnypilotVersion: "0.9.7",
      branch: "stable-sp",
    },
    vehicle: {
      make: "toyota",
      model: "Corolla",
      year: 2022,
      fingerprintSource: "firmware",
      enableCinematic: false,
      fingerprintOverride: "",
    },
    drivingPersonality: {
      activeProfile: "normal",
      longitudinalPersonality: "standard",
      trafficMode: false,
      smoothDecelerationOnCurves: false,
      eco: { accelMax: 1.0, decelMax: 1.5, followGap: 2.0 },
      normal: { accelMax: 1.5, decelMax: 2.0, followGap: 1.45 },
      sport: { accelMax: 2.0, decelMax: 2.5, followGap: 1.1 },
    },
    lateral: {
      method: "torque",
      torque: {
        friction: 0.1,
        latAccelFactor: 2.0,
        steerActuatorDelay: 0.15,
        useNNModel: false,
        steerLimitTimer: 1.0,
      },
      pid: {
        kpHighSpeed: 0.3,
        kiHighSpeed: 0.05,
        kpLowSpeed: 0.4,
        kiLowSpeed: 0.08,
        kf: 0.00005,
        steerActuatorDelay: 0.15,
        steerLimitTimer: 1.0,
      },
      indi: {
        innerLoopGain: 3.5,
        outerLoopGain: 2.0,
        timeConstant: 1.4,
        actuatorEffectiveness: 1.8,
        steerActuatorDelay: 0.15,
        steerLimitTimer: 1.0,
      },
      lqr: {
        scale: 1500,
        ki: 0.05,
        a0: 0.0,
        a1: 0.0,
        b0: 0.0,
        b1: 0.0,
        steerActuatorDelay: 0.15,
        steerLimitTimer: 1.0,
      },
      steerRateCost: 0.45,
      steeringAngleDeadzone: 0,
      steerAngleOffset: 0,
      customSteeringRatio: null,
      resetSteeringOnLM: false,
      autoTune: false,
    },
    longitudinal: {
      useSPLong: true,
      e2eEnabled: false,
      smoothStop: false,
      dynamicE2E: false,
      jerkUpperLimit: 0,
      jerkLowerLimit: 0,
      aggressiveAccelBehindLead: false,
      coastDecelEnabled: false,
    },
    speedControl: {
      speedLimitControl: {
        enabled: false,
        source: "none",
        offsetType: "none",
        offsetValue: 0,
        autoEngage: false,
        engageAlert: false,
      },
      visionTurnControl: { enabled: false, turnSpeed: 45, smoothFactor: 5 },
      mapTurnControl: { enabled: false, speedMargin: 5 },
      setSpeedOffset: 0,
      cruiseIncrement: 5,
      speedUnit: "mph",
      autoResume: false,
      showSpeedLimit: true,
    },
    laneChange: {
      enabled: true,
      autoTimer: 1,
      minimumSpeed: 20,
      bsmMonitoring: false,
      nudgeless: false,
      alertOnChange: false,
      cancelBelowMinSpeed: false,
      oneLaneChange: false,
    },
    navigation: {
      navigationOnOP: false,
      osmEnabled: false,
      preferNavSpeedLimits: false,
      mapboxToken: "",
      preloadMaps: false,
      showNavCarDistance: false,
    },
    interface: {
      devUI: false,
      devUIMini: false,
      standstillTimer: false,
      showSLCOffset: false,
      showVTSCState: false,
      showMTSCState: false,
      dfAlert: false,
      maxAccAlert: false,
      sidebar: false,
      screenOffTimer: 0,
      screenBrightness: 70,
      mapOnLeft: false,
      disableOnroadUploads: false,
      useMetric: false,
      showBrakingState: false,
    },
    commaAI: {
      recordDrives: true,
      uploadOnlyOnWifi: true,
      disengageOnAccelerator: false,
      enableLiveParameters: true,
      endToEndLong: false,
      ldwEnabled: true,
      enableWideCameraView: false,
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
  return { ...base, ...overrides };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("computeConfigDiff", () => {
  it("returns an empty array when configs are identical", () => {
    const cfg = makeConfig();
    expect(computeConfigDiff(cfg, cfg)).toEqual([]);
  });

  it("detects a single top-level scalar field change", () => {
    const original = makeConfig();
    const modified = makeConfig({
      longitudinal: {
        ...makeConfig().longitudinal,
        jerkUpperLimit: 2.5,
      },
    });
    const diff = computeConfigDiff(original, modified);
    expect(diff).toHaveLength(1);
    expect(diff[0].section).toBe("longitudinal");
    expect(diff[0].oldValue).toBe("0");
    expect(diff[0].newValue).toBe("2.5");
  });

  it("detects a nested field change inside lateral.torque", () => {
    const original = makeConfig();
    const modified = makeConfig({
      lateral: {
        ...makeConfig().lateral,
        torque: {
          ...makeConfig().lateral.torque,
          friction: 0.25,
        },
      },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("friction"));
    expect(entry).toBeDefined();
    expect(entry!.oldValue).toBe("0.1");
    expect(entry!.newValue).toBe("0.25");
    expect(entry!.section).toBe("lateral");
  });

  it("formats boolean values as On/Off", () => {
    const original = makeConfig();
    const modified = makeConfig({
      vehicle: { ...makeConfig().vehicle, enableCinematic: true },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("enableCinematic"));
    expect(entry).toBeDefined();
    expect(entry!.oldValue).toBe("Off");
    expect(entry!.newValue).toBe("On");
  });

  it("detects multiple changes across different sections", () => {
    const original = makeConfig();
    const modified = makeConfig({
      metadata: { ...makeConfig().metadata, sunnypilotVersion: "0.9.8" },
      longitudinal: { ...makeConfig().longitudinal, smoothStop: true },
    });
    const diff = computeConfigDiff(original, modified);
    expect(diff.length).toBeGreaterThanOrEqual(2);
    const sections = diff.map((d) => d.section);
    expect(sections).toContain("metadata");
    expect(sections).toContain("longitudinal");
  });

  it("groups entries by sectionLabel matching SECTION_LABELS order", () => {
    const original = makeConfig();
    const modified = makeConfig({
      vehicle: { ...makeConfig().vehicle, year: 2023 },
      metadata: { ...makeConfig().metadata, sunnypilotVersion: "0.9.8" },
    });
    // metadata comes before vehicle in SECTION_LABELS
    const diff = computeConfigDiff(original, modified);
    const metaIdx = diff.findIndex((d) => d.section === "metadata");
    const vehicleIdx = diff.findIndex((d) => d.section === "vehicle");
    expect(metaIdx).toBeGreaterThanOrEqual(0);
    expect(vehicleIdx).toBeGreaterThan(metaIdx);
  });

  it("attaches a sectionLabel to each entry", () => {
    const original = makeConfig();
    const modified = makeConfig({
      laneChange: {
        ...makeConfig().laneChange,
        minimumSpeed: 30,
      },
    });
    const diff = computeConfigDiff(original, modified);
    expect(diff[0].sectionLabel).toBe("Lane Change");
  });

  it("detects nested speedControl change", () => {
    const original = makeConfig();
    const modified = makeConfig({
      speedControl: {
        ...makeConfig().speedControl,
        speedLimitControl: {
          ...makeConfig().speedControl.speedLimitControl,
          enabled: true,
        },
      },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("enabled"));
    expect(entry).toBeDefined();
    expect(entry!.newValue).toBe("On");
  });
});
