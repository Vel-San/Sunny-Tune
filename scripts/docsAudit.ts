#!/usr/bin/env npx tsx
/**
 * scripts/docsAudit.ts — sunnypilot Official Docs Coverage Audit
 *
 * Compares the official sunnypilot user-docs parameter list against our
 * featureRegistry spKeys and fieldHelp entries, then prints a human-readable
 * coverage report.
 *
 * Usage:
 *   npm run docs:audit
 *
 * Source of truth: https://github.com/sunnypilot/user-docs
 * Rendered at:     https://docs.sunnypilot.ai
 *
 * Update OFFICIAL_DOCS below when the user-docs repo adds new parameters.
 * (Last synced from sunnypilot/user-docs — 2026-04-05)
 */

// ─── Plain / CI mode ─────────────────────────────────────────────────────────
// When running in CI (GitHub Actions sets CI=true) or when NO_COLOR / --plain
// are present, suppress ANSI codes so the output is readable in GitHub issues.
const isPlain =
  !!process.env.CI ||
  !!process.env.NO_COLOR ||
  process.argv.includes("--plain");

// ─── Official docs parameter catalogue ───────────────────────────────────────
// Each entry reflects a *configurable* parameter from the official sunnypilot
// user-docs repo (https://github.com/sunnypilot/user-docs).
//
// id       = the spKey used on device / in our featureRegistry.
// label    = display name from official docs.
// section  = docs section (mirrors docs/settings/<section>/).
// docsPath = relative path under https://docs.sunnypilot.ai/
// note     = optional context (vehicle-specific, dev-only, read-only, etc.)

