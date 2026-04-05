/**
 * Validation rules applied before a SunnyLink JSON export is downloaded.
 *
 * Extracted from SunnyLinkExportModal so the rules can be tested independently
 * without mounting a React component.
 */

import type { SPConfig } from "../types/config";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: ValidationSeverity;
  field: string;
  message: string;
  wikiUrl?: string;
}

/**
 * Validate an SPConfig against known SunnyLink configuration pitfalls.
 *
 * Returns an array of issues sorted by severity (errors first, then warnings,
 * then info). An empty array means the config looks clean.
 */
export function validateForSunnyLinkExport(c: SPConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Dynamic E2E requires Experimental Mode
  if (c.longitudinal.dynamicE2E && !c.longitudinal.e2eEnabled) {
    issues.push({
      severity: "warning",
      field: "DynamicExperimentalControl",
      message:
        "Dynamic E2E Switch is ON but Experimental Mode (E2E) is OFF — Dynamic E2E has no effect without it.",
      wikiUrl: "https://sunnylink.wiki/#DynamicExperimentalControl",
    });
  }

  // Alpha Longitudinal disables AEB
  if (c.longitudinal.alphaLongEnabled) {
    issues.push({
      severity: "warning",
      field: "AlphaLongitudinalEnabled",
      message:
        "⚠️ Alpha Longitudinal is ON — this disables AEB (Automatic Emergency Braking). Confirm your vehicle supports this safely.",
      wikiUrl: "https://sunnylink.wiki/#AlphaLongitudinal",
    });
  }

  // NNModel experimental warning
  if (c.lateral.useNNModel) {
    issues.push({
      severity: "info",
      field: "NeuralNetworkLateralControl",
      message:
        "Neural Network Lateral is experimental and generally not recommended for modern sunnypilot models. Test carefully.",
      wikiUrl: "https://sunnylink.wiki/#NeuralNetworkLateralControl",
    });
  }

  // Torque override active
  if (c.lateral.torqueOverride.enabled) {
    issues.push({
      severity: "warning",
      field: "TorqueParamsOverrideEnabled",
      message:
        "Custom Torque Override is ON — verify that friction and latAccelFactor values are correct for your vehicle.",
      wikiUrl: "https://sunnylink.wiki/#EnableCustomTorqueTuning",
    });
  }

  // MADS disabled but sub-settings enabled
  const madsSubActive =
    c.commaAI.madsMainCruise ||
    c.commaAI.madsSteeringMode !== 0 ||
    c.commaAI.madsUnifiedEngagement;
  if (!c.commaAI.mads && madsSubActive) {
    issues.push({
      severity: "warning",
      field: "Mads",
      message:
        "MADS is OFF but MADS sub-settings (Main Cruise / Steering Mode / Unified Engagement) are configured — they will have no effect.",
      wikiUrl: "https://sunnylink.wiki/#MadsEnabled",
    });
  }

  // Camera offset near extremes
  if (Math.abs(c.lateral.cameraOffset) >= 0.28) {
    issues.push({
      severity: "warning",
      field: "CameraOffset",
      message: `Camera offset (${c.lateral.cameraOffset} m) is near its maximum — this may cause persistent lane departure warnings.`,
      wikiUrl: "https://sunnylink.wiki/#AdjustCameraOffset",
    });
  }

  // Hyundai tune on non-Hyundai vehicle
  const hyundaiMakes = ["hyundai", "kia", "genesis"];
  if (
    c.longitudinal.hyundaiLongTune !== 0 &&
    c.vehicle.make &&
    !hyundaiMakes.includes(c.vehicle.make.toLowerCase())
  ) {
    issues.push({
      severity: "warning",
      field: "HyundaiLongitudinalTuning",
      message: `Hyundai Longitudinal Tuning is set to ${c.longitudinal.hyundaiLongTune} but vehicle make is "${c.vehicle.make}". This setting only affects Hyundai/Kia/Genesis vehicles.`,
      wikiUrl: "https://sunnylink.wiki/#HyundaiLongitudinalTuning",
    });
  }

  // Planplus experimental
  if (c.longitudinal.planplusEnabled) {
    issues.push({
      severity: "info",
      field: "PlanplusControl",
      message:
        "Planplus Longitudinal is experimental — test carefully before using in heavy traffic.",
      wikiUrl: "https://sunnylink.wiki/#PlanPlusControls",
    });
  }

  // Speed Limit Control with no offset type
  if (
    c.speedControl.speedLimitControl.enabled &&
    c.speedControl.speedLimitControl.offsetType === "none"
  ) {
    issues.push({
      severity: "info",
      field: "SpeedLimitOffsetType",
      message:
        "Speed Limit Control is enabled but offset type is 'none' — you will cruise at the exact posted limit.",
    });
  }

  // NNModel + EnforceTorque both enabled — may conflict
  if (c.lateral.useNNModel && c.lateral.enforceTorqueControl) {
    issues.push({
      severity: "warning",
      field: "EnforceTorqueControl",
      message:
        "Neural Network Lateral and Enforce Torque Control are both ON — these may conflict. Generally only use one.",
    });
  }

  return issues;
}
