/**
 * Config import/export utilities.
 *
 * Two formats are supported:
 *
 * 1. **SunnyTune** (`exportVersion: 1`) — app-native format produced by
 *    `exportConfigAsJson`. Contains the full `SPConfig` tree.
 *
 * 2. **SunnyLink** (`version: 2`) — the JSON export produced by the
 *    SunnyLink mobile app directly from the device. Contains raw
 *    openpilot / sunnypilot parameter key-value pairs.
 *    `parseSunnyLinkImport` translates this into an `SPConfig`.
 *    `exportAsSunnyLink` translates an `SPConfig` back into the device
 *    parameter format so it can be imported back via the SunnyLink app.
 */

import { z } from "zod";
import type {
  CarMake,
  ConfigRecord,
  LongPersonality,
  SLCOffsetType,
  SPConfig,
} from "../types/config";
import { createDefaultConfig } from "../types/config";

// ─── Export format type ───────────────────────────────────────────────────────

export interface SunnyTuneExport {
  exportVersion: 1;
  exportedAt: string;
  name: string;
  description?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  tags?: string[];
  category?: string;
  config: SPConfig;
}

// ─── Zod validation schema for imports ───────────────────────────────────────

const VALID_CONFIG_SECTIONS = new Set([
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
]);

const importSchema = z.object({
  exportVersion: z.literal(1),
  exportedAt: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  vehicleMake: z.string().max(50).optional(),
  vehicleModel: z.string().max(100).optional(),
  vehicleYear: z.number().int().min(2012).max(2030).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  category: z.string().max(50).optional(),
  config: z
    .record(z.unknown())
    .refine(
      (data) => Object.keys(data).every((k) => VALID_CONFIG_SECTIONS.has(k)),
      { message: "Config contains unrecognised top-level sections" },
    )
    .refine(
      (data) => VALID_CONFIG_SECTIONS.has("metadata") || "metadata" in data,
      { message: "Config is missing the required 'metadata' section" },
    ),
});

// ─── Errors ───────────────────────────────────────────────────────────────────

export class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportValidationError";
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Triggers a browser download of the config as a `.sunnytune.json` file.
 * Works in all modern browsers without any dependencies.
 */