const OFFICIAL_DOCS: ReadonlyArray<{
  id: string;
  label: string;
  section: string;
  docsPath: string;
  note?: string;
}> = [
  // ── Models ────────────────────────────────────────────────────────────
  { id: "AdjustCameraOffset",        label: "Adjust Camera Offset",                  section: "Models",    docsPath: "settings/models/" },
  { id: "AdjustLaneTurnSpeed",       label: "Adjust Lane Turn Speed",                section: "Models",    docsPath: "settings/models/",   note: "requires LaneTurnDesire + ShowAdvancedControls" },
  { id: "ManualSoftwareDelay",       label: "Adjust Software Delay",                 section: "Models",    docsPath: "settings/models/",   note: "requires ShowAdvancedControls; only when LAGD disabled" },
  { id: "DrivingModel",              label: "Driving Model",                          section: "Models",    docsPath: "settings/models/" },
  { id: "LaneTurnDesire",            label: "Use Lane Turn Desires",                  section: "Models",    docsPath: "settings/models/" },
  { id: "LiveLearningSteerDelay",    label: "Live Learning Steer Delay (LAGD)",       section: "Models",    docsPath: "settings/models/" },

  // ── Toggles ───────────────────────────────────────────────────────────
  { id: "EnableSunnypilot",          label: "Enable sunnypilot",                      section: "Toggles",   docsPath: "settings/toggles/" },
  { id: "ExperimentalMode",          label: "Experimental Mode",                      section: "Toggles",   docsPath: "settings/toggles/" },
  { id: "DisengageOnAccelerator",    label: "Disengage on Accelerator Pedal",         section: "Toggles",   docsPath: "settings/toggles/" },
  { id: "DrivingPersonality",        label: "Driving Personality",                    section: "Toggles",   docsPath: "settings/toggles/" },
  { id: "LaneDepartureWarnings",     label: "Enable Lane Departure Warnings",         section: "Toggles",   docsPath: "settings/toggles/" },
  { id: "AlwaysOnDriverMonitor",     label: "Always-On Driver Monitoring",            section: "Toggles",   docsPath: "settings/toggles/" },
  { id: "RecordFrontLock",           label: "Record Driver Camera",                   section: "Toggles",   docsPath: "settings/toggles/" },
  { id: "RecordUploadMicAudio",      label: "Record Mic Audio",                       section: "Toggles",   docsPath: "settings/toggles/" },
  { id: "UseMetricUnits",            label: "Use Metric System",                      section: "Toggles",   docsPath: "settings/toggles/" },

  // ── Steering — main ──────────────────────────────────────────────────
  { id: "MadsEnabled",               label: "MADS Enabled",                           section: "Steering",  docsPath: "settings/steering/" },
  { id: "EnforceTorqueControl",      label: "Enforce Torque Lateral Control",         section: "Steering",  docsPath: "settings/steering/" },
  { id: "NeuralNetworkLateralControl", label: "Neural Network Lateral Control (NNLC)", section: "Steering", docsPath: "settings/steering/",  note: "experimental" },
  { id: "BlinkerPauseLateralControl",  label: "Pause Lateral Control with Blinker",   section: "Steering",  docsPath: "settings/steering/" },
  { id: "BlinkerMinLateralControlSpeed", label: "Minimum Speed to Pause Lateral Control", section: "Steering", docsPath: "settings/steering/", note: "sub-setting of Pause Lateral" },
  { id: "BlinkerLateralReengageDelay",   label: "Post-Blinker Delay",                section: "Steering",  docsPath: "settings/steering/",  note: "0–10 s after blinker off" },

  // ── Steering — MADS ──────────────────────────────────────────────────
  { id: "MadsMainCruiseAllowed",     label: "Toggle MADS with Main Cruise",           section: "Steering — MADS", docsPath: "settings/steering/mads/" },
  { id: "MadsUnifiedEngagementMode", label: "Unified Engagement Mode (UEM)",          section: "Steering — MADS", docsPath: "settings/steering/mads/" },
  { id: "MadsSteeringMode",          label: "Steering Mode on Brake Pedal",           section: "Steering — MADS", docsPath: "settings/steering/mads/",  note: "0=Remain Active, 1=Pause, 2=Disengage" },

  // ── Steering — Lane Change ────────────────────────────────────────────
  { id: "AutoLaneChangeTimer",        label: "Auto Lane Change by Blinker",           section: "Steering — Lane Change", docsPath: "settings/steering/lane-change/",  note: "Off=-1, Nudge=0, Nudgeless=1, 0.5s=2, 1s=3, 2s=4, 3s=5" },
  { id: "AutoLaneChangeBsmDelay",     label: "BSM Delay for Lane Change",             section: "Steering — Lane Change", docsPath: "settings/steering/lane-change/" },

  // ── Steering — Torque ─────────────────────────────────────────────────
  { id: "TorqueControlTuneVersion",  label: "Torque Control Tune Version",            section: "Steering — Torque", docsPath: "settings/steering/torque/" },
  { id: "SelfTune",                  label: "Self-Tune (Live Torque Params)",          section: "Steering — Torque", docsPath: "settings/steering/torque/" },
  { id: "LessRestrictSettingsForSelfTune", label: "Less Restrict Settings for Self-Tune", section: "Steering — Torque", docsPath: "settings/steering/torque/", note: "requires SelfTune" },
  { id: "EnableCustomTorqueTuning",  label: "Enable Custom Torque Tuning",            section: "Steering — Torque", docsPath: "settings/steering/torque/" },
  { id: "ManualTuneFriction",        label: "Manual Tune — Friction",                 section: "Steering — Torque", docsPath: "settings/steering/torque/",  note: "requires EnableCustomTorqueTuning" },
  { id: "TorqueParamsOverrideLatAccelFactor", label: "Manual Tune — Lat Accel Factor", section: "Steering — Torque", docsPath: "settings/steering/torque/", note: "requires EnableCustomTorqueTuning" },

  // ── Cruise ────────────────────────────────────────────────────────────
  { id: "IntelligentCruiseButtonManagement", label: "Intelligent Cruise Button Management (ICBM)", section: "Cruise", docsPath: "settings/cruise/",  note: "Alpha feature" },
  { id: "VisionBasedTurnSpeedControl", label: "Smart Cruise Control — Vision (SCC-V)", section: "Cruise", docsPath: "settings/cruise/" },
  { id: "SmartCruiseControlMap",     label: "Smart Cruise Control — Map (SCC-M)",     section: "Cruise",  docsPath: "settings/cruise/" },
  { id: "CustomAccIncrementsEnabled", label: "Custom ACC Speed Increments",           section: "Cruise",  docsPath: "settings/cruise/" },
  { id: "CustomAccShortPressIncrement", label: "Custom ACC Short Press Increment",    section: "Cruise",  docsPath: "settings/cruise/",   note: "requires CustomAccIncrementsEnabled" },
  { id: "CustomAccLongPressIncrement",  label: "Custom ACC Long Press Increment",     section: "Cruise",  docsPath: "settings/cruise/",   note: "requires CustomAccIncrementsEnabled" },
  { id: "DynamicExperimentalControl",   label: "Enable Dynamic Experimental Control", section: "Cruise",  docsPath: "settings/cruise/" },

  // ── Cruise — Speed Limit ──────────────────────────────────────────────
  { id: "SpeedLimitMode",            label: "Speed Limit Mode",                       section: "Cruise — Speed Limit", docsPath: "settings/cruise/speed-limit/",  note: "Off=0, Info=1, Warning=2, Assist=3" },
  { id: "SpeedLimitSource",          label: "Speed Limit Source",                     section: "Cruise — Speed Limit", docsPath: "settings/cruise/speed-limit/source/",  note: "Car=0, Map=1, CarPriority=2, MapPriority=3, Combined=4" },
  { id: "SpeedLimitOffsetType",      label: "Speed Limit Offset Type",                section: "Cruise — Speed Limit", docsPath: "settings/cruise/speed-limit/",  note: "none / fixed / percentage" },
  { id: "SpeedLimitValueOffset",     label: "Speed Limit Value Offset",               section: "Cruise — Speed Limit", docsPath: "settings/cruise/speed-limit/",  note: "-30 to +30" },

  // ── Visuals ───────────────────────────────────────────────────────────
  { id: "BlindSpotDetection",        label: "Show Blind Spot Warnings",               section: "Visuals",   docsPath: "settings/visuals/" },
  { id: "SteeringArc",               label: "Steering Arc",                           section: "Visuals",   docsPath: "settings/visuals/" },
  { id: "RainbowMode",               label: "Enable Tesla Rainbow Mode",              section: "Visuals",   docsPath: "settings/visuals/",  note: "cosmetic only" },
  { id: "StandstillTimer",           label: "Standstill Timer",                       section: "Visuals",   docsPath: "settings/visuals/" },
  { id: "DisplayRoadName",           label: "Display Road Name",                      section: "Visuals",   docsPath: "settings/visuals/" },
  { id: "GreenLightAlert",           label: "Green Traffic Light Alert (Beta)",       section: "Visuals",   docsPath: "settings/visuals/" },
  { id: "LeadDepartAlert",           label: "Lead Departure Alert (Beta)",            section: "Visuals",   docsPath: "settings/visuals/" },
  { id: "TrueVEgoUI",                label: "Display True Speed",                     section: "Visuals",   docsPath: "settings/visuals/" },
  { id: "HideVEgoUI",                label: "Hide Speed",                             section: "Visuals",   docsPath: "settings/visuals/" },
  { id: "ShowTurnSignals",           label: "Display Turn Signals",                   section: "Visuals",   docsPath: "settings/visuals/" },
  { id: "DisplayRocketFuelBar",      label: "Real-time Acceleration Bar",             section: "Visuals",   docsPath: "settings/visuals/" },
  { id: "ChevronInfo",               label: "Display Metrics Below Chevron",          section: "Visuals",   docsPath: "settings/visuals/" },
  { id: "DeveloperUIInfo",           label: "Developer UI",                           section: "Visuals",   docsPath: "settings/visuals/" },

  // ── Display ───────────────────────────────────────────────────────────
  { id: "OnroadBrightness",          label: "Onroad Brightness",                      section: "Display",   docsPath: "settings/display/" },
  { id: "OnroadBrightnessDelay",     label: "Onroad Brightness Delay",               section: "Display",   docsPath: "settings/display/" },
  { id: "InteractivityTimeout",      label: "Interactivity Timeout",                  section: "Display",   docsPath: "settings/display/" },

  // ── Developer ─────────────────────────────────────────────────────────
  { id: "AlphaLongitudinalEnabled",  label: "Alpha Longitudinal Control",             section: "Developer", docsPath: "features/cruise/alpha-longitudinal/",  note: "disables AEB; mutually exclusive with ICBM" },
  { id: "ShowAdvancedControls",      label: "Show Advanced Controls",                 section: "Developer", docsPath: "settings/developer/" },
  { id: "QuickBoot",                 label: "Quickboot Mode",                         section: "Developer", docsPath: "settings/developer/",   note: "requires DisableUpdates" },

  // ── Network ───────────────────────────────────────────────────────────
  { id: "GsmMetered",                label: "GSM Metered (upload on Wi-Fi only)",     section: "Network",   docsPath: "settings/network/" },
  { id: "GsmApn",                    label: "GSM APN",                                section: "Network",   docsPath: "settings/network/",   note: "carrier-specific" },
  { id: "GsmRoaming",                label: "GSM Roaming",                            section: "Network",   docsPath: "settings/network/" },
  { id: "OnroadUploads",             label: "Onroad Uploads",                         section: "Network",   docsPath: "settings/network/" },

  // ── Device ────────────────────────────────────────────────────────────
  { id: "UseMetricSystem",           label: "Use Metric System",                      section: "Device",    docsPath: "settings/device/" },
  { id: "RecordUploadDriverCamera",  label: "Record & Upload Driver Camera",          section: "Device",    docsPath: "settings/device/" },
  { id: "Language",                  label: "Language",                               section: "Device",    docsPath: "settings/device/" },
  { id: "MaxTimeOffroad",            label: "Max Time Offroad",                       section: "Device",    docsPath: "settings/device/" },
  { id: "QuietMode",                 label: "Quiet Mode",                             section: "Device",    docsPath: "features/quiet-mode/" },
  { id: "DisablePowerDown",          label: "Disable Power Down",                     section: "Device",    docsPath: "settings/device/" },
  { id: "DeviceBootMode",            label: "Wake Up Behavior",                       section: "Device",    docsPath: "settings/device/" },
  { id: "DisableUpdates",            label: "Disable Updates",                        section: "Software",  docsPath: "settings/software/",   note: "locks version, no auto-updates" },

  // ── SunnyLink ─────────────────────────────────────────────────────────
  { id: "SunnylinkEnabled",          label: "SunnyLink Connectivity",                 section: "SunnyLink", docsPath: "settings/sunnylink/" },

  // ── OSM ───────────────────────────────────────────────────────────────
  { id: "OsmLocal",                  label: "OSM Local Maps",                         section: "OSM",       docsPath: "settings/osm/" },
  { id: "MapAdvisorySpeedLimit",     label: "Map Advisory Speed Limit",               section: "OSM",       docsPath: "settings/osm/" },

  // ── Vehicle-specific ──────────────────────────────────────────────────
  { id: "HyundaiLongitudinalTuning", label: "Hyundai Longitudinal Tuning",            section: "Vehicle",   docsPath: "settings/vehicle/",   note: "Hyundai/Kia/Genesis only" },
  { id: "TeslaCoopSteering",         label: "Tesla Coop Steering",                    section: "Vehicle",   docsPath: "settings/vehicle/",   note: "Tesla only" },
  { id: "SubaruStopAndGo",           label: "Subaru: Stop and Go",                    section: "Vehicle",   docsPath: "settings/vehicle/",   note: "Subaru only" },
  { id: "ToyotaEnforceFactoryLongitudinalControl", label: "Toyota: Enforce Factory Longitudinal Control", section: "Vehicle", docsPath: "settings/vehicle/", note: "Toyota only" },

  // ── Other ─────────────────────────────────────────────────────────────
  { id: "PlanPlusControls",          label: "Plan Plus Controls",                     section: "Cruise",    docsPath: "settings/cruise/" },
];

