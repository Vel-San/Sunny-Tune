/**
 * @fileoverview SP Configurator — Feature Registry
 *
 * This is the single place to register new SunnyPilot / Comma AI features.
 *
 * ─── HOW TO ADD A NEW FEATURE ───────────────────────────────────────────────
 *
 * 1. Add an entry to the appropriate section array below.
 * 2. Add the field to `SPConfig` in `client/src/types/config.ts`.
 * 3. Add the field + its `default` to `createDefaultConfig()` in
 *    `client/src/types/config.ts`.
 * 4. For hand-laid sections, add a `<ParamRow>` to the relevant
 *    `client/src/components/config/sections/XxxSection.tsx`.
 *
 * ─── FIELD REFERENCE ────────────────────────────────────────────────────────
 *
 * id           — key inside the section object in `SPConfig` (must be unique
 *                within the section).
 * section      — which top-level key of `SPConfig` the feature lives under.
 * label        — short display name shown in the UI.
 * description  — longer explanation shown as help text under the control.
 * type         — 'toggle' | 'number' | 'slider' | 'select' | 'text'
 * default      — the value used when a new config is initialised.
 * options      — for `select`: array of { label, value } objects.
 * min/max/step — for `number` and `slider` inputs.
 * unit         — optional unit label appended to the input (e.g. 'mph', '°').
 * experimental — shows an "Experimental" badge next to the label.
 * since        — year / version that introduced this feature (display-only).
 * spKey        — the exact SP / openpilot parameter name (for documentation).
 * deprecated   — marks the feature as deprecated in the UI.
 * source       — REQUIRED. Who provides this param:
 *                  'sunnypilot' → exclusive to the SP fork.
 *                  'openpilot'  → stock Comma AI / upstream openpilot param.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** All sections that exist in SPConfig. */
export type ConfigSection =
  | "metadata"
  | "vehicle"
  | "drivingPersonality"
  | "lateral"
  | "longitudinal"
  | "speedControl"
  | "laneChange"
  | "navigation"
  | "interface"
  | "commaAI"
  | "advanced";

/** Allowed control types for a feature. */
export type FeatureType = "toggle" | "number" | "slider" | "select" | "text";

/** A single configurable SunnyPilot / Comma AI feature entry. */
export interface FeatureDefinition {
  /** Unique key within the parent section in `SPConfig`. */
  id: string;
  /** Which section of `SPConfig` this feature belongs to. */
  section: ConfigSection;
  /** Short display name shown in the form. */
  label: string;
  /** Help text / tooltip description. */
  description: string;
  /** UI control type. */
  type: FeatureType;
  /** Value used when initialising a fresh config. */
  default: unknown;
  /** Options for `select` controls. */
  options?: { label: string; value: string | number | boolean }[];
  /** Minimum value for `number` / `slider`. */
  min?: number;
  /** Maximum value for `number` / `slider`. */
  max?: number;
  /** Step increment for `number` / `slider`. */
  step?: number;
  /** Unit label appended to the control (e.g. 'mph', '°', 's'). */
  unit?: string;
  /** If true, shows an "Experimental" badge in the UI. */
  experimental?: boolean;
  /** Year / version string when this feature was introduced (display-only). */
  since?: string;
  /** The exact SP/openpilot parameter name (documentation reference). */
  spKey?: string;
  /** If true, shows a "Deprecated" badge and greys out the control. */
  deprecated?: boolean;
  /**
   * Who provides this feature. Required — TypeScript enforces it on every entry.
   * - `'sunnypilot'` — exclusive to the SunnyPilot fork.
   * - `'openpilot'`  — stock Comma AI / upstream openpilot parameter.
   */
  source: "sunnypilot" | "openpilot";
}

// ─── Registry: Lateral ───────────────────────────────────────────────────────

/**
 * Lateral control features that map directly to SP/OP parameters.
 * `torqueOverride` sub-fields are hand-laid in LateralControlSection.tsx.
 */
