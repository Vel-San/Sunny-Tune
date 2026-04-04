import { TrendingUp } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Select } from "../../ui/Select";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

const SLC_POLICY_OPTS = [
  { value: "0", label: "0 — Disabled" },
  { value: "1", label: "1 — Navigation only (Mapbox/HERE)" },
  { value: "2", label: "2 — OSM only (OpenStreetMap)" },
  { value: "3", label: "3 — Navigation + OSM" },
  { value: "4", label: "4 — Nav + OSM with fallback (recommended)" },
  { value: "5", label: "5 — Vision-based" },
];

const SLC_OFFSET_OPTS = [
  { value: "none", label: "No offset — match limit exactly" },
  { value: "percentage", label: "Percentage above limit (e.g. +5%)" },
  { value: "fixed_mph", label: "Fixed offset in MPH" },
  { value: "fixed_kph", label: "Fixed offset in KPH" },
];

export const SpeedControlSection: React.FC = () => {
  const { editingConfig, updateField, updateSection } = useConfigStore();
  const s = editingConfig.speedControl;
  const setSlc = (k: keyof typeof s.speedLimitControl, v: unknown) =>
    updateSection("speedControl", {
      ...s,
      speedLimitControl: { ...s.speedLimitControl, [k]: v },
    });
  const set = <K extends keyof typeof s>(k: K, val: (typeof s)[K]) =>
    updateField("speedControl", k, val);

  return (
    <ConfigSection
      id="speed-control"
      icon={TrendingUp}
      title="Speed Control"
      subtitle="Speed limit control and curve speed management"
    >
      {/* ─── Speed Limit Control ─── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Speed Limit Control (SLC)
        </p>

        <ParamRow
          label="Enable SLC"
          source="sunnypilot"
          since="2022"
          description="SpeedLimitMode — automatically adjust cruise speed to match posted speed limits."
        >
          <Toggle
            checked={s.speedLimitControl.enabled}
            onChange={(v) => setSlc("enabled", v)}
          />
        </ParamRow>

        {s.speedLimitControl.enabled && (
          <>
            <ParamRow
              label="SLC Policy"
              source="sunnypilot"
              since="2023"
              description="SpeedLimitPolicy — data source and fallback strategy for speed limit data."
            >
              <Select
                value={String(s.speedLimitControl.policy)}
                onChange={(v) => setSlc("policy", parseInt(v))}
                options={SLC_POLICY_OPTS}
              />
            </ParamRow>

            <ParamRow
              label="Speed Above Limit"
              source="sunnypilot"
              since="2022"
              description="SpeedLimitOffsetType — how much faster than the posted limit to cruise."
            >
              <Select
                value={s.speedLimitControl.offsetType}
                onChange={(v) => setSlc("offsetType", v)}
                options={SLC_OFFSET_OPTS}
              />
            </ParamRow>

            {s.speedLimitControl.offsetType !== "none" && (
              <ParamRow
                label="Offset Value"
                description={
                  s.speedLimitControl.offsetType === "percentage"
                    ? "SpeedLimitValueOffset — percentage above limit (0–30%)"
                    : "SpeedLimitValueOffset — fixed amount above limit"
                }
              >
                <Slider
                  value={s.speedLimitControl.offsetValue}
                  onChange={(v) => setSlc("offsetValue", v)}
                  min={0}
                  max={
                    s.speedLimitControl.offsetType === "percentage" ? 30 : 20
                  }
                  step={1}
                  decimals={0}
                  unit={
                    s.speedLimitControl.offsetType === "percentage"
                      ? "%"
                      : s.speedLimitControl.offsetType === "fixed_mph"
                        ? " mph"
                        : " kph"
                  }
                />
              </ParamRow>
            )}
          </>
        )}
      </div>

      <div className="divider" />

      {/* ─── Curve speed ─── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Curve Speed Control
        </p>

        <ParamRow
          label="Vision Turn Speed Control"
          source="sunnypilot"
          since="2023"
          description="SmartCruiseControlVision — use camera-detected curve geometry to pre-slow for turns."
        >
          <Toggle
            checked={s.visionEnabled}
            onChange={(v) => set("visionEnabled", v)}
          />
        </ParamRow>

        <ParamRow
          label="Map Turn Speed Control"
          source="sunnypilot"
          since="2023"
          description="SmartCruiseControlMap — use OSM map data to look ahead for curves and slow pre-emptively."
        >
          <Toggle
            checked={s.mapEnabled}
            onChange={(v) => set("mapEnabled", v)}
          />
        </ParamRow>
      </div>
    </ConfigSection>
  );
};