// ─── Our registry — spKeys and fieldHelp coverage ────────────────────────────
// Keep this in sync with client/src/lib/featureRegistry.ts (spKey values)
// and client/src/lib/fieldHelp.ts (FIELD_HELP keys).

/** All spKeys registered in featureRegistry.ts, with section + field name. */
const OUR_SPKEYS: ReadonlyArray<{ spKey: string; section: string; field: string }> = [
  // Lateral
  { spKey: "CameraOffset",                 section: "lateral",          field: "cameraOffset" },
  { spKey: "LiveTorqueParamsToggle",        section: "lateral",          field: "liveTorque" },
  { spKey: "LiveTorqueParamsRelaxedToggle", section: "lateral",          field: "liveTorqueRelaxed" },
  { spKey: "TorqueControlTune",             section: "lateral",          field: "torqueControlTune" },
  { spKey: "LagdToggle",                    section: "lateral",          field: "lagdEnabled" },
  { spKey: "LagdToggleDelay",               section: "lateral",          field: "lagdDelay" },
  { spKey: "NeuralNetworkLateralControl",   section: "lateral",          field: "useNNModel" },
  { spKey: "EnforceTorqueControl",          section: "lateral",          field: "enforceTorqueControl" },
  { spKey: "TorqueParamsOverrideEnabled",   section: "lateral",          field: "torqueOverride.enabled" },
  { spKey: "ManualTuneFriction",            section: "lateral",          field: "torqueOverride.friction" },
  { spKey: "TorqueParamsOverrideLatAccelFactor", section: "lateral",     field: "torqueOverride.latAccelFactor" },
  // Longitudinal
  { spKey: "ExperimentalMode",              section: "longitudinal",     field: "e2eEnabled" },
  { spKey: "DynamicExperimentalControl",    section: "longitudinal",     field: "dynamicE2E" },
  { spKey: "AlphaLongitudinalEnabled",      section: "longitudinal",     field: "alphaLongEnabled" },
  { spKey: "HyundaiLongitudinalTuning",     section: "longitudinal",     field: "hyundaiLongTune" },
  { spKey: "PlanplusControl",               section: "longitudinal",     field: "planplusEnabled" },
  { spKey: "CustomAccIncrementsEnabled",    section: "longitudinal",     field: "customAccEnabled" },
  { spKey: "CustomAccShortPressIncrement",  section: "longitudinal",     field: "customAccShort" },
  { spKey: "CustomAccLongPressIncrement",   section: "longitudinal",     field: "customAccLong" },
  // Speed Control
  { spKey: "SpeedLimitMode",                section: "speedControl",     field: "speedLimitControl.mode" },
  { spKey: "SpeedLimitSource",              section: "speedControl",     field: "speedLimitControl.policy" },
  { spKey: "SpeedLimitOffsetType",          section: "speedControl",     field: "speedLimitControl.offsetType" },
  { spKey: "SpeedLimitValueOffset",         section: "speedControl",     field: "speedLimitControl.offsetValue" },
  { spKey: "SmartCruiseControlVision",      section: "speedControl",     field: "visionEnabled" },
  { spKey: "SmartCruiseControlMap",         section: "speedControl",     field: "mapEnabled" },
  { spKey: "IntelligentCruiseButtonManagement", section: "speedControl", field: "icbmEnabled" },
  // Lane Change
  { spKey: "AutoLaneChangeEnabled",         section: "laneChange",       field: "enabled" },
  { spKey: "AutoLaneChangeTimer",           section: "laneChange",       field: "autoTimer" },
  { spKey: "BlinkerMinLateralControlSpeed", section: "laneChange",       field: "minimumSpeed" },
  { spKey: "BlindSpot",                     section: "laneChange",       field: "bsmMonitoring" },
  { spKey: "BlinkerPauseLateralControl",    section: "laneChange",       field: "blinkerPauseLateral" },
  { spKey: "BlinkerLateralReengageDelay",   section: "laneChange",       field: "blinkerReengageDelay" },
  // Navigation
  { spKey: "OsmLocal",                      section: "navigation",       field: "osmEnabled" },
  // Interface
  { spKey: "IsMetric",                      section: "interface",        field: "useMetric" },
  { spKey: "StandstillTimer",               section: "interface",        field: "standstillTimer" },
  { spKey: "Brightness",                    section: "interface",        field: "screenBrightness" },
  { spKey: "OnroadScreenOffTimer",          section: "interface",        field: "screenOffTimer" },
  { spKey: "DevUIInfo",                     section: "interface",        field: "devUI" },
  { spKey: "OnroadUploads",                 section: "interface",        field: "disableOnroadUploads" },
  { spKey: "GreenLightAlert",               section: "interface",        field: "greenLightAlert" },
  { spKey: "LeadDepartAlert",               section: "interface",        field: "leadDepartAlert" },
  { spKey: "AlwaysOnDM",                    section: "interface",        field: "alwaysOnDM" },
  { spKey: "ShowTurnSignals",               section: "interface",        field: "showTurnSignals" },
  { spKey: "RoadNameToggle",                section: "interface",        field: "roadNameDisplay" },
  { spKey: "QuietMode",                     section: "interface",        field: "quietMode" },
  { spKey: "HideVEgoUI",                    section: "interface",        field: "hideVegoUI" },
  { spKey: "TorqueBar",                     section: "interface",        field: "torqueBar" },
  { spKey: "BlindSpotDetection",            section: "interface",        field: "blindSpotHUD" },
  { spKey: "SteeringArc",                   section: "interface",        field: "steeringArc" },
  { spKey: "TrueVEgoUI",                    section: "interface",        field: "trueVegoUI" },
  { spKey: "ChevronInfo",                   section: "interface",        field: "chevronInfo" },
  { spKey: "RainbowMode",                   section: "interface",        field: "rainbowMode" },
  // Comma AI
  { spKey: "RecordFront",                   section: "commaAI",          field: "recordDrives" },
  { spKey: "GsmMetered",                    section: "commaAI",          field: "uploadOnlyOnWifi" },
  { spKey: "DisengageOnAccelerator",        section: "commaAI",          field: "disengageOnAccelerator" },
  { spKey: "IsLdwEnabled",                  section: "commaAI",          field: "ldwEnabled" },
  { spKey: "SunnylinkEnabled",              section: "commaAI",          field: "connectEnabled" },
  { spKey: "Mads",                          section: "commaAI",          field: "mads" },
  { spKey: "MadsMainCruiseAllowed",         section: "commaAI",          field: "madsMainCruise" },
  { spKey: "MadsSteeringMode",              section: "commaAI",          field: "madsSteeringMode" },
  { spKey: "MadsUnifiedEngagementMode",     section: "commaAI",          field: "madsUnifiedEngagement" },
  { spKey: "RecordAudioFeedback",           section: "commaAI",          field: "recordAudioFeedback" },
  // Driving Personality
  { spKey: "DrivingPersonality",            section: "drivingPersonality", field: "longitudinalPersonality" },
  // Advanced
  { spKey: "QuickBootToggle",               section: "advanced",         field: "quickBoot" },
];