export const LATERAL_FEATURES: FeatureDefinition[] = [
  {
    id: "cameraOffset",
    section: "lateral",
    label: "Camera Offset",
    description:
      "Lateral offset of the camera from the car centre (m). Negative = camera is right of centre. Adjust if the car consistently drifts left or right.",
    type: "slider",
    default: 0,
    min: -0.3,
    max: 0.3,
    step: 0.01,
    unit: "m",
    spKey: "CameraOffset",
    since: "2021",
    source: "openpilot",
  },
  {
    id: "liveTorque",
    section: "lateral",
    label: "Live Torque Parameters",
    description:
      "Continuously update the torque controller friction and latAccelFactor from real drive data. Improves accuracy after a few drives to calibrate.",
    type: "toggle",
    default: true,
    spKey: "LiveTorqueParamsToggle",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "liveTorqueRelaxed",
    section: "lateral",
    label: "Live Torque: Relaxed Mode",
    description:
      "Use a slower, more conservative learning rate for live torque updates. Reduces oscillation on noisy or winding roads.",
    type: "toggle",
    default: true,
    spKey: "LiveTorqueParamsRelaxedToggle",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "torqueControlTune",
    section: "lateral",
    label: "Torque Control Tune",
    description:
      "Select the torque control tuning preset. 0=Comma stock (upstream defaults), 1=SP (recommended for most cars), 2=SP+ (more aggressive).",
    type: "select",
    default: 1,
    options: [
      { label: "0 — Comma stock", value: 0 },
      { label: "1 — SP (recommended)", value: 1 },
      { label: "2 — SP+ aggressive", value: 2 },
    ],
    spKey: "TorqueControlTune",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "lagdEnabled",
    section: "lateral",
    label: "LAGD — Live Actuator Delay",
    description:
      "Live Actuator Group Delay: SP estimates the actual hardware steer delay from drive data for more accurate lateral prediction.",
    type: "toggle",
    default: true,
    spKey: "LagdToggle",
    since: "2024",
    source: "sunnypilot",
  },
  {
    id: "lagdDelay",
    section: "lateral",
    label: "LAGD Delay Offset",
    description:
      "Manual offset added to the estimated actuator delay. Lower values = more responsive steering correction. Only effective when LAGD is enabled.",
    type: "slider",
    default: 0.2,
    min: 0,
    max: 1.0,
    step: 0.05,
    unit: "s",
    spKey: "LagdToggleDelay",
    since: "2024",
    source: "sunnypilot",
  },
  {
    id: "useNNModel",
    section: "lateral",
    label: "Neural Network Lateral Model",
    description:
      "Replace the rule-based torque model with an on-device trained neural network for lateral control. Experimental — requires a well-trained device model.",
    type: "toggle",
    default: false,
    experimental: true,
    spKey: "NeuralNetworkLateralControl",
    since: "2025",
    source: "sunnypilot",
  },
  {
    id: "enforceTorqueControl",
    section: "lateral",
    label: "Enforce Torque Control",
    description:
      "Force the torque-based lateral controller even when the car's native steering system would normally take over. Ensures SP's tuning is always active.",
    type: "toggle",
    default: false,
    spKey: "EnforceTorqueControl",
    since: "2024",
    source: "sunnypilot",
  },
];

// ─── Registry: Longitudinal ───────────────────────────────────────────────────

/**
 * Features belonging to the Longitudinal Control section.
 * Add entries here to expose new longitudinal parameters in the configurator.
 */
export const LONGITUDINAL_FEATURES: FeatureDefinition[] = [
  {
    id: "e2eEnabled",
    section: "longitudinal",
    label: "End-to-End Longitudinal",
    description:
      "Use Comma AI's neural-network end-to-end model for longitudinal control. Overrides manual controllers. Best on well-mapped US highways.",
    type: "toggle",
    default: false,
    experimental: true,
    spKey: "ExperimentalMode",
    since: "2022",
    source: "openpilot",
  },
  {
    id: "dynamicE2E",
    section: "longitudinal",
    label: "Dynamic E2E Switch",
    description:
      "Automatically switch between E2E and manual longitudinal model based on driving conditions (traffic, road type).",
    type: "toggle",
    default: false,
    experimental: true,
    spKey: "DynamicExperimentalControl",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "alphaLongEnabled",
    section: "longitudinal",
    label: "Alpha Longitudinal",
    description:
      "Enable next-generation experimental SP longitudinal improvements. May change behaviour significantly — test in a safe environment first.",
    type: "toggle",
    default: false,
    experimental: true,
    spKey: "AlphaLongitudinalEnabled",
    since: "2025",
    source: "sunnypilot",
  },
  {
    id: "hyundaiLongTune",
    section: "longitudinal",
    label: "Hyundai Longitudinal Tuning",
    description:
      "Longitudinal tuning preset for Hyundai/Kia/Genesis vehicles. 0=Off (default tuning with standard acceleration and braking), 1=Dynamic (more responsive acceleration and braking for a sportier feel), 2=Predictive (smoother, anticipatory speed changes that prioritize comfort).",
    type: "select",
    default: 0,
    options: [
      { label: "0 — Off (Default)", value: 0 },
      { label: "1 — Dynamic", value: 1 },
      { label: "2 — Predictive", value: 2 },
    ],
    spKey: "HyundaiLongitudinalTuning",
    since: "2025",
    source: "sunnypilot",
  },
  {
    id: "planplusEnabled",
    section: "longitudinal",
    label: "Planplus Longitudinal",
    description:
      "Enable the Planplus planner — an SP-developed longitudinal planner that aims for smoother, more predictive acceleration and braking.",
    type: "toggle",
    default: false,
    experimental: true,
    spKey: "PlanplusControl",
    since: "2025",
    source: "sunnypilot",
  },
  {
    id: "customAccEnabled",
    section: "longitudinal",
    label: "Custom ACC Increments",
    description:
      "Replace the stock cruise-speed increment steps with custom short-press and long-press values.",
    type: "toggle",
    default: false,
    spKey: "CustomAccIncrementsEnabled",
    since: "2024",
    source: "sunnypilot",
  },
  {
    id: "customAccShort",
    section: "longitudinal",
    label: "ACC Short-Press Increment",
    description:
      "Speed change applied for a brief tap of the cruise +/− button.",
    type: "number",
    default: 1,
    min: 1,
    max: 10,
    step: 1,
    unit: "km/h",
    spKey: "CustomAccShortPressIncrement",
    since: "2024",
    source: "sunnypilot",
  },
  {
    id: "customAccLong",
    section: "longitudinal",
    label: "ACC Long-Press Increment",
    description:
      "Speed change applied when the cruise +/− button is held down.",
    type: "number",
    default: 5,
    min: 1,
    max: 20,
    step: 1,
    unit: "km/h",
    spKey: "CustomAccLongPressIncrement",
    since: "2024",
    source: "sunnypilot",
  },
];

