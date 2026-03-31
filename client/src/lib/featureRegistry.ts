/**
 * @fileoverview SP Configurator — Feature Registry
 *
 * This is the single place to register new SunnyPilot / Comma AI features.
 *
 * ─── HOW TO ADD A NEW FEATURE ───────────────────────────────────────────────
 *
 * 1. Add an entry to the appropriate section array below.
 * 2. Add the field to `SPConfig` in `client/src/types/config.ts`.
 * 3. Add the field + its `default` to `DEFAULT_CONFIG` in
 *    `client/src/store/configStore.ts`.
 * 4. If the parent section component renders from the registry (uses
 *    `<RegistrySection>`), the UI will appear automatically.
 *    For hand-laid sections, add a `<ParamRow>` to the relevant
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
 * since        — SunnyPilot version that introduced this feature.
 * spKey        — the exact SP / openpilot parameter name (for documentation).
 * deprecated   — marks the feature as deprecated in the UI.
 * source       — REQUIRED. Who provides this param:
 *                  'sunnypilot' → exclusive to the SP fork (typically SP_* prefix).
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
  /** SunnyPilot version that introduced this feature (for display). */
  since?: string;
  /** The exact SP/openpilot parameter name (documentation reference). */
  spKey?: string;
  /** If true, shows a "Deprecated" badge and greys out the control. */
  deprecated?: boolean;
  /**
   * Who provides this feature. Required — TypeScript enforces it on every entry.
   * - `'sunnypilot'` — exclusive to the SunnyPilot fork (look for `SP_*` params).
   * - `'openpilot'`  — stock Comma AI / upstream openpilot parameter.
   */
  source: "sunnypilot" | "openpilot";
}

// ─── Registry: Longitudinal ───────────────────────────────────────────────────

/**
 * Features belonging to the Longitudinal Control section.
 * Add entries here to expose new longitudinal parameters in the configurator.
 */
export const LONGITUDINAL_FEATURES: FeatureDefinition[] = [
  {
    id: "useSPLong",
    section: "longitudinal",
    label: "SunnyPilot Custom Longitudinal",
    description:
      "Use SunnyPilot's enhanced longitudinal controller instead of the stock car controller. Required for SP-specific features like smooth stop and coast decel.",
    type: "toggle",
    default: false,
    spKey: "SP_LONG",
    source: "sunnypilot",
  },
  {
    id: "e2eEnabled",
    section: "longitudinal",
    label: "End-to-End Longitudinal",
    description:
      "Use Comma AI's neural-network end-to-end model for longitudinal control. Overrides manual controllers. Best on well-mapped US highways.",
    type: "toggle",
    default: false,
    experimental: true,
    spKey: "E2E_LONG",
    source: "openpilot",
  },
  {
    id: "smoothStop",
    section: "longitudinal",
    label: "Smooth Stop",
    description:
      "Apply a gentler braking profile at very low speeds to produce more comfortable stops.",
    type: "toggle",
    default: true,
    spKey: "SP_SMOOTH_STOP",
    source: "sunnypilot",
  },
  {
    id: "dynamicE2E",
    section: "longitudinal",
    label: "Dynamic E2E Switch",
    description:
      "Automatically switch between E2E and manual longitudinal model based on driving conditions.",
    type: "toggle",
    default: false,
    experimental: true,
    spKey: "SP_DYNAMIC_E2E",
    source: "sunnypilot",
  },
  {
    id: "jerkUpperLimit",
    section: "longitudinal",
    label: "Jerk Upper Limit",
    description:
      "Override the maximum jerk (rate of acceleration change) limit. 0 = stock. Higher values allow more aggressive acceleration feel.",
    type: "slider",
    default: 0,
    min: 0,
    max: 3,
    step: 0.1,
    unit: "m/s³",
    spKey: "SP_JERK_UPPER",
    source: "sunnypilot",
  },
  {
    id: "jerkLowerLimit",
    section: "longitudinal",
    label: "Jerk Lower Limit",
    description:
      "Override the minimum jerk limit for deceleration smoothing. 0 = stock.",
    type: "slider",
    default: 0,
    min: 0,
    max: 3,
    step: 0.1,
    unit: "m/s³",
    spKey: "SP_JERK_LOWER",
    source: "sunnypilot",
  },
  {
    id: "aggressiveAccelBehindLead",
    section: "longitudinal",
    label: "Aggressive Accel Behind Lead",
    description:
      "Use a more aggressive acceleration profile when catching up to a lead vehicle from a significant distance gap.",
    type: "toggle",
    default: false,
    spKey: "SP_AGGRESSIVE_ACCEL_WITH_LEAD",
    source: "sunnypilot",
  },
  {
    id: "coastDecelEnabled",
    section: "longitudinal",
    label: "Coast Deceleration",
    description:
      "Allow the car to coast (engine braking only, no active braking) when decelerating to a lower cruise speed.",
    type: "toggle",
    default: false,
    spKey: "SP_COAST_DECEL",
    source: "sunnypilot",
  },
  // ── ADD NEW LONGITUDINAL FEATURES BELOW THIS LINE ──────────────────────────
  // Copy the template above, set a unique `id`, fill in the remaining fields,
  // then add the field to SPConfig and DEFAULT_CONFIG.
  // ───────────────────────────────────────────────────────────────────────────
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
    spKey: "LANE_CHANGE_ENABLED",
    source: "openpilot",
  },
  {
    id: "autoTimer",
    section: "laneChange",
    label: "Auto Lane Change Timer",
    description:
      "Duration turn signal must be held before the lane change begins (seconds). 0 = manual nudge required.",
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
    spKey: "AUTO_LANE_CHANGE_TIMER",
    source: "sunnypilot",
  },
  {
    id: "minimumSpeed",
    section: "laneChange",
    label: "Minimum Speed",
    description:
      "Minimum speed required before an assisted lane change is allowed.",
    type: "number",
    default: 25,
    min: 0,
    max: 70,
    step: 5,
    unit: "mph",
    spKey: "LANE_CHANGE_MIN_SPEED",
    source: "openpilot",
  },
  {
    id: "bsmMonitoring",
    section: "laneChange",
    label: "BSM — Blind Spot Monitoring",
    description:
      "Integrate the car's built-in blind spot monitoring system. Blocks the lane change if a vehicle is detected in the blind spot.",
    type: "toggle",
    default: false,
    spKey: "BSM_MONITOR",
    source: "sunnypilot",
  },
  {
    id: "nudgeless",
    section: "laneChange",
    label: "Nudgeless Lane Change",
    description:
      "Allow the lane change to complete without requiring a physical steering nudge. Signal alone is sufficient.",
    type: "toggle",
    default: false,
    experimental: true,
    spKey: "NUDGELESS_LC",
    source: "sunnypilot",
  },
  {
    id: "alertOnChange",
    section: "laneChange",
    label: "Alert on Lane Change",
    description:
      "Play an audible alert at the start of each assisted lane change.",
    type: "toggle",
    default: true,
    spKey: "LC_ALERT",
    source: "sunnypilot",
  },
  {
    id: "cancelBelowMinSpeed",
    section: "laneChange",
    label: "Cancel Below Minimum Speed",
    description:
      "Automatically cancel an ongoing lane change if speed drops below the minimum speed.",
    type: "toggle",
    default: true,
    spKey: "LC_CANCEL_BELOW_MIN",
    source: "sunnypilot",
  },
  {
    id: "oneLaneChange",
    section: "laneChange",
    label: "One Lane Change per Signal",
    description:
      "Limit to exactly one lane change per turn-signal activation, even if the signal is held.",
    type: "toggle",
    default: false,
    spKey: "ONE_LANE_CHANGE",
    source: "sunnypilot",
  },
  // ── ADD NEW LANE CHANGE FEATURES BELOW ──────────────────────────────────────
];