/**
 * spKeys that have a FIELD_HELP entry in fieldHelp.ts with a real docsUrl.
 * (i.e. not just a bare homepage URL with no path)
 */
const SPKEYS_WITH_DOCS_HELP = new Set([
  "CameraOffset", "TorqueControlTune", "LagdToggle", "LagdToggleDelay",
  "NeuralNetworkLateralControl", "EnforceTorqueControl", "TorqueParamsOverrideEnabled",
  "ManualTuneFriction", "ExperimentalMode", "DynamicExperimentalControl",
  "AlphaLongitudinalEnabled", "HyundaiLongitudinalTuning", "PlanplusControl",
  "CustomAccIncrementsEnabled", "CustomAccShortPressIncrement", "CustomAccLongPressIncrement",
  "DrivingPersonality", "AutoLaneChangeTimer", "BlindSpot",
  "BlinkerMinLateralControlSpeed", "BlinkerPauseLateralControl",
  "SmartCruiseControlVision", "SmartCruiseControlMap", "IntelligentCruiseButtonManagement",
  "SpeedLimitMode", "SpeedLimitSource", "SpeedLimitOffsetType", "SpeedLimitValueOffset",
  "StandstillTimer", "GreenLightAlert", "LeadDepartAlert", "AlwaysOnDM",
  "ShowTurnSignals", "HideVEgoUI", "QuietMode", "DevUIInfo", "RoadNameToggle",
  "OnroadUploads", "Mads", "MadsMainCruiseAllowed", "MadsSteeringMode",
  "MadsUnifiedEngagementMode", "IsLdwEnabled", "DisengageOnAccelerator",
  "GsmMetered", "IsMetric", "OsmLocal", "QuickBootToggle",
  "BlindSpotDetection", "SteeringArc", "TrueVEgoUI", "ChevronInfo", "RainbowMode",
  "TorqueBar",
]);