// ─── Registry: Lane Change ────────────────────────────────────────────────────

/**
 * Features for the Lane Change section.
 * Add new lane-change-related SP parameters here.
 */
export const LANE_CHANGE_FEATURES: FeatureDefinition[] = [
  {
    id: "enabled",
    section: "laneChange",
    label: "Lane Change Assist",
    description:
      "Enable openpilot-assisted lane changes. Activates when you hold the turn signal for the configured timer duration.",
    type: "toggle",
    default: true,
    spKey: "AutoLaneChangeEnabled",
    since: "2021",
    source: "openpilot",
  },
  {
    id: "autoTimer",
    section: "laneChange",
    label: "Auto Lane Change Timer",
    description:
      "Duration turn signal must be held before the lane change begins (seconds). 0 = manual nudge always required.",
    type: "select",
    default: 1,
    options: [
      { label: "Manual nudge required", value: 0 },
      { label: "0.5 s", value: 0.5 },
      { label: "1 s (default)", value: 1 },
      { label: "1.5 s", value: 1.5 },
      { label: "2 s", value: 2 },
      { label: "2.5 s", value: 2.5 },
      { label: "3 s", value: 3 },
    ],
    spKey: "AutoLaneChangeTimer",
    since: "2022",
    source: "sunnypilot",
  },
  {
    id: "minimumSpeed",
    section: "laneChange",
    label: "Minimum Speed",
    description:
      "Minimum speed (kph) required before an assisted lane change is allowed.",
    type: "number",
    default: 20,
    min: 0,
    max: 120,
    step: 5,
    unit: "kph",
    spKey: "BlinkerMinLateralControlSpeed",
    since: "2022",
    source: "sunnypilot",
  },
  {
    id: "bsmMonitoring",
    section: "laneChange",
    label: "BSM — Blind Spot Monitoring",
    description:
      "Integrate the car's built-in blind spot monitoring system. Blocks the lane change if a vehicle is detected in the blind spot.",
    type: "toggle",
    default: false,
    spKey: "BlindSpot",
    since: "2022",
    source: "sunnypilot",
  },
  {
    id: "blinkerPauseLateral",
    section: "laneChange",
    label: "Pause Lateral on Blinker",
    description:
      "Temporarily suspend lateral (steering) control while the turn signal is active. Gives full manual steering during signalling.",
    type: "toggle",
    default: false,
    spKey: "BlinkerPauseLateralControl",
    since: "2024",
    source: "sunnypilot",
  },
  {
    id: "blinkerReengageDelay",
    section: "laneChange",
    label: "Lateral Re-engage Delay",
    description:
      "Seconds to wait after the blinker turns off before lateral control re-engages. Prevents sudden steering corrections immediately after signalling.",
    type: "slider",
    default: 0,
    min: 0,
    max: 3,
    step: 0.1,
    unit: "s",
    spKey: "BlinkerLateralReengageDelay",
    since: "2024",
    source: "sunnypilot",
  },
];

