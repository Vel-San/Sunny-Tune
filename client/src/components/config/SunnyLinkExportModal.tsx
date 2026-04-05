/**
 * SunnyLinkExportModal — "Review before export" modal for SunnyLink exports.
 *
 * Shows:
 * 1. A validation summary (issues that need attention)
 * 2. A complete table of all parameters being exported, grouped by section
 * 3. Links to the official sunnypilot docs for reference
 * 4. A "Confirm & Download" button
 */

import {
  AlertTriangle,
  CheckCircle,
  Download,
  ExternalLink,
  Info,
  X,
} from "lucide-react";
import React, { useMemo } from "react";
import { exportAsSunnyLink } from "../../lib/configExport";
import {
  validateForSunnyLinkExport,
  type ValidationSeverity,
} from "../../lib/sunnyLinkValidation";
import type { SPConfig } from "../../types/config";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

// ── Parameter table ───────────────────────────────────────────────────────────

interface ExportParam {
  key: string;
  label: string;
  value: string;
}

interface ExportGroup {
  section: string;
  params: ExportParam[];
}

function formatValue(v: unknown): string {
  if (v === true || v === "True" || v === "true") return "✓ ON";
  if (v === false || v === "False" || v === "false") return "✗ OFF";
  if (v === null || v === undefined || v === "") return "(empty)";
  return String(v);
}