// ─── Known mapping: our spKey → official docs id ─────────────────────────────
// Where the spKey differs from the official docs id, list the docs id here.
const SPKEY_TO_DOCS_ID: Record<string, string> = {
  CameraOffset:              "AdjustCameraOffset",
  TorqueControlTune:         "TorqueControlTuneVersion",
  LagdToggle:                "LiveLearningSteerDelay",
  LagdToggleDelay:           "ManualSoftwareDelay",
  PlanplusControl:           "PlanPlusControls",
  CustomAccIncrementsEnabled:"CustomAccIncrementsEnabled",
  AutoLaneChangeEnabled:     "AutoLaneChangeTimer",    // subsumed in timer (-1=off)
  BlindSpot:                 "AutoLaneChangeBsmDelay",
  SmartCruiseControlVision:  "VisionBasedTurnSpeedControl",
  SpeedLimitMode:            "SpeedLimitMode",
  SpeedLimitSource:          "SpeedLimitSource",
  SpeedLimitValueOffset:     "SpeedLimitValueOffset",
  IsMetric:                  "UseMetricUnits",
  AlwaysOnDM:                "AlwaysOnDriverMonitor",
  RoadNameToggle:            "DisplayRoadName",
  DevUIInfo:                 "DeveloperUIInfo",
  IsLdwEnabled:              "LaneDepartureWarnings",
  Mads:                      "MadsEnabled",
  QuickBootToggle:           "QuickBoot",
};