// ─── Registry: Comma AI ──────────────────────────────────────────────────────

/**
 * Features for the Comma AI core section.
 * Covers Comma Connect, recording, data upload, and device behaviour.
 */
export const COMMA_AI_FEATURES: FeatureDefinition[] = [
  {
    id: "recordDrives",
    section: "commaAI",
    label: "Record Drives",
    description: "Save dashcam-style video of every drive to onboard storage.",
    type: "toggle",
    default: true,
    spKey: "RECORD_FRONT",
    source: "openpilot",
  },
  {
    id: "uploadOnlyOnWifi",
    section: "commaAI",
    label: "Upload Only on Wi-Fi",
    description:
      "Restrict data uploads to Wi-Fi connections only. Prevents large cellular data usage.",
    type: "toggle",
    default: true,
    spKey: "UPLOAD_ON_WIFI",
    source: "openpilot",
  },
  {
    id: "disengageOnAccelerator",
    section: "commaAI",
    label: "Disengage on Accelerator",
    description:
      "Disable openpilot longitudinal control when the gas pedal is pressed. Useful for vehicles where the accelerator overrides feel abrupt.",
    type: "toggle",
    default: false,
    spKey: "DISENGAGE_ON_ACCELERATOR",
    source: "openpilot",
  },
  {
    id: "enableLiveParameters",
    section: "commaAI",
    label: "Live Parameters",
    description:
      "Continuously estimate and update vehicle physical parameters (steering ratio, stiffness) from real drive data.",
    type: "toggle",
    default: true,
    spKey: "LIVE_PARAMS",
    source: "openpilot",
  },
  {
    id: "endToEndLong",
    section: "commaAI",
    label: "End-to-End Longitudinal",
    description:
      "Use Comma's neural network E2E model for longitudinal control. Overrides manual longitudinal on supported models.",
    type: "toggle",
    default: false,
    experimental: true,
    spKey: "E2E_LONG",
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
    spKey: "IS_LDW_ENABLED",
    source: "openpilot",
  },
  {
    id: "enableWideCameraView",
    section: "commaAI",
    label: "Wide Camera View",
    description: "Show the wide-angle camera feed on the device display.",
    type: "toggle",
    default: false,
    spKey: "WIDE_CAMERA_VIEW",
    source: "openpilot",
  },
  {
    id: "hotspotOnBoot",
    section: "commaAI",
    label: "Hotspot on Boot",
    description:
      "Automatically enable the device Wi-Fi hotspot when the car starts.",
    type: "toggle",
    default: false,
    spKey: "HOTSPOT_ON_BOOT",
    source: "openpilot",
  },
  {
    id: "uploadOnCellular",
    section: "commaAI",
    label: "Upload on Cellular",
    description:
      "Allow background uploads over cellular data (overrides Wi-Fi-only setting).",
    type: "toggle",
    default: false,
    spKey: "UPLOAD_ON_CELLULAR",
    source: "openpilot",
  },
  {
    id: "connectEnabled",
    section: "commaAI",
    label: "Comma Connect",
    description:
      "Enable connection to comma.ai cloud services (remote access, fleet management).",
    type: "toggle",
    default: true,
    spKey: "CONNECT_ENABLED",
    source: "openpilot",
  },
  {
    id: "trainingDataEnabled",
    section: "commaAI",
    label: "Share Training Data",
    description:
      "Share anonymised driving data with Comma AI to improve the neural network models.",
    type: "toggle",
    default: true,
    spKey: "TRAINING_DATA",
    source: "openpilot",
  },
  // ── ADD NEW COMMA AI FEATURES BELOW ─────────────────────────────────────────
];