export function exportConfigAsJson(
  config: ConfigRecord,
  filename?: string,
): void {
  const payload: SunnyTuneExport = {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    name: config.name,
    ...(config.description ? { description: config.description } : {}),
    ...(config.vehicleMake ? { vehicleMake: config.vehicleMake } : {}),
    ...(config.vehicleModel ? { vehicleModel: config.vehicleModel } : {}),
    ...(config.vehicleYear ? { vehicleYear: config.vehicleYear } : {}),
    ...(config.tags?.length ? { tags: config.tags } : {}),
    ...(config.category ? { category: config.category } : {}),
    config: config.config,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ?? `${config.name.replace(/[^a-z0-9_-]/gi, "_")}.sunnytune.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Import ───────────────────────────────────────────────────────────────────

/**
 * Reads a File, parses its JSON content, and validates it against the
 * SunnyTuneExport schema.
 *
 * @throws {ImportValidationError} If the file cannot be read, parsed, or validated.
 */
export async function parseImportFile(file: File): Promise<SunnyTuneExport> {
  if (file.size > 512_000) {
    throw new ImportValidationError(
      "File is too large (max 512 KB). Only valid SunnyTune export files are accepted.",
    );
  }

  let raw: string;
  try {
    raw = await file.text();
  } catch {
    throw new ImportValidationError("Could not read the selected file.");
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new ImportValidationError(
      "The file is not valid JSON. Make sure you're importing a .sunnytune.json or .sunnylink.json file.",
    );
  }

  // Auto-detect SunnyLink v2 format ( { version: 2, settings: {...} } )
  if (
    json &&
    typeof json === "object" &&
    (json as Record<string, unknown>)["version"] === 2 &&
    typeof (json as Record<string, unknown>)["settings"] === "object"
  ) {
    return parseSunnyLinkExportObject(json as SunnyLinkExportFile);
  }

  const result = importSchema.safeParse(json);
  if (!result.success) {
    const first = result.error.errors[0];
    const path = first.path.join(".");
    throw new ImportValidationError(
      `Invalid export file: ${path ? `"${path}" — ` : ""}${first.message}`,
    );
  }

  return result.data as unknown as SunnyTuneExport;
}

// ─── SunnyLink import ─────────────────────────────────────────────────────────

/** Raw settings bag from a SunnyLink v2 export. */
type SunnyLinkSettings = Record<string, unknown>;

/** Top-level shape of the SunnyLink v2 JSON format. */
interface SunnyLinkExportFile {
  version: number;
  timestamp: number;
  deviceId?: string;
  settings: SunnyLinkSettings;
}

/**
 * Convert a SunnyLink `True`/`False` string, number 0/1, or real boolean
 * to a JavaScript boolean.
 */
function slBool(val: unknown, fallback = false): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true";
  if (typeof val === "number") return val !== 0;
  return fallback;
}

/** Parse a SunnyLink string or number to a JS number. */
function slNum(val: unknown, fallback: number): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  }
  return fallback;
}

/** Parse a SunnyLink string integer to a JS integer. */
function slInt(val: unknown, fallback: number): number {
  return Math.round(slNum(val, fallback));
}

/** Map a SunnyLink branch / updater target string to our SPBranch type. */
function slBranch(val: unknown): import("../types/config").SPBranch {
  const s = String(val ?? "").toLowerCase();
  if (s.includes("release") || s === "stable-sp") return "stable-sp";
  if (s === "nightly" || s === "master") return "nightly";
  if (s.includes("staging") || s === "staging-sp") return "staging-sp";
  return "dev-sp";
}

/**
 * Translate a SunnyLink `SpeedLimitOffsetType` integer (0=%, 1=fixed) plus
 * the metric flag into our `SLCOffsetType` enum value.
 */
function slOffsetType(offsetType: unknown, useMetric: boolean): SLCOffsetType {
  const t = slInt(offsetType, -1);
  if (t === 0) return "percentage";
  if (t === 1) return useMetric ? "fixed_kph" : "fixed_mph";
  return "none";
}

/**
 * Parse a CarPlatformBundle JSON string from SunnyLink into vehicle fields.
 * Returns partial vehicle overrides, or an empty object on parse failure.
 */
function slVehicle(bundle: unknown): Partial<SPConfig["vehicle"]> {
  try {
    const raw = typeof bundle === "string" ? JSON.parse(bundle) : bundle;
    if (!raw || typeof raw !== "object") return {};
    const r = raw as Record<string, unknown>;
    const make = String(r.brand ?? r.make ?? "").toLowerCase() as CarMake;
    const model = String(r.model ?? r.name ?? "");
    const years: number[] = (Array.isArray(r.year) ? r.year : [r.year])
      .map((y) => parseInt(String(y), 10))
      .filter((y) => !isNaN(y));
    const year = years.length ? Math.min(...years) : 2023;
    return { make, model, year };
  } catch {
    return {};
  }
}

/**
 * Extract the active model display name from a ModelManager_ActiveBundle value.
 *
 * The bundle object contains a `displayName` field that already includes the
 * model name and date, e.g. "WMI V12 (January 13, 2026)". We use that
 * directly, falling back to `internalName` if it is absent.
 * The value may arrive as a pre-parsed object or as a JSON string.
 */
function slActiveModel(raw: unknown): string {
  if (!raw) return "";

  // Unwrap JSON string to object if possible
  let obj: Record<string, unknown> | null = null;
  if (typeof raw === "object") {
    obj = raw as Record<string, unknown>;
  } else if (typeof raw === "string" && raw.trimStart().startsWith("{")) {
    try {
      obj = JSON.parse(raw);
    } catch {
      // Fall through — treat raw string as the model name itself
    }
  }

  if (obj) {
    const display = String(obj.displayName ?? obj.internalName ?? "").trim();
    return display.slice(0, 120);
  }

  return typeof raw === "string" ? raw.slice(0, 120) : "";
}

/**
 * Translate a SunnyLink v2 JSON export into a `SunnyTuneExport`.
 *
 * Unknown parameters are silently ignored. Settings that have no direct
 * mapping are left at their `createDefaultConfig()` defaults.
 */
export function parseSunnyLinkExportObject(
  data: SunnyLinkExportFile,
): SunnyTuneExport {
  const s = data.settings ?? {};
  const cfg = createDefaultConfig() as SPConfig;

  // ── metadata ────────────────────────────────────────────────────────────
  const version = String(s["Version"] ?? "").replace(
    /^(\d{4})\.(\d{3})\.(\d{3})$/,
    "$1.$2.$3",
  );
  cfg.metadata.sunnypilotVersion = version || cfg.metadata.sunnypilotVersion;
  cfg.metadata.branch = slBranch(s["UpdaterTargetBranch"] ?? s["GitBranch"]);

  // Try to infer hardware from the branch URL — the exact install URL reveals
  // the target platform. C4/C3X share staging/dev URLs so they're ambiguous.
  const rawBranchStr = String(
    s["UpdaterTargetBranch"] ?? s["GitBranch"] ?? "",
  ).toLowerCase();
  if (rawBranchStr.includes("tici")) {
    // install.sunnypilot.ai/staging-tici → Comma 3
    cfg.metadata.hardware = "comma3";
  } else if (
    rawBranchStr.includes("tizi") ||
    rawBranchStr.includes("release.sunnypilot.ai")
  ) {
    // release.sunnypilot.ai / release-tizi → Comma 3X
    cfg.metadata.hardware = "comma3x";
  }
  // staging.sunnypilot.ai / dev.sunnypilot.ai used by both C4 and C3X — leave unset

  // Parse active driving model bundle — ModelManager_ActiveBundle may be a
  // JSON string or a pre-parsed object depending on the SunnyLink version.
  const activeModel = slActiveModel(s["ModelManager_ActiveBundle"]);
  if (activeModel) cfg.metadata.activeModel = activeModel;

  // ── vehicle ─────────────────────────────────────────────────────────────
  Object.assign(cfg.vehicle, slVehicle(s["CarPlatformBundle"]));

  // ── drivingPersonality ───────────────────────────────────────────────────
  const lpMap: Record<string, LongPersonality> = {
    "0": "aggressive",
    "1": "standard",
    "2": "relaxed",
  };
  const lpRaw = String(s["LongitudinalPersonality"] ?? "2");
  cfg.drivingPersonality.longitudinalPersonality = lpMap[lpRaw] ?? "relaxed";

  // ── lateral ─────────────────────────────────────────────────────────────
  cfg.lateral.cameraOffset = slNum(s["CameraOffset"], 0);
  cfg.lateral.liveTorque = slBool(s["LiveTorqueParamsToggle"], true);
  cfg.lateral.liveTorqueRelaxed = slBool(
    s["LiveTorqueParamsRelaxedToggle"],
    true,
  );
  cfg.lateral.torqueControlTune = slInt(s["TorqueControlTune"], 1) as 0 | 1 | 2;
  cfg.lateral.lagdEnabled = slBool(s["LagdToggle"], true);
  cfg.lateral.lagdDelay = slNum(s["LagdToggleDelay"], 0.2);
  cfg.lateral.useNNModel = slBool(s["NeuralNetworkLateralControl"], false);
  cfg.lateral.enforceTorqueControl = slBool(s["EnforceTorqueControl"], false);
  cfg.lateral.torqueOverride.enabled = slBool(
    s["TorqueParamsOverrideEnabled"],
    false,
  );
  cfg.lateral.torqueOverride.friction = slNum(
    s["TorqueParamsOverrideFriction"],
    0.1,
  );
  cfg.lateral.torqueOverride.latAccelFactor = slNum(
    s["TorqueParamsOverrideLatAccelFactor"],
    2.5,
  );

  // ── longitudinal ─────────────────────────────────────────────────────────
  cfg.longitudinal.e2eEnabled = slBool(s["ExperimentalMode"], false);
  cfg.longitudinal.dynamicE2E = slBool(s["DynamicExperimentalControl"], false);
  cfg.longitudinal.alphaLongEnabled = slBool(
    s["AlphaLongitudinalEnabled"],
    false,
  );
  cfg.longitudinal.hyundaiLongTune = Math.max(
    0,
    Math.min(2, slInt(s["HyundaiLongitudinalTuning"], 0)),
  ) as 0 | 1 | 2;
  // PlanplusControl: "1.0" = enabled, "0" or absent = disabled
  const ppRaw = s["PlanplusControl"];
  cfg.longitudinal.planplusEnabled =
    ppRaw != null && String(ppRaw) !== "0" && slNum(ppRaw, 0) !== 0;
  cfg.longitudinal.customAccEnabled = slBool(
    s["CustomAccIncrementsEnabled"],
    false,
  );
  cfg.longitudinal.customAccShort = slInt(s["CustomAccShortPressIncrement"], 1);
  cfg.longitudinal.customAccLong = slInt(s["CustomAccLongPressIncrement"], 5);

  // ── laneChange ───────────────────────────────────────────────────────────
  // AutoLaneChangeTimer is an SP integer enum: -1=Off, 0=Nudge, 1=Nudgeless, 2=0.5s, 3=1s, 4=2s, 5=3s
  const rawTimer = slInt(s["AutoLaneChangeTimer"], 0);
  cfg.laneChange.autoTimer = (
    rawTimer >= -1 && rawTimer <= 5 ? rawTimer : 0
  ) as SPConfig["laneChange"]["autoTimer"];
  cfg.laneChange.bsmMonitoring =
    slBool(s["BlindSpot"], false) || slBool(s["AutoLaneChangeBsmDelay"], false);
  cfg.laneChange.minimumSpeed = slNum(s["BlinkerMinLateralControlSpeed"], 20);
  cfg.laneChange.blinkerPauseLateral = slBool(
    s["BlinkerPauseLateralControl"],
    false,
  );
  cfg.laneChange.blinkerReengageDelay = slNum(
    s["BlinkerLateralReengageDelay"],
    0,
  );

  // ── speedControl ─────────────────────────────────────────────────────────
  const slcMode = slInt(s["SpeedLimitMode"], 0);
  cfg.speedControl.speedLimitControl.enabled = slcMode > 0;
  cfg.speedControl.speedLimitControl.policy = slInt(s["SpeedLimitPolicy"], 0);
  cfg.speedControl.speedLimitControl.offsetType = slOffsetType(
    s["SpeedLimitOffsetType"],
    cfg.interface.useMetric,
  );
  cfg.speedControl.speedLimitControl.offsetValue = slNum(
    s["SpeedLimitValueOffset"],
    0,
  );
  cfg.speedControl.visionEnabled = slBool(s["SmartCruiseControlVision"], false);
  cfg.speedControl.mapEnabled = slBool(s["SmartCruiseControlMap"], false);

  // ── navigation ───────────────────────────────────────────────────────────
  cfg.navigation.osmEnabled = slBool(s["OsmLocal"], false);

  // ── interface ────────────────────────────────────────────────────────────
  cfg.interface.useMetric = slBool(s["IsMetric"], false);
  cfg.interface.standstillTimer = slBool(s["StandstillTimer"], false);
  cfg.interface.screenBrightness = slInt(s["Brightness"], 0);
  cfg.interface.screenOffTimer = slInt(s["OnroadScreenOffTimer"], 15);
  cfg.interface.devUI = slBool(s["DevUIInfo"], false);
  cfg.interface.disableOnroadUploads = !slBool(s["OnroadUploads"], true);
  cfg.interface.greenLightAlert = slBool(s["GreenLightAlert"], true);
  cfg.interface.leadDepartAlert = slBool(s["LeadDepartAlert"], true);
  cfg.interface.alwaysOnDM = slBool(s["AlwaysOnDM"], false);
  cfg.interface.showTurnSignals = slBool(s["ShowTurnSignals"], false);
  cfg.interface.roadNameDisplay = slBool(s["RoadNameToggle"], false);
  cfg.interface.quietMode = slBool(s["QuietMode"], false);
  cfg.interface.hideVegoUI = slBool(s["HideVEgoUI"], false);
  cfg.interface.torqueBar = slBool(s["TorqueBar"], false);

  // ── commaAI ──────────────────────────────────────────────────────────────
  cfg.commaAI.recordDrives = slBool(s["RecordFront"], true);
  cfg.commaAI.ldwEnabled = slBool(s["IsLdwEnabled"], true);
  cfg.commaAI.disengageOnAccelerator = slBool(
    s["DisengageOnAccelerator"],
    false,
  );
  cfg.commaAI.uploadOnlyOnWifi = slBool(s["GsmMetered"], true);
  cfg.commaAI.connectEnabled = slBool(s["SunnylinkEnabled"], true);
  cfg.commaAI.mads = slBool(s["Mads"], false);
  cfg.commaAI.madsMainCruise = slBool(s["MadsMainCruiseAllowed"], false);
  cfg.commaAI.madsSteeringMode = slInt(s["MadsSteeringMode"], 0) as 0 | 1 | 2;
  cfg.commaAI.madsUnifiedEngagement = slBool(
    s["MadsUnifiedEngagementMode"],
    false,
  );
  cfg.commaAI.recordAudioFeedback = slBool(s["RecordAudioFeedback"], false);

  // ── advanced ─────────────────────────────────────────────────────────────
  cfg.advanced.quickBoot = slBool(s["QuickBootToggle"], false);

  // ── name / description ────────────────────────────────────────────────────
  const vehicleName = [cfg.vehicle.make, cfg.vehicle.model, cfg.vehicle.year]
    .filter(Boolean)
    .join(" ");
  const name = vehicleName || "Imported SunnyLink Config";

  return {
    exportVersion: 1,
    exportedAt: data.timestamp
      ? new Date(data.timestamp).toISOString()
      : new Date().toISOString(),
    name,
    vehicleMake: cfg.vehicle.make,
    vehicleModel: cfg.vehicle.model,
    vehicleYear: cfg.vehicle.year,
    config: cfg,
  };
}

/**
 * Reads a SunnyLink v2 JSON File and translates it into a `SunnyTuneExport`.
 *
 * @throws {ImportValidationError} If the file is not a valid SunnyLink v2 export.
 */
export async function parseSunnyLinkFile(file: File): Promise<SunnyTuneExport> {
  if (file.size > 5_000_000) {
    throw new ImportValidationError(
      "File is too large (max 5 MB). SunnyLink exports should be well under this limit.",
    );
  }
  let raw: string;
  try {
    raw = await file.text();
  } catch {
    throw new ImportValidationError("Could not read the selected file.");
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new ImportValidationError("The file is not valid JSON.");
  }
  if (
    !json ||
    typeof json !== "object" ||
    (json as Record<string, unknown>)["version"] !== 2 ||
    typeof (json as Record<string, unknown>)["settings"] !== "object"
  ) {
    throw new ImportValidationError(
      'File does not appear to be a SunnyLink v2 export (expected { "version": 2, "settings": { … } }).',
    );
  }
  return parseSunnyLinkExportObject(json as SunnyLinkExportFile);
}

// ─── SunnyLink export ─────────────────────────────────────────────────────────

/**
 * Export an SPConfig as a SunnyLink-compatible settings object that can be
 * imported back onto the device via the SunnyLink app.
 *
 * Only the settings that have a direct SunnyLink parameter mapping are
 * included. Device-specific values (DongleId, GPS, upload queues, etc.)
 * are omitted.
 */
export function exportAsSunnyLink(config: ConfigRecord): void {
  const c = config.config;
  const lpMap = {
    aggressive: "0",
    standard: "1",
    relaxed: "2",
  } as Record<string, string>;

  const offsetTypeMap: Record<SLCOffsetType, number> = {
    none: -1,
    percentage: 0,
    fixed_mph: 1,
    fixed_kph: 1,
  };

  const settings: SunnyLinkSettings = {
    // metadata
    Version: c.metadata.sunnypilotVersion,

    // lateral
    CameraOffset: c.lateral.cameraOffset,
    LiveTorqueParamsToggle: c.lateral.liveTorque,
    LiveTorqueParamsRelaxedToggle: c.lateral.liveTorqueRelaxed,
    TorqueControlTune: c.lateral.torqueControlTune,
    LagdToggle: c.lateral.lagdEnabled,
    LagdToggleDelay: c.lateral.lagdDelay,
    NeuralNetworkLateralControl: c.lateral.useNNModel,
    EnforceTorqueControl: c.lateral.enforceTorqueControl,
    TorqueParamsOverrideEnabled: c.lateral.torqueOverride.enabled
      ? "True"
      : "False",
    TorqueParamsOverrideFriction: String(c.lateral.torqueOverride.friction),
    TorqueParamsOverrideLatAccelFactor: String(
      c.lateral.torqueOverride.latAccelFactor,
    ),

    // longitudinal
    ExperimentalMode: c.longitudinal.e2eEnabled ? "True" : "False",
    DynamicExperimentalControl: c.longitudinal.dynamicE2E,
    AlphaLongitudinalEnabled: c.longitudinal.alphaLongEnabled,
    HyundaiLongitudinalTuning: c.longitudinal.hyundaiLongTune,
    PlanplusControl: c.longitudinal.planplusEnabled ? "1.0" : "0",
    CustomAccIncrementsEnabled: c.longitudinal.customAccEnabled,
    CustomAccShortPressIncrement: c.longitudinal.customAccShort,
    CustomAccLongPressIncrement: c.longitudinal.customAccLong,

    // driving personality
    LongitudinalPersonality:
      lpMap[c.drivingPersonality.longitudinalPersonality] ?? "2",

    // lane change
    AutoLaneChangeTimer: String(c.laneChange.autoTimer),
    BlindSpot: c.laneChange.bsmMonitoring ? "True" : "False",
    AutoLaneChangeBsmDelay: c.laneChange.bsmMonitoring ? "True" : "False",
    BlinkerMinLateralControlSpeed: String(c.laneChange.minimumSpeed),
    BlinkerPauseLateralControl: c.laneChange.blinkerPauseLateral ? "1" : "0",
    BlinkerLateralReengageDelay: String(c.laneChange.blinkerReengageDelay),

    // speed control
    SpeedLimitMode: c.speedControl.speedLimitControl.enabled ? 1 : 0,
    SpeedLimitPolicy: c.speedControl.speedLimitControl.policy,
    SpeedLimitOffsetType:
      offsetTypeMap[c.speedControl.speedLimitControl.offsetType] ?? -1,
    SpeedLimitValueOffset: c.speedControl.speedLimitControl.offsetValue,
    SmartCruiseControlVision: c.speedControl.visionEnabled,
    SmartCruiseControlMap: c.speedControl.mapEnabled,

    // navigation
    OsmLocal: c.navigation.osmEnabled ? "True" : "False",

    // interface
    IsMetric: c.interface.useMetric ? "True" : "False",
    StandstillTimer: c.interface.standstillTimer ? "True" : "False",
    Brightness: String(c.interface.screenBrightness),
    OnroadScreenOffTimer: String(c.interface.screenOffTimer),
    DevUIInfo: c.interface.devUI ? "1" : "0",
    OnroadUploads: c.interface.disableOnroadUploads ? "False" : "True",
    GreenLightAlert: c.interface.greenLightAlert ? "True" : "False",
    LeadDepartAlert: c.interface.leadDepartAlert ? "True" : "False",
    AlwaysOnDM: c.interface.alwaysOnDM ? "True" : "False",
    ShowTurnSignals: c.interface.showTurnSignals ? "True" : "False",
    RoadNameToggle: c.interface.roadNameDisplay ? "True" : "False",
    QuietMode: c.interface.quietMode ? "True" : "False",
    HideVEgoUI: c.interface.hideVegoUI ? "True" : "False",
    TorqueBar: c.interface.torqueBar ? "True" : "False",

    // commaAI
    RecordFront: c.commaAI.recordDrives ? "True" : "False",
    IsLdwEnabled: c.commaAI.ldwEnabled ? "True" : "False",
    DisengageOnAccelerator: c.commaAI.disengageOnAccelerator ? "True" : "False",
    GsmMetered: c.commaAI.uploadOnlyOnWifi ? "True" : "False",
    SunnylinkEnabled: c.commaAI.connectEnabled ? "True" : "False",
    Mads: c.commaAI.mads,
    MadsMainCruiseAllowed: c.commaAI.madsMainCruise,
    MadsSteeringMode: c.commaAI.madsSteeringMode,
    MadsUnifiedEngagementMode: c.commaAI.madsUnifiedEngagement,
    RecordAudioFeedback: c.commaAI.recordAudioFeedback ? "True" : "False",

    // advanced
    QuickBootToggle: c.advanced.quickBoot ? "True" : "False",
  };

  const payload: SunnyLinkExportFile = {
    version: 2,
    timestamp: Date.now(),
    settings,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${config.name.replace(/[^a-z0-9_-]/gi, "_")}.sunnylink.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