// ─── Audit logic ──────────────────────────────────────────────────────────────

function resolveDocsId(spKey: string): string {
  return SPKEY_TO_DOCS_ID[spKey] ?? spKey;
}

const docsIds = new Set(OFFICIAL_DOCS.map((p) => p.id));
const ourSpKeys = new Set(OUR_SPKEYS.map((r) => r.spKey));

// 1. Official docs params NOT covered by our app (grouped by section)
const missing = OFFICIAL_DOCS.filter((p) => {
  const covered = OUR_SPKEYS.some(
    (r) => r.spKey === p.id || resolveDocsId(r.spKey) === p.id,
  );
  return !covered;
});

const missingBySection = missing.reduce<Record<string, typeof missing>>(
  (acc, p) => ({ ...acc, [p.section]: [...(acc[p.section] ?? []), p] }),
  {},
);

// 2. Our spKeys with no official docs entry at all
const spKeysNotInDocs = OUR_SPKEYS.filter((r) => {
  const docsId = resolveDocsId(r.spKey);
  return !docsIds.has(docsId);
});

// 3. Our spKeys that have no FIELD_HELP entry
const spKeysMissingHelp = OUR_SPKEYS.filter(
  (r) => !SPKEYS_WITH_DOCS_HELP.has(r.spKey),
);

