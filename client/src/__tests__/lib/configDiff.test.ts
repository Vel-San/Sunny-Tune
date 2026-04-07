import { describe, expect, it } from "vitest";
import { computeConfigDiff } from "../../lib/configDiff";
import type { SPConfig } from "../../types/config";

// ─── Minimal SPConfig fixture ─────────────────────────────────────────────────

function makeConfig(overrides: Partial<SPConfig> = {}): SPConfig {
  const base: SPConfig = {
    metadata: {
      sunnypilotVersion: "2026.001.000",
      branch: "stable-sp",
      activeModel: "",
    },
    vehicle: {
      make: "toyota",
      model: "Corolla",
      year: 2022,
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
        mode: 0,
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
      devUI: false,
      standstillTimer: false,
      screenBrightness: 70,
      screenBrightnessDelay: 0,
      screenOffTimer: 0,
      disableOnroadUploads: false,
      useMetric: false,
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
        alphaLongEnabled: true,
      },
    });
    const diff = computeConfigDiff(original, modified);
    expect(diff).toHaveLength(1);
    expect(diff[0].section).toBe("longitudinal");
    expect(diff[0].oldValue).toBe("Off");
    expect(diff[0].newValue).toBe("On");
  });

  it("detects a nested field change inside lateral.torqueOverride", () => {
    const original = makeConfig();
    const modified = makeConfig({
      lateral: {
        ...makeConfig().lateral,
        torqueOverride: {
          ...makeConfig().lateral.torqueOverride,
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
      lateral: { ...makeConfig().lateral, useNNModel: true },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("useNNModel"));
    expect(entry).toBeDefined();
    expect(entry!.oldValue).toBe("Off");
    expect(entry!.newValue).toBe("On");
  });

  it("detects multiple changes across different sections", () => {
    const original = makeConfig();
    const modified = makeConfig({
      metadata: { ...makeConfig().metadata, sunnypilotVersion: "2026.002.000" },
      longitudinal: { ...makeConfig().longitudinal, alphaLongEnabled: true },
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
    expect(diff[0].sectionLabel).toBe("Steering \u2014 Lane Change");
  });

  it("detects nested speedControl change", () => {
    const original = makeConfig();
    const modified = makeConfig({
      speedControl: {
        ...makeConfig().speedControl,
        speedLimitControl: {
          ...makeConfig().speedControl.speedLimitControl,
          mode: 1,
        },
      },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("mode"));
    expect(entry).toBeDefined();
    expect(entry!.newValue).toBeDefined();
  });

  // ── New sections: advanced, vehicleSpecific, interface new fields ──────────

  it("detects a change in advanced.maxTimeOffroad (number)", () => {
    const original = makeConfig();
    const modified = makeConfig({
      advanced: { ...makeConfig().advanced, maxTimeOffroad: 3600 },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("maxTimeOffroad"));
    expect(entry).toBeDefined();
    expect(entry!.oldValue).toBe("0");
    expect(entry!.newValue).toBe("3600");
    expect(entry!.section).toBe("advanced");
  });

  it("detects a change in advanced.disablePowerDown (boolean)", () => {
    const original = makeConfig();
    const modified = makeConfig({
      advanced: { ...makeConfig().advanced, disablePowerDown: true },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("disablePowerDown"));
    expect(entry).toBeDefined();
    expect(entry!.oldValue).toBe("Off");
    expect(entry!.newValue).toBe("On");
  });

  it("detects a change in vehicleSpecific.teslaCoopSteering", () => {
    const original = makeConfig();
    const modified = makeConfig({
      vehicleSpecific: {
        ...makeConfig().vehicleSpecific,
        teslaCoopSteering: true,
      },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("teslaCoopSteering"));
    expect(entry).toBeDefined();
    expect(entry!.oldValue).toBe("Off");
    expect(entry!.newValue).toBe("On");
    expect(entry!.section).toBe("vehicleSpecific");
  });

  it("detects a change in laneChange.laneTurnDesire", () => {
    const original = makeConfig();
    const modified = makeConfig({
      laneChange: { ...makeConfig().laneChange, laneTurnDesire: true },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("laneTurnDesire"));
    expect(entry).toBeDefined();
    expect(entry!.oldValue).toBe("Off");
    expect(entry!.newValue).toBe("On");
  });

  it("detects a change in laneChange.adjustLaneTurnSpeed (number)", () => {
    const original = makeConfig();
    const modified = makeConfig({
      laneChange: { ...makeConfig().laneChange, adjustLaneTurnSpeed: 50 },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("adjustLaneTurnSpeed"));
    expect(entry).toBeDefined();
    expect(entry!.oldValue).toBe("0");
    expect(entry!.newValue).toBe("50");
  });

  it("detects a change in interface.showAdvancedControls", () => {
    const original = makeConfig();
    const modified = makeConfig({
      interface: {
        ...makeConfig().interface,
        showAdvancedControls: true,
      },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("showAdvancedControls"));
    expect(entry).toBeDefined();
    expect(entry!.oldValue).toBe("Off");
    expect(entry!.newValue).toBe("On");
  });

  it("detects a change in interface.realTimeAccelBar", () => {
    const original = makeConfig();
    const modified = makeConfig({
      interface: { ...makeConfig().interface, realTimeAccelBar: true },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("realTimeAccelBar"));
    expect(entry).toBeDefined();
    expect(entry!.newValue).toBe("On");
  });

  it("detects a change in commaAI.sunnypilotEnabled", () => {
    const original = makeConfig();
    const modified = makeConfig({
      commaAI: { ...makeConfig().commaAI, sunnypilotEnabled: false },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("sunnypilotEnabled"));
    expect(entry).toBeDefined();
    expect(entry!.oldValue).toBe("On");
    expect(entry!.newValue).toBe("Off");
  });

  it("detects a change in commaAI.gsmApn (string)", () => {
    const original = makeConfig();
    const modified = makeConfig({
      commaAI: { ...makeConfig().commaAI, gsmApn: "internet" },
    });
    const diff = computeConfigDiff(original, modified);
    const entry = diff.find((d) => d.field.includes("gsmApn"));
    expect(entry).toBeDefined();
    expect(entry!.oldValue).toBe("");
    expect(entry!.newValue).toBe("internet");
  });

  it("treats identical configs with no changes as empty diff (all new fields)", () => {
    // Ensures no false-positive diffs are produced by adding new fields
    const cfg = makeConfig({
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
    });
    expect(computeConfigDiff(cfg, cfg)).toEqual([]);
  });
});