// ─── Registry: Advanced ───────────────────────────────────────────────────────

/**
 * Features for the Advanced / Developer section.
 * All entries here should be for power-users only.
 */
export const ADVANCED_FEATURES: FeatureDefinition[] = [
  {
    id: "customFingerprint",
    section: "advanced",
    label: "Custom Fingerprint Override",
    description:
      "Force openpilot to use a specific car fingerprint ID. Only change this if your car is misidentified.",
    type: "text",
    default: "",
    spKey: "FINGERPRINT_OVERRIDE",
    source: "openpilot",
  },
  {
    id: "enablePrebuilt",
    section: "advanced",
    label: "Prebuilt openpilot",
    description:
      "Skip the openpilot build step on boot (uses a pre-compiled binary). Reduces boot time significantly.",
    type: "toggle",
    default: false,
    spKey: "PREBUILT",
    source: "openpilot",
  },
  {
    id: "extendedLogging",
    section: "advanced",
    label: "Extended Logging",
    description:
      "Enable verbose debug logging. Increases storage use. Only enable when diagnosing issues.",
    type: "toggle",
    default: false,
    spKey: "EXTENDED_LOGGING",
    source: "openpilot",
  },
  {
    id: "sshPublicKey",
    section: "advanced",
    label: "SSH Public Key",
    description:
      "SSH public key for remote device access via the Comma SSH interface.",
    type: "text",
    default: "",
    spKey: "SSH_AUTHORIZED_KEYS",
    source: "openpilot",
  },
  {
    id: "assertSafetyModel",
    section: "advanced",
    label: "Assert Safety Model",
    description:
      "Halt openpilot if the loaded safety model does not match the expected model for the car. Prevents using mismatched safety constraints.",
    type: "toggle",
    default: true,
    spKey: "ASSERT_SAFETY_MODEL",
    source: "openpilot",
  },
  {
    id: "pandaHeartbeat",
    section: "advanced",
    label: "Panda Heartbeat Check",
    description:
      "Verify the Panda is alive before engaging. Disabling this skips the check — only for hardware debugging.",
    type: "toggle",
    default: true,
    spKey: "PANDA_HEARTBEAT",
    experimental: true,
    source: "openpilot",
  },
  {
    id: "customBootLogo",
    section: "advanced",
    label: "Custom Boot Logo",
    description: "Path to a custom PNG displayed during device boot.",
    type: "text",
    default: "",
    spKey: "CUSTOM_BOOT_LOGO",
    source: "sunnypilot",
  },
  {
    id: "dpDeveloperMode",
    section: "advanced",
    label: "Developer Mode",
    description:
      "Enable DragonPilot developer mode (exposes additional debug UI and parameters).",
    type: "toggle",
    default: false,
    experimental: true,
    spKey: "DP_DEV",
    source: "sunnypilot",
  },
  // ── ADD NEW ADVANCED FEATURES BELOW ─────────────────────────────────────────
];

// ─── Master registry ──────────────────────────────────────────────────────────

/**
 * The combined flat registry of all features across all sections.
 * Use this when you need to look up a feature by id or iterate all features.
 */
export const ALL_FEATURES: FeatureDefinition[] = [
  ...LONGITUDINAL_FEATURES,
  ...LANE_CHANGE_FEATURES,
  ...COMMA_AI_FEATURES,
  ...ADVANCED_FEATURES,
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