// ─── Output ───────────────────────────────────────────────────────────────────

const BOLD  = isPlain ? "" : "\x1b[1m";
const RED   = isPlain ? "" : "\x1b[31m";
const YEL   = isPlain ? "" : "\x1b[33m";
const GRN   = isPlain ? "" : "\x1b[32m";
const CYA   = isPlain ? "" : "\x1b[36m";
const DIM   = isPlain ? "" : "\x1b[2m";
const RESET = isPlain ? "" : "\x1b[0m";

console.log(`\n${BOLD}══════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}  sunnypilot Official Docs Coverage Audit${RESET}   ${DIM}(docs snapshot: 2026-04-08)${RESET}`);
console.log(`${BOLD}  Source: github.com/sunnypilot/user-docs → docs.sunnypilot.ai${RESET}`);
console.log(`${BOLD}══════════════════════════════════════════════════════════${RESET}\n`);

// ── Section 1: docs params not in our app ─────────────────────────────────────
const totalMissing = missing.length;
console.log(`${BOLD}${RED}⚠  Official docs parameters NOT in SunnyTune  (${totalMissing} total)${RESET}`);
console.log(`${DIM}   These are configurable settings in the official sunnypilot docs we don't expose in the configurator.${RESET}`);
console.log(`${DIM}   Candidates for future feature additions.\n${RESET}`);

for (const [sec, params] of Object.entries(missingBySection).sort()) {
  console.log(`  ${CYA}${sec}${RESET}`);
  for (const p of params) {
    const note = p.note ? `  ${DIM}(${p.note})${RESET}` : "";
    console.log(`    ${YEL}•${RESET} ${p.label}${note}`);
    console.log(`      ${DIM}docs: https://docs.sunnypilot.ai/${p.docsPath}${RESET}`);
  }
  console.log();
}

// ── Section 2: our spKeys not in official docs at all ─────────────────────────
console.log(`\n${BOLD}${YEL}ℹ  Our spKeys with no official docs page  (${spKeysNotInDocs.length} total)${RESET}`);
console.log(`${DIM}   These may be undocumented or SP-internal params, or have different docs IDs.${RESET}\n`);
for (const r of spKeysNotInDocs) {
  console.log(`  ${YEL}•${RESET} ${r.spKey}  ${DIM}(${r.section}.${r.field})${RESET}`);
}