// ─── Registry: Comma AI ──────────────────────────────────────────────────────

/**
 * Features for the Comma AI core section.
 * Covers SunnyLink, recording, safety behaviour, and MADS.
 */
export const COMMA_AI_FEATURES: FeatureDefinition[] = [
  {
    id: "recordDrives",
    section: "commaAI",
    label: "Record Drives",
    description: "Save dashcam-style video of every drive to onboard storage.",
    type: "toggle",
    default: true,
    spKey: "RecordFront",
    since: "2021",
    source: "openpilot",
  },
  {
    id: "uploadOnlyOnWifi",
    section: "commaAI",
    label: "Upload Only on Wi-Fi",
    description:
      "Restrict data uploads to Wi-Fi connections only. Prevents unexpected cellular data usage.",
    type: "toggle",
    default: true,
    spKey: "GsmMetered",
    since: "2021",
    source: "openpilot",
  },
  {
    id: "disengageOnAccelerator",
    section: "commaAI",
    label: "Disengage on Accelerator",
    description:
      "Disable openpilot longitudinal control when the gas pedal is pressed. Useful where the accelerator override feels abrupt.",
    type: "toggle",
    default: false,
    spKey: "DisengageOnAccelerator",
    since: "2021",
    source: "openpilot",
  },
  {
    id: "ldwEnabled",
    section: "commaAI",
    label: "Lane Departure Warning",
    description:
      "Audible chime when openpilot detects the vehicle crossing a lane line without a turn signal.",
    type: "toggle",
    default: true,
    spKey: "IsLdwEnabled",
    since: "2021",
    source: "openpilot",
  },
  {
    id: "connectEnabled",
    section: "commaAI",
    label: "SunnyLink Connect",
    description:
      "Enable SunnyLink cloud connection for remote config import/export and drive data sync.",
    type: "toggle",
    default: true,
    spKey: "SunnylinkEnabled",
    since: "2024",
    source: "sunnypilot",
  },
  {
    id: "mads",
    section: "commaAI",
    label: "MADS — Modified Assistive Driving",
    description:
      "Enable MADS, which allows the lateral (steering) assist to operate independently of the ACC cruise system — steering-only without speed control.",
    type: "toggle",
    default: false,
    spKey: "Mads",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "madsMainCruise",
    section: "commaAI",
    label: "MADS: Main Cruise Toggle",
    description:
      "Allow the main cruise control button to engage/disengage MADS lateral control when ACC is off.",
    type: "toggle",
    default: false,
    spKey: "MadsMainCruiseAllowed",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "madsSteeringMode",
    section: "commaAI",
    label: "MADS Steering Mode",
    description:
      "0=Blended (steering blends with ACC), 1=No blending (steering only), 2=Always active (even without ACC).",
    type: "select",
    default: 0,
    options: [
      { label: "0 — Blended", value: 0 },
      { label: "1 — No blending", value: 1 },
      { label: "2 — Always active", value: 2 },
    ],
    spKey: "MadsSteeringMode",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "madsUnifiedEngagement",
    section: "commaAI",
    label: "MADS Unified Engagement",
    description:
      "Engage both MADS lateral and ACC longitudinal together with a single button press.",
    type: "toggle",
    default: false,
    spKey: "MadsUnifiedEngagementMode",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "recordAudioFeedback",
    section: "commaAI",
    label: "Record Audio Feedback",
    description: "Record cabin audio alongside onroad drive footage.",
    type: "toggle",
    default: false,
    spKey: "RecordAudioFeedback",
    since: "2023",
    source: "sunnypilot",
  },
];

// ─── Registry: Advanced ───────────────────────────────────────────────────────

/**
 * Features for the Advanced section.
 */
export const ADVANCED_FEATURES: FeatureDefinition[] = [
  {
    id: "quickBoot",
    section: "advanced",
    label: "Quick Boot",
    description:
      "Skip the boot animation and speed up the startup sequence. Useful when you need the device ready fast.",
    type: "toggle",
    default: false,
    spKey: "QuickBootToggle",
    since: "2025",
    source: "sunnypilot",
  },
];

// ─── Registry: Interface ──────────────────────────────────────────────────────

/**
 * Interface / HUD features.
 */