function buildExportGroups(c: SPConfig): ExportGroup[] {
  const lat = c.lateral;
  const lon = c.longitudinal;
  const lc = c.laneChange;
  const sc = c.speedControl;
  const ifc = c.interface;
  const ai = c.commaAI;
  const dp = c.drivingPersonality;
  const nav = c.navigation;
  const adv = c.advanced;

  const lpLabel: Record<string, string> = {
    aggressive: "Aggressive (0)",
    standard: "Standard (1)",
    relaxed: "Relaxed (2)",
  };

  const alctLabel: Record<number, string> = {
    "-1": "Off",
    "0": "Nudge",
    "1": "Nudgeless",
    "2": "0.5 s",
    "3": "1 s",
    "4": "2 s",
    "5": "3 s",
  } as unknown as Record<number, string>;

  const hyundaiLabel: Record<number, string> = {
    0: "Off",
    1: "Dynamic",
    2: "Predictive",
  };
  const madsMode: Record<number, string> = {
    0: "Remain Active",
    1: "Pause",
    2: "Disengage",
  };

  return [
    {
      section: "Toggles",
      params: [
        {
          key: "LongitudinalPersonality",
          label: "Personality",
          value:
            lpLabel[dp.longitudinalPersonality] ?? dp.longitudinalPersonality,
        },
        {
          key: "ExperimentalMode",
          label: "E2E / Experimental Mode",
          value: formatValue(lon.e2eEnabled),
        },
        {
          key: "AlwaysOnDM",
          label: "Always-On Driver Monitoring",
          value: formatValue(ifc.alwaysOnDM),
        },
        {
          key: "DisengageOnAccelerator",
          label: "Disengage on Accelerator",
          value: formatValue(ai.disengageOnAccelerator),
        },
        {
          key: "IsLdwEnabled",
          label: "Lane Departure Warning",
          value: formatValue(ai.ldwEnabled),
        },
        {
          key: "RecordFront",
          label: "Record Drives",
          value: formatValue(ai.recordDrives),
        },
        {
          key: "GsmMetered",
          label: "Upload Only on Wi-Fi",
          value: formatValue(ai.uploadOnlyOnWifi),
        },
        {
          key: "RecordAudioFeedback",
          label: "Record Audio",
          value: formatValue(ai.recordAudioFeedback),
        },
      ],
    },
    {
      section: "Steering",
      params: [
        { key: "Mads", label: "MADS Enabled", value: formatValue(ai.mads) },
        {
          key: "MadsMainCruiseAllowed",
          label: "MADS Main Cruise",
          value: formatValue(ai.madsMainCruise),
        },
        {
          key: "MadsSteeringMode",
          label: "MADS Steering Mode",
          value: madsMode[ai.madsSteeringMode] ?? String(ai.madsSteeringMode),
        },
        {
          key: "MadsUnifiedEngagementMode",
          label: "MADS Unified Engagement",
          value: formatValue(ai.madsUnifiedEngagement),
        },
        {
          key: "EnforceTorqueControl",
          label: "Enforce Torque Control",
          value: formatValue(lat.enforceTorqueControl),
        },
        {
          key: "NeuralNetworkLateralControl",
          label: "NN Lateral Model",
          value: formatValue(lat.useNNModel),
        },
        {
          key: "BlinkerPauseLateralControl",
          label: "Pause Lateral on Blinker",
          value: formatValue(lc.blinkerPauseLateral),
        },
        {
          key: "BlinkerMinLateralControlSpeed",
          label: "Min Speed for Blinker Pause",
          value: `${lc.minimumSpeed} km/h`,
        },
        {
          key: "BlinkerLateralReengageDelay",
          label: "Lateral Re-engage Delay",
          value: `${lc.blinkerReengageDelay} s`,
        },
        {
          key: "CameraOffset",
          label: "Camera Offset",
          value: `${lat.cameraOffset} m`,
        },
        {
          key: "TorqueControlTune",
          label: "Torque Control Tune",
          value: String(lat.torqueControlTune),
        },
        {
          key: "LiveTorqueParamsToggle",
          label: "Live Torque Params",
          value: formatValue(lat.liveTorque),
        },
        {
          key: "LagdToggle",
          label: "LAGD Enabled",
          value: formatValue(lat.lagdEnabled),
        },
        {
          key: "LagdToggleDelay",
          label: "LAGD Delay Offset",
          value: `${lat.lagdDelay} s`,
        },
        {
          key: "TorqueParamsOverrideEnabled",
          label: "Torque Override",
          value: formatValue(lat.torqueOverride.enabled),
        },
        ...(lat.torqueOverride.enabled
          ? [
              {
                key: "TorqueParamsOverrideFriction",
                label: "Override Friction",
                value: String(lat.torqueOverride.friction),
              },
              {
                key: "TorqueParamsOverrideLatAccelFactor",
                label: "Override LatAccelFactor",
                value: String(lat.torqueOverride.latAccelFactor),
              },
            ]
          : []),
        {
          key: "AutoLaneChangeTimer",
          label: "Auto Lane Change Timer",
          value:
            alctLabel[String(lc.autoTimer) as unknown as number] ??
            String(lc.autoTimer),
        },
        {
          key: "BlindSpot",
          label: "Blind Spot Monitoring",
          value: formatValue(lc.bsmMonitoring),
        },
      ],
    },
    {
      section: "Cruise",
      params: [
        {
          key: "DynamicExperimentalControl",
          label: "Dynamic E2E Switch",
          value: formatValue(lon.dynamicE2E),
        },
        {
          key: "HyundaiLongitudinalTuning",
          label: "Hyundai Tuning",
          value:
            hyundaiLabel[lon.hyundaiLongTune] ?? String(lon.hyundaiLongTune),
        },
        {
          key: "PlanplusControl",
          label: "Planplus",
          value: lon.planplusEnabled ? "✓ ON (1.0)" : "✗ OFF",
        },
        {
          key: "CustomAccIncrementsEnabled",
          label: "Custom ACC Increments",
          value: formatValue(lon.customAccEnabled),
        },
        ...(lon.customAccEnabled
          ? [
              {
                key: "CustomAccShortPressIncrement",
                label: "Short-Press Increment",
                value: `${lon.customAccShort} km/h`,
              },
              {
                key: "CustomAccLongPressIncrement",
                label: "Long-Press Increment",
                value: `${lon.customAccLong} km/h`,
              },
            ]
          : []),
        {
          key: "IntelligentCruiseButtonManagement",
          label: "ICBM (Alpha)",
          value: formatValue(sc.icbmEnabled),
        },
        {
          key: "SmartCruiseControlVision",
          label: "Vision Turn Speed",
          value: formatValue(sc.visionEnabled),
        },
        {
          key: "SmartCruiseControlMap",
          label: "Map Turn Speed",
          value: formatValue(sc.mapEnabled),
        },
        {
          key: "SpeedLimitMode",
          label: "Speed Limit Control",
          value:
            sc.speedLimitControl.mode > 0
              ? `✓ ON — ${(["Off", "Info", "Warning", "Assist"] as const)[sc.speedLimitControl.mode]} (policy ${sc.speedLimitControl.policy})`
              : "✗ OFF",
        },
        {
          key: "SpeedLimitSource",
          label: "SLC Policy",
          value: String(sc.speedLimitControl.policy ?? ""),
        },
        {
          key: "SpeedLimitOffsetType",
          label: "SLC Offset Type",
          value: sc.speedLimitControl.offsetType,
        },
        {
          key: "SpeedLimitValueOffset",
          label: "SLC Offset Value",
          value: String(sc.speedLimitControl.offsetValue),
        },
      ],
    },
    {
      section: "Maps",
      params: [
        {
          key: "OsmLocal",
          label: "OSM Map Data",
          value: formatValue(nav.osmEnabled),
        },
      ],
    },
    {
      section: "Visuals",
      params: [
        {
          key: "DevUIInfo",
          label: "Developer UI",
          value: formatValue(ifc.devUI),
        },
        {
          key: "StandstillTimer",
          label: "Standstill Timer",
          value: formatValue(ifc.standstillTimer),
        },
        {
          key: "GreenLightAlert",
          label: "Green Light Alert",
          value: formatValue(ifc.greenLightAlert),
        },
        {
          key: "LeadDepartAlert",
          label: "Lead Depart Alert",
          value: formatValue(ifc.leadDepartAlert),
        },
        {
          key: "ShowTurnSignals",
          label: "Show Turn Signals",
          value: formatValue(ifc.showTurnSignals),
        },
        {
          key: "RoadNameToggle",
          label: "Road Name Display",
          value: formatValue(ifc.roadNameDisplay),
        },
        {
          key: "HideVEgoUI",
          label: "Hide Speed on HUD",
          value: formatValue(ifc.hideVegoUI),
        },
        {
          key: "TrueVEgoUI",
          label: "True Speed Display",
          value: formatValue(ifc.trueVegoUI),
        },
        {
          key: "TorqueBar",
          label: "Torque Bar",
          value: formatValue(ifc.torqueBar),
        },
        {
          key: "BlindSpotDetection",
          label: "Blind Spot HUD Warnings",
          value: formatValue(ifc.blindSpotHUD),
        },
        {
          key: "SteeringArc",
          label: "Steering Arc",
          value: formatValue(ifc.steeringArc),
        },
        {
          key: "ChevronInfo",
          label: "Metrics Below Chevron",
          value: formatValue(ifc.chevronInfo),
        },
        {
          key: "RainbowMode",
          label: "Tesla Rainbow Mode",
          value: formatValue(ifc.rainbowMode),
        },
      ],
    },
    {
      section: "Device",
      params: [
        {
          key: "SunnylinkEnabled",
          label: "SunnyLink Connect",
          value: formatValue(ai.connectEnabled),
        },
        {
          key: "IsMetric",
          label: "Metric Units",
          value: formatValue(ifc.useMetric),
        },
        {
          key: "QuietMode",
          label: "Quiet Mode",
          value: formatValue(ifc.quietMode),
        },
        {
          key: "OnroadUploads",
          label: "Disable Onroad Uploads",
          value: ifc.disableOnroadUploads ? "✗ OFF (disabled)" : "✓ ON",
        },
      ],
    },
    {
      section: "Developer",
      params: [
        {
          key: "AlphaLongitudinalEnabled",
          label: "Alpha Longitudinal",
          value: formatValue(lon.alphaLongEnabled),
        },
        {
          key: "QuickBootToggle",
          label: "Quick Boot",
          value: formatValue(adv.quickBoot),
        },
      ],
    },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SunnyLinkExportModalProps {
  config: SPConfig;
  name?: string;
  onClose: () => void;
}

const severityIcon: Record<ValidationSeverity, React.ReactNode> = {
  error: <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />,
  warning: (
    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
  ),
  info: <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />,
};

const severityBg: Record<ValidationSeverity, string> = {
  error: "bg-red-500/10 border-red-500/20 text-red-300",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-300",
  info: "bg-blue-500/10 border-blue-500/20 text-blue-300",
};

export const SunnyLinkExportModal: React.FC<SunnyLinkExportModalProps> = ({
  config,
  name,
  onClose,
}) => {
  const issues = useMemo(() => validateForSunnyLinkExport(config), [config]);
  const groups = useMemo(() => buildExportGroups(config), [config]);

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  const handleExport = () => {
    exportAsSunnyLink(config, name);
    onClose();
  };

  return (
    <Modal
      open={true}
      title="Review SunnyLink Export"
      onClose={onClose}
      width="lg"
    >
      <div className="space-y-4">
        {/* Summary header */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Exporting{" "}
            <span className="font-mono text-zinc-200">
              {groups.reduce((n, g) => n + g.params.length, 0)}
            </span>{" "}
            parameters to SunnyLink format
          </div>
          {warnings.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <AlertTriangle className="w-3 h-3" />
              {warnings.length} warning{warnings.length > 1 ? "s" : ""}
            </span>
          )}
          {infos.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
              <Info className="w-3 h-3" />
              {infos.length} notice{infos.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Validation issues */}
        {issues.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">
              Validation
            </p>
            {issues.map((issue, i) => (
              <div
                key={i}
                className={`flex gap-2.5 px-3 py-2.5 rounded-lg border text-xs ${severityBg[issue.severity]}`}
              >
                {severityIcon[issue.severity]}
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[10px] opacity-60 mr-1.5">
                    {issue.field}
                  </span>
                  {issue.message}
                  {issue.docsUrl && (
                    <a
                      href={issue.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 ml-2 opacity-70 hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Parameter table */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600">
            Parameters being exported
          </p>
          {groups.map((group) => (
            <div key={group.section}>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                {group.section}
              </p>
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {group.params.map((param, j) => (
                      <tr
                        key={param.key}
                        className={
                          j % 2 === 0 ? "bg-zinc-950/40" : "bg-transparent"
                        }
                      >
                        <td className="px-3 py-1.5 text-zinc-500 font-mono text-[10px] w-1/2 border-r border-zinc-800">
                          {param.key}
                        </td>
                        <td className="px-3 py-1.5 text-zinc-300 font-mono text-[10px]">
                          {param.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-zinc-600">
          This file can be imported into your device via the SunnyLink app
          (Settings → Restore → Import from file). Cross-reference with the{" "}
          <a
            href="https://docs.sunnypilot.ai/settings/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            sunnypilot Docs
          </a>{" "}
          if unsure about any value.
        </p>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <a
            href="https://docs.sunnypilot.ai/settings/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-blue-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            sunnypilot Docs
          </a>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExport}
              disabled={errors.length > 0}
            >
              {errors.length > 0 ? "Fix errors first" : "Confirm & Download"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