// ── Section 3: our params missing FIELD_HELP entries ─────────────────────────
console.log(`\n\n${BOLD}${YEL}ℹ  Our spKeys missing fieldHelp.ts entries  (${spKeysMissingHelp.length} total)${RESET}`);
console.log(`${DIM}   Add FIELD_HELP entries for these to show tooltip content in the configurator.${RESET}\n`);
for (const r of spKeysMissingHelp) {
  console.log(`  ${YEL}•${RESET} ${r.spKey}  ${DIM}(${r.section}.${r.field})${RESET}`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
const totalOur = OUR_SPKEYS.length;
const coveredByDocs = totalOur - spKeysNotInDocs.length;
const withHelp      = totalOur - spKeysMissingHelp.length;

console.log(`\n\n${BOLD}── Summary ──────────────────────────────────────────────${RESET}`);
console.log(`  Docs params tracked :  ${OFFICIAL_DOCS.length}`);
console.log(`  Our spKey entries   :  ${totalOur}`);
console.log(`  ${GRN}Covered by docs     :  ${coveredByDocs} / ${totalOur}${RESET}`);
console.log(`  ${GRN}Have tooltip help   :  ${withHelp} / ${totalOur}${RESET}`);
console.log(`  ${RED}Docs params we skip :  ${totalMissing}${RESET}  (see above for candidates)`);
console.log();

// ── Section 4: field placement advisory ───────────────────────────────────────
console.log(`${BOLD}── Section placement differences (our app vs official docs)${RESET}`);
console.log(`${DIM}   These fields are assigned to a different section in the official docs.${RESET}`);
console.log(`${DIM}   Our grouping is intentional but documented here for awareness.\n${RESET}`);

const PLACEMENT_NOTES: ReadonlyArray<{ spKey: string; ourSection: string; docsSection: string; note: string }> = [
  { spKey: "Mads / MadsMainCruiseAllowed / MadsSteeringMode / MadsUnifiedEngagementMode",
    ourSection: "commaAI", docsSection: "Steering — MADS",
    note: "MADS is fundamentally lateral (steering) control. Our grouping keeps all commaAI/safety features together." },
  { spKey: "BlinkerMinLateralControlSpeed / BlinkerPauseLateralControl",
    ourSection: "laneChange", docsSection: "Steering",
    note: "Official docs put blinker-pause under Steering settings, not Lane Change. Functionally they relate to both." },
  { spKey: "DynamicExperimentalControl",
    ourSection: "longitudinal", docsSection: "Cruise",
    note: "Official docs place DEC under Cruise settings. We group it with E2E longitudinal — logical either way." },
  { spKey: "HyundaiLongitudinalTuning",
    ourSection: "longitudinal", docsSection: "Vehicle",
    note: "Official docs group this under vehicle-specific settings. Longitudinal is the correct functional home." },
  { spKey: "AutoLaneChangeTimer / AutoLaneChangeBsmDelay",
    ourSection: "laneChange", docsSection: "Steering — Lane Change",
    note: "Official docs put lane change under Steering. Our dedicated section is cleaner for the configurator UX." },
  { spKey: "PlanplusControl",
    ourSection: "longitudinal", docsSection: "Cruise",
    note: "Longitudinal is the correct home for this planner control." },
  { spKey: "GsmMetered (uploadOnlyOnWifi)",
    ourSection: "commaAI", docsSection: "Network",
    note: "Official docs put this under Network. commaAI is acceptable in our context." },
  { spKey: "AlwaysOnDM / ShowTurnSignals / etc.",
    ourSection: "interface", docsSection: "Visuals",
    note: "Official docs split these between Visuals and Toggles. Our interface section covers both." },
  { spKey: "AlphaLongitudinalEnabled",
    ourSection: "longitudinal", docsSection: "Developer",
    note: "Official docs place Alpha Longitudinal under Developer settings. Worth considering a future Developer section." },
];

for (const n of PLACEMENT_NOTES) {
  console.log(`  ${CYA}${n.spKey}${RESET}`);
  console.log(`    Our section : ${GRN}${n.ourSection}${RESET}    Docs section : ${YEL}${n.docsSection}${RESET}`);
  console.log(`    ${DIM}${n.note}${RESET}`);
  console.log();
}

console.log(`${BOLD}══════════════════════════════════════════════════════════${RESET}\n`);