export const INTERFACE_FEATURES: FeatureDefinition[] = [
  {
    id: "devUI",
    section: "interface",
    label: "Developer UI",
    description:
      "Show extended data overlay on the HUD: speed, acceleration, lead car distance, and lateral/longitudinal error.",
    type: "toggle",
    default: false,
    spKey: "DevUIInfo",
    since: "2022",
    source: "sunnypilot",
  },
  {
    id: "standstillTimer",
    section: "interface",
    label: "Standstill Timer",
    description:
      "Display the duration of the current complete stop on the HUD.",
    type: "toggle",
    default: false,
    spKey: "StandstillTimer",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "greenLightAlert",
    section: "interface",
    label: "Green Light Alert",
    description:
      "Show a HUD notification and play a chime when a traffic light ahead turns green.",
    type: "toggle",
    default: true,
    spKey: "GreenLightAlert",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "leadDepartAlert",
    section: "interface",
    label: "Lead Depart Alert",
    description:
      "Alert when the lead vehicle begins pulling away while you are stationary.",
    type: "toggle",
    default: true,
    spKey: "LeadDepartAlert",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "alwaysOnDM",
    section: "interface",
    label: "Always-On Driver Monitoring",
    description:
      "Keep driver monitoring active even when openpilot longitudinal control is disengaged.",
    type: "toggle",
    default: false,
    spKey: "AlwaysOnDM",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "showTurnSignals",
    section: "interface",
    label: "Show Turn Signal Indicators",
    description: "Display animated turn signal arrows on the onroad HUD.",
    type: "toggle",
    default: false,
    spKey: "ShowTurnSignals",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "roadNameDisplay",
    section: "interface",
    label: "Road Name Display",
    description: "Show the current road name on the HUD using OSM map data.",
    type: "toggle",
    default: false,
    spKey: "RoadNameToggle",
    since: "2023",
    source: "sunnypilot",
  },
  {
    id: "quietMode",
    section: "interface",
    label: "Quiet Mode",
    description:
      "Suppress non-critical audio chimes (engagement sounds, lane-change alerts). Critical safety warnings still play.",
    type: "toggle",
    default: false,
    spKey: "QuietMode",
    since: "2024",
    source: "sunnypilot",
  },
  {
    id: "hideVegoUI",
    section: "interface",
    label: "Hide Speed on HUD",
    description:
      "Remove the vehicle speed (vEgo) readout from the onroad HUD for a cleaner display.",
    type: "toggle",
    default: false,
    spKey: "HideVEgoUI",
    since: "2024",
    source: "sunnypilot",
  },
  {
    id: "torqueBar",
    section: "interface",
    label: "Torque Bar",
    description:
      "Display a visual bar on the HUD showing the current lateral torque output.",
    type: "toggle",
    default: false,
    spKey: "TorqueBar",
    since: "2024",
    source: "sunnypilot",
  },
  {
    id: "disableOnroadUploads",
    section: "interface",
    label: "Disable Onroad Uploads",
    description:
      "Prevent drive footage from uploading while the vehicle is in motion. Uploads resume after parking.",
    type: "toggle",
    default: false,
    spKey: "OnroadUploads",
    since: "2023",
    source: "sunnypilot",
  },
];

// ─── Master registry ──────────────────────────────────────────────────────────

/**
 * The combined flat registry of all features across all sections.
 * Use this when you need to look up a feature by id or iterate all features.
 */
export const ALL_FEATURES: FeatureDefinition[] = [
  ...LATERAL_FEATURES,
  ...LONGITUDINAL_FEATURES,
  ...LANE_CHANGE_FEATURES,
  ...COMMA_AI_FEATURES,
  ...ADVANCED_FEATURES,
  ...INTERFACE_FEATURES,
];

/**
 * Returns all features belonging to a given section, in registry order.
 *
 * @param section - The ConfigSection to filter by.
 * @returns Array of FeatureDefinition entries for that section.
 */
export function getFeaturesForSection(
  section: ConfigSection,
): FeatureDefinition[] {
  return ALL_FEATURES.filter((f) => f.section === section);
}

/**
 * Looks up a single feature by its section + id.
 *
 * @param section - Parent section key.
 * @param id      - Feature id within that section.
 * @returns The FeatureDefinition, or `undefined` if not found.
 */
export function getFeature(
  section: ConfigSection,
  id: string,
): FeatureDefinition | undefined {
  return ALL_FEATURES.find((f) => f.section === section && f.id === id);
}

/**
 * Builds a default-value map for a section from the registry.
 * Useful for initialising new config sections without repeating defaults.
 *
 * @param section - The section to build defaults for.
 * @returns A Record mapping each feature id to its default value.
 */
export function getDefaultsForSection(
  section: ConfigSection,
): Record<string, unknown> {
  return Object.fromEntries(
    getFeaturesForSection(section).map((f) => [f.id, f.default]),
  );
}
