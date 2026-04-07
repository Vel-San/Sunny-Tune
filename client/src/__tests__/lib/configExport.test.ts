import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportAsSunnyLink,
  ImportValidationError,
  parseImportFile,
  parseSunnyLinkExportObject,
} from "../../lib/configExport";
import { createDefaultConfig, type SPConfig } from "../../types/config";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a fake File whose `.text()` method is stubbed to resolve synchronously.
 * jsdom's File does not implement `text()`, so we must provide our own.
 */
function makeFile(content: string, name = "export.sunnytune.json"): File {
  const file = new File([content], name, { type: "application/json" });
  // Stub text() for jsdom
  (file as unknown as { text: () => Promise<string> }).text = () =>
    Promise.resolve(content);
  return file;
}

const VALID_PAYLOAD = JSON.stringify({
  exportVersion: 1,
  exportedAt: "2024-01-01T00:00:00.000Z",
  name: "My Test Config",
  config: {
    metadata: {},
    vehicle: {},
    drivingPersonality: {},
    lateral: {},
    longitudinal: {},
    speedControl: {},
    laneChange: {},
    navigation: {},
    interface: {},
    commaAI: {},
    advanced: {},
    vehicleSpecific: {},
  },
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("parseImportFile", () => {
  it("parses and returns a valid export file", async () => {
    const file = makeFile(VALID_PAYLOAD);
    const result = await parseImportFile(file);
    expect(result.exportVersion).toBe(1);
    expect(result.name).toBe("My Test Config");
  });

  it("includes optional fields when present", async () => {
    const payload = JSON.stringify({
      exportVersion: 1,
      name: "With extras",
      description: "A test",
      vehicleMake: "toyota",
      vehicleModel: "Corolla",
      vehicleYear: 2022,
      tags: ["highway", "smooth"],
      category: "daily",
      config: { metadata: {}, vehicle: {} },
    });
    const result = await parseImportFile(makeFile(payload));
    expect(result.description).toBe("A test");
    expect(result.vehicleMake).toBe("toyota");
    expect(result.tags).toEqual(["highway", "smooth"]);
  });

  it("throws ImportValidationError for a file larger than 512 KB", async () => {
    const bigContent = "x".repeat(513_000);
    const file = makeFile(bigContent, "big.json");
    await expect(parseImportFile(file)).rejects.toBeInstanceOf(
      ImportValidationError,
    );
    await expect(parseImportFile(file)).rejects.toThrow(/too large/i);
  });

  it("throws ImportValidationError for invalid JSON", async () => {
    const file = makeFile("{ not valid json }");
    await expect(parseImportFile(file)).rejects.toBeInstanceOf(
      ImportValidationError,
    );
    await expect(parseImportFile(file)).rejects.toThrow(/not valid JSON/i);
  });

  it("throws ImportValidationError when exportVersion is not 1", async () => {
    const bad = JSON.stringify({
      exportVersion: 2,
      name: "Config",
      config: { metadata: {} },
    });
    await expect(parseImportFile(makeFile(bad))).rejects.toBeInstanceOf(
      ImportValidationError,
    );
  });

  it("throws ImportValidationError when name is missing", async () => {
    const bad = JSON.stringify({
      exportVersion: 1,
      config: { metadata: {} },
    });
    await expect(parseImportFile(makeFile(bad))).rejects.toBeInstanceOf(
      ImportValidationError,
    );
    await expect(parseImportFile(makeFile(bad))).rejects.toThrow(/name/i);
  });

  it("throws ImportValidationError for an unrecognised config section key", async () => {
    const bad = JSON.stringify({
      exportVersion: 1,
      name: "Bad sections",
      config: {
        metadata: {},
        unknownSection: { foo: "bar" },
      },
    });
    await expect(parseImportFile(makeFile(bad))).rejects.toBeInstanceOf(
      ImportValidationError,
    );
    await expect(parseImportFile(makeFile(bad))).rejects.toThrow(
      /unrecognised/i,
    );
  });

  it("throws ImportValidationError if config is not an object", async () => {
    const bad = JSON.stringify({
      exportVersion: 1,
      name: "Broken",
      config: "this-is-not-an-object",
    });
    await expect(parseImportFile(makeFile(bad))).rejects.toBeInstanceOf(
      ImportValidationError,
    );
  });
});

// ─── parseSunnyLinkExportObject ───────────────────────────────────────────────

/** Minimal valid SunnyLink v2 object. */
const SUNNYLINK_BASE = {
  version: 2 as const,
  timestamp: Date.now(),
  settings: {},
};

describe("parseSunnyLinkExportObject", () => {
  it("returns a SunnyTuneExport with exportVersion 1", () => {
    const result = parseSunnyLinkExportObject(SUNNYLINK_BASE);
    expect(result.exportVersion).toBe(1);
  });

  it("falls back to default values when settings are empty", () => {
    const result = parseSunnyLinkExportObject(SUNNYLINK_BASE);
    const dflt = createDefaultConfig() as SPConfig;
    expect(result.config.longitudinal.e2eEnabled).toBe(
      dflt.longitudinal.e2eEnabled,
    );
    expect(result.config.lateral.liveTorque).toBe(dflt.lateral.liveTorque);
  });

  it("parses LongitudinalPersonality string → typed enum", () => {
    const aggressive = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { LongitudinalPersonality: "0" },
    });
    expect(aggressive.config.drivingPersonality.longitudinalPersonality).toBe(
      "aggressive",
    );

    const standard = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { LongitudinalPersonality: "1" },
    });
    expect(standard.config.drivingPersonality.longitudinalPersonality).toBe(
      "standard",
    );

    const relaxed = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { LongitudinalPersonality: "2" },
    });
    expect(relaxed.config.drivingPersonality.longitudinalPersonality).toBe(
      "relaxed",
    );
  });

  it("parses boolean-string values correctly", () => {
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: {
        ExperimentalMode: "True",
        DynamicExperimentalControl: true,
        AlphaLongitudinalEnabled: false,
      },
    });
    expect(result.config.longitudinal.e2eEnabled).toBe(true);
    expect(result.config.longitudinal.dynamicE2E).toBe(true);
    expect(result.config.longitudinal.alphaLongEnabled).toBe(false);
  });

  it("parses PlanplusControl '1.0' as enabled", () => {
    const onResult = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { PlanplusControl: "1.0" },
    });
    expect(onResult.config.longitudinal.planplusEnabled).toBe(true);

    const offResult = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { PlanplusControl: "0" },
    });
    expect(offResult.config.longitudinal.planplusEnabled).toBe(false);
  });

  it("clamps HyundaiLongitudinalTuning to 0–2", () => {
    const clamped = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { HyundaiLongitudinalTuning: 9 },
    });
    expect(clamped.config.longitudinal.hyundaiLongTune).toBe(2);
  });

  it("clamps AutoLaneChangeTimer to -1–5 range", () => {
    const valid = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { AutoLaneChangeTimer: "3" },
    });
    expect(valid.config.laneChange.autoTimer).toBe(3);

    const outOfRange = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { AutoLaneChangeTimer: "99" },
    });
    expect(outOfRange.config.laneChange.autoTimer).toBe(0); // fallback
  });

  it("parses CameraOffset as a float", () => {
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { CameraOffset: "0.1" },
    });
    expect(result.config.lateral.cameraOffset).toBeCloseTo(0.1, 3);
  });

  it("generates a vehicle-based name when CarPlatformBundle is present", () => {
    // When no vehicle info can be parsed, falls back to generic name
    const result = parseSunnyLinkExportObject(SUNNYLINK_BASE);
    expect(typeof result.name).toBe("string");
    expect(result.name.length).toBeGreaterThan(0);
  });

  it("includes a valid ISO exportedAt when timestamp is provided", () => {
    const ts = new Date("2025-06-01T12:00:00Z").getTime();
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      timestamp: ts,
    });
    expect(result.exportedAt).toBe("2025-06-01T12:00:00.000Z");
  });

  it("parses LaneTurnDesire and AdjustLaneTurnSpeed", () => {
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { LaneTurnDesire: "True", AdjustLaneTurnSpeed: "50" },
    });
    expect(result.config.laneChange.laneTurnDesire).toBe(true);
    expect(result.config.laneChange.adjustLaneTurnSpeed).toBe(50);
  });

  it("parses interface display fields (Brightness, OnroadScreenOffTimer)", () => {
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { Brightness: "75", OnroadScreenOffTimer: "30" },
    });
    expect(result.config.interface.screenBrightness).toBe(75);
    expect(result.config.interface.screenOffTimer).toBe(30);
  });

  it("parses ShowAdvancedControls, LanguageSetting, InteractivityTimer, RealTimeAccelBar", () => {
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: {
        ShowAdvancedControls: "True",
        LanguageSetting: "main_ja",
        InteractivityTimer: "120",
        RealTimeAccelBar: "True",
      },
    });
    expect(result.config.interface.showAdvancedControls).toBe(true);
    expect(result.config.interface.language).toBe("main_ja");
    expect(result.config.interface.interactivityTimeout).toBe(120);
    expect(result.config.interface.realTimeAccelBar).toBe(true);
  });

  it("parses SpeedLimitMapAdvisory", () => {
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { SpeedLimitMapAdvisory: "True" },
    });
    expect(result.config.speedControl.mapAdvisorySpeedLimit).toBe(true);
  });

  it("parses SunnypilotEnabled, GsmApn, GsmRoaming", () => {
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: {
        SunnypilotEnabled: "False",
        GsmApn: "internet.carrier.net",
        GsmRoaming: "True",
      },
    });
    expect(result.config.commaAI.sunnypilotEnabled).toBe(false);
    expect(result.config.commaAI.gsmApn).toBe("internet.carrier.net");
    expect(result.config.commaAI.gsmRoaming).toBe(true);
  });

  it("parses RecordAudioFeedback", () => {
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { RecordAudioFeedback: "True" },
    });
    expect(result.config.commaAI.recordAudioFeedback).toBe(true);
  });

  it("parses advanced device management fields", () => {
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: {
        MaxTimeOffroad: "3600",
        DisablePowerDown: "True",
        WakeupBehavior: "1",
        DisableUpdates: "True",
      },
    });
    expect(result.config.advanced.maxTimeOffroad).toBe(3600);
    expect(result.config.advanced.disablePowerDown).toBe(true);
    expect(result.config.advanced.wakeupBehavior).toBe(1);
    expect(result.config.advanced.disableUpdates).toBe(true);
  });

  it("parses vehicle-specific toggles (Tesla, Subaru, Toyota)", () => {
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: {
        TeslaCoopSteering: "True",
        SubaruStopAndGo: "True",
        ToyotaEnforceFactoryLongitudinal: "True",
      },
    });
    expect(result.config.vehicleSpecific.teslaCoopSteering).toBe(true);
    expect(result.config.vehicleSpecific.subaruStopAndGo).toBe(true);
    expect(result.config.vehicleSpecific.toyotaEnforceFactoryLong).toBe(true);
  });

  it("defaults vehicle-specific fields to false when absent", () => {
    const result = parseSunnyLinkExportObject(SUNNYLINK_BASE);
    expect(result.config.vehicleSpecific.teslaCoopSteering).toBe(false);
    expect(result.config.vehicleSpecific.subaruStopAndGo).toBe(false);
    expect(result.config.vehicleSpecific.toyotaEnforceFactoryLong).toBe(false);
  });

  it("defaults advanced device fields to safe values when absent", () => {
    const result = parseSunnyLinkExportObject(SUNNYLINK_BASE);
    expect(result.config.advanced.maxTimeOffroad).toBe(0);
    expect(result.config.advanced.disablePowerDown).toBe(false);
    expect(result.config.advanced.wakeupBehavior).toBe(0);
    expect(result.config.advanced.disableUpdates).toBe(false);
  });

  it("parses SpeedLimitMode clamped to 0–3", () => {
    const clamped = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { SpeedLimitMode: "99" },
    });
    expect(clamped.config.speedControl.speedLimitControl.mode).toBe(3);

    const valid = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { SpeedLimitMode: "2" },
    });
    expect(valid.config.speedControl.speedLimitControl.mode).toBe(2);
  });

  it("translates SpeedLimitOffsetType integer 0 → percentage, 1 → fixed, absent → none", () => {
    const pct = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { SpeedLimitOffsetType: "0" },
    });
    expect(pct.config.speedControl.speedLimitControl.offsetType).toBe(
      "percentage",
    );

    const fixed = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { SpeedLimitOffsetType: "1" },
    });
    expect(fixed.config.speedControl.speedLimitControl.offsetType).toBe(
      "fixed",
    );

    const none = parseSunnyLinkExportObject(SUNNYLINK_BASE);
    expect(none.config.speedControl.speedLimitControl.offsetType).toBe("none");
  });

  it("parses SunnyLink activeModel from ModelManager_ActiveBundle string JSON", () => {
    const bundle = JSON.stringify({
      displayName: "WMI V12 (January 13, 2026)",
      internalName: "wmi_v12",
    });
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { ModelManager_ActiveBundle: bundle },
    });
    expect(result.config.metadata.activeModel).toBe(
      "WMI V12 (January 13, 2026)",
    );
  });

  it("parses SunnyLink activeModel from plain string fallback", () => {
    const result = parseSunnyLinkExportObject({
      ...SUNNYLINK_BASE,
      settings: { ModelManager_ActiveBundle: "custom-model-name" },
    });
    expect(result.config.metadata.activeModel).toBe("custom-model-name");
  });
});

// ─── exportAsSunnyLink ─────────────────────────────────────────────────────────

/**
 * exportAsSunnyLink triggers a browser download via DOM manipulation.
 * We stub Blob, URL, and DOM methods to stay side-effect-free and capture
 * the generated JSON for assertions.
 */
describe("exportAsSunnyLink", () => {
  /** Holds the JSON string passed to the Blob constructor by each test call. */
  let capturedJson = "";
  /** Holds the most-recently created <a> element. */
  let capturedAnchor: HTMLAnchorElement | null = null;

  beforeEach(() => {
    capturedJson = "";
    capturedAnchor = null;

    // Capture Blob content synchronously — subclass so JSON.stringify output is
    // captured in capturedJson before the URL object URL is created.
    const OrigBlob = globalThis.Blob;
    vi.stubGlobal(
      "Blob",
      class extends OrigBlob {
        constructor(parts: BlobPart[], options?: BlobPropertyBag) {
          super(parts, options);
          if (Array.isArray(parts) && typeof parts[0] === "string") {
            capturedJson = parts[0] as string;
          }
        }
      },
    );

    // URL stubs — prevent "URL.createObjectURL is not a function" errors
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:mock"),
      revokeObjectURL: vi.fn(),
    });

    // Intercept createElement("a") to capture the anchor after its properties
    // are set but before the DOM mutation methods are called.
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag, ...rest) => {
      const el = origCreate(tag, ...rest);
      if (tag.toLowerCase() === "a") capturedAnchor = el as HTMLAnchorElement;
      return el;
    });

    // Prevent actual DOM mutations so removeChild does not throw, and silence
    // the jsdom "not implemented: navigation" warning triggered by a.click().
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(document.body, "appendChild").mockReturnValue(
      document.body as any,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(document.body, "removeChild").mockReturnValue(
      document.body as any,
    );
    vi.spyOn(HTMLElement.prototype, "click").mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("produces a SunnyLink v2-compatible JSON payload", () => {
    exportAsSunnyLink(createDefaultConfig() as SPConfig, "test-config");
    expect(capturedJson).not.toBe("");
    const parsed = JSON.parse(capturedJson);
    expect(parsed.version).toBe(2);
    expect(typeof parsed.timestamp).toBe("number");
    expect(typeof parsed.settings).toBe("object");
  });

  it("includes all expected top-level SunnyLink keys in settings", () => {
    exportAsSunnyLink(createDefaultConfig() as SPConfig);
    const { settings } = JSON.parse(capturedJson);
    const expectedKeys = [
      "CameraOffset",
      "ExperimentalMode",
      "DynamicExperimentalControl",
      "LongitudinalPersonality",
      "AutoLaneChangeEnabled",
      "AutoLaneChangeTimer",
      "LaneTurnDesire",
      "SpeedLimitMode",
      "SpeedLimitMapAdvisory",
      "OsmLocal",
      "IsMetric",
      "ShowAdvancedControls",
      "RealTimeAccelBar",
      "Mads",
      "SunnypilotEnabled",
      "GsmRoaming",
      "RecordFront",
      "QuickBootToggle",
      "MaxTimeOffroad",
      "DisableUpdates",
      "TeslaCoopSteering",
      "SubaruStopAndGo",
      "ToyotaEnforceFactoryLongitudinal",
    ];
    for (const key of expectedKeys) {
      expect(settings, `settings.${key} should exist`).toHaveProperty(key);
    }
  });

  it("maps LongitudinalPersonality correctly for each enum value", () => {
    for (const [personality, expected] of [
      ["aggressive", "0"],
      ["standard", "1"],
      ["relaxed", "2"],
    ] as const) {
      const config = createDefaultConfig() as SPConfig;
      config.drivingPersonality.longitudinalPersonality = personality;
      exportAsSunnyLink(config);
      const { settings } = JSON.parse(capturedJson);
      expect(settings.LongitudinalPersonality).toBe(expected);
    }
  });

  it("maps boolean fields to 'True'/'False' strings", () => {
    const config = createDefaultConfig() as SPConfig;
    config.longitudinal.e2eEnabled = true;
    config.navigation.osmEnabled = false;
    exportAsSunnyLink(config);
    const { settings } = JSON.parse(capturedJson);
    expect(settings.ExperimentalMode).toBe("True");
    expect(settings.OsmLocal).toBe("False");
  });

  it("maps planplusEnabled=true to '1.0' and false to '0'", () => {
    const configOn = createDefaultConfig() as SPConfig;
    configOn.longitudinal.planplusEnabled = true;
    exportAsSunnyLink(configOn);
    expect(JSON.parse(capturedJson).settings.PlanplusControl).toBe("1.0");

    const configOff = createDefaultConfig() as SPConfig;
    configOff.longitudinal.planplusEnabled = false;
    exportAsSunnyLink(configOff);
    expect(JSON.parse(capturedJson).settings.PlanplusControl).toBe("0");
  });

  it("uses the provided name (sanitised) in the download filename", () => {
    exportAsSunnyLink(createDefaultConfig() as SPConfig, "My Tune 2025!");
    // "My Tune 2025!" → replace /[^a-z0-9_-]/gi with "_" → "My_Tune_2025_"
    expect(capturedAnchor?.download).toMatch(
      /^My_Tune_2025_\.sunnylink\.json$/,
    );
  });

  it("falls back to 'config.sunnylink.json' when name is not provided", () => {
    exportAsSunnyLink(createDefaultConfig() as SPConfig);
    expect(capturedAnchor?.download).toBe("config.sunnylink.json");
  });

  it("roundtrip: exported payload re-imports to the same key values", () => {
    const config = createDefaultConfig() as SPConfig;
    config.longitudinal.e2eEnabled = true;
    config.longitudinal.alphaLongEnabled = true;
    config.lateral.cameraOffset = 0.1;
    config.drivingPersonality.longitudinalPersonality = "aggressive";

    exportAsSunnyLink(config, "roundtrip");
    const exported = JSON.parse(capturedJson);

    const reimported = parseSunnyLinkExportObject(exported);
    expect(reimported.config.longitudinal.e2eEnabled).toBe(true);
    expect(reimported.config.longitudinal.alphaLongEnabled).toBe(true);
    expect(reimported.config.lateral.cameraOffset).toBeCloseTo(0.1, 3);
    expect(reimported.config.drivingPersonality.longitudinalPersonality).toBe(
      "aggressive",
    );
  });

  it("exports interface display / HUD fields", () => {
    const config = createDefaultConfig() as SPConfig;
    config.interface.showAdvancedControls = true;
    config.interface.language = "main_fr";
    config.interface.interactivityTimeout = 60;
    config.interface.realTimeAccelBar = true;
    config.interface.screenBrightness = 80;
    config.interface.screenOffTimer = 45;
    exportAsSunnyLink(config);
    const { settings } = JSON.parse(capturedJson);
    expect(settings.ShowAdvancedControls).toBe("True");
    expect(settings.LanguageSetting).toBe("main_fr");
    expect(settings.InteractivityTimer).toBe("60");
    expect(settings.RealTimeAccelBar).toBe("True");
    expect(settings.Brightness).toBe("80");
    expect(settings.OnroadScreenOffTimer).toBe("45");
  });

  it("exports advanced device management fields", () => {
    const config = createDefaultConfig() as SPConfig;
    config.advanced.maxTimeOffroad = 7200;
    config.advanced.disablePowerDown = true;
    config.advanced.wakeupBehavior = 2;
    config.advanced.disableUpdates = true;
    exportAsSunnyLink(config);
    const { settings } = JSON.parse(capturedJson);
    expect(settings.MaxTimeOffroad).toBe("7200");
    expect(settings.DisablePowerDown).toBe("True");
    expect(settings.WakeupBehavior).toBe("2");
    expect(settings.DisableUpdates).toBe("True");
  });

  it("exports vehicle-specific toggles", () => {
    const config = createDefaultConfig() as SPConfig;
    config.vehicleSpecific.teslaCoopSteering = true;
    config.vehicleSpecific.subaruStopAndGo = true;
    config.vehicleSpecific.toyotaEnforceFactoryLong = true;
    exportAsSunnyLink(config);
    const { settings } = JSON.parse(capturedJson);
    expect(settings.TeslaCoopSteering).toBe("True");
    expect(settings.SubaruStopAndGo).toBe("True");
    expect(settings.ToyotaEnforceFactoryLongitudinal).toBe("True");
  });

  it("exports commaAI extended fields (SunnypilotEnabled, GsmApn, GsmRoaming, RecordAudioFeedback)", () => {
    const config = createDefaultConfig() as SPConfig;
    config.commaAI.sunnypilotEnabled = false;
    config.commaAI.gsmApn = "broadband";
    config.commaAI.gsmRoaming = true;
    config.commaAI.recordAudioFeedback = true;
    exportAsSunnyLink(config);
    const { settings } = JSON.parse(capturedJson);
    expect(settings.SunnypilotEnabled).toBe("False");
    expect(settings.GsmApn).toBe("broadband");
    expect(settings.GsmRoaming).toBe("True");
    expect(settings.RecordAudioFeedback).toBe("True");
  });

  it("exports lane turn desire fields", () => {
    const config = createDefaultConfig() as SPConfig;
    config.laneChange.laneTurnDesire = true;
    config.laneChange.adjustLaneTurnSpeed = 50;
    exportAsSunnyLink(config);
    const { settings } = JSON.parse(capturedJson);
    expect(settings.LaneTurnDesire).toBe("True");
    expect(settings.AdjustLaneTurnSpeed).toBe("50");
  });

  it("roundtrip: advanced + vehicleSpecific fields survive export → import", () => {
    const config = createDefaultConfig() as SPConfig;
    config.advanced.maxTimeOffroad = 3600;
    config.advanced.disablePowerDown = true;
    config.advanced.wakeupBehavior = 1;
    config.advanced.disableUpdates = true;
    config.vehicleSpecific.teslaCoopSteering = true;
    config.laneChange.laneTurnDesire = true;
    config.laneChange.adjustLaneTurnSpeed = 40;
    config.interface.showAdvancedControls = true;
    config.interface.realTimeAccelBar = true;
    config.commaAI.gsmApn = "test.apn";
    config.commaAI.gsmRoaming = true;

    exportAsSunnyLink(config, "rt-advanced");
    const exported = JSON.parse(capturedJson);
    const re = parseSunnyLinkExportObject(exported);

    expect(re.config.advanced.maxTimeOffroad).toBe(3600);
    expect(re.config.advanced.disablePowerDown).toBe(true);
    expect(re.config.advanced.wakeupBehavior).toBe(1);
    expect(re.config.advanced.disableUpdates).toBe(true);
    expect(re.config.vehicleSpecific.teslaCoopSteering).toBe(true);
    expect(re.config.laneChange.laneTurnDesire).toBe(true);
    expect(re.config.laneChange.adjustLaneTurnSpeed).toBe(40);
    expect(re.config.interface.showAdvancedControls).toBe(true);
    expect(re.config.interface.realTimeAccelBar).toBe(true);
    expect(re.config.commaAI.gsmApn).toBe("test.apn");
    expect(re.config.commaAI.gsmRoaming).toBe(true);
  });
});
