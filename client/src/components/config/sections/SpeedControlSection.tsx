import { TrendingUp } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Select } from "../../ui/Select";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

const SLC_SOURCE_OPTS = [
  { value: "none", label: "Disabled — no auto speed limit" },
  { value: "nav", label: "Navigation only (Mapbox/HERE)" },
  { value: "osm", label: "OSM only (OpenStreetMap)" },
  { value: "nav_osm", label: "Navigation + OSM (recommended)" },
];

const SLC_OFFSET_OPTS = [
  { value: "none", label: "No offset — match limit exactly" },
  { value: "percentage", label: "Percentage above limit (e.g. +5%)" },
  { value: "fixed_mph", label: "Fixed offset in MPH" },
  { value: "fixed_kph", label: "Fixed offset in KPH" },
];

const CRUISE_INCREMENT_OPTS = [
  { value: "1", label: "1 mph/kph per press" },
  { value: "5", label: "5 mph/kph per press" },
];

export const SpeedControlSection: React.FC = () => {
  const { editingConfig, updateField, updateSection } = useConfigStore();
  const s = editingConfig.speedControl;
  const setSlc = (k: keyof typeof s.speedLimitControl, v: unknown) =>
    updateSection("speedControl", {
      ...s,
      speedLimitControl: { ...s.speedLimitControl, [k]: v },
    });
  const setVtsc = (k: keyof typeof s.visionTurnControl, v: unknown) =>
    updateSection("speedControl", {
      ...s,
      visionTurnControl: { ...s.visionTurnControl, [k]: v },
    });
  const setMtsc = (k: keyof typeof s.mapTurnControl, v: unknown) =>
    updateSection("speedControl", {
      ...s,
      mapTurnControl: { ...s.mapTurnControl, [k]: v },
    });
  const set = <K extends keyof typeof s>(k: K, val: (typeof s)[K]) =>
    updateField("speedControl", k, val);

  return (
    <ConfigSection
      id="speed-control"
      icon={TrendingUp}
      title="Speed Control"
      subtitle="Speed limit enforcement, vision/map-based curve control, cruise settings"
    >
      {/* ─── Speed Limit Control ─── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Speed Limit Control (SLC)
        </p>

        <ParamRow
          label="Data Source"
          description="dp_sl_ctrl_source — where speed limit data is pulled from"
        >
          <Select
            value={s.speedLimitControl.source}
            onChange={(v) => setSlc("source", v)}
            options={SLC_SOURCE_OPTS}
          />
        </ParamRow>

        {s.speedLimitControl.source !== "none" && (
          <>
            <ParamRow
              label="Speed Above Limit"
              description="dp_sl_ctrl_offset_type — how much faster than the posted limit to drive"
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
                    ? "Percentage above limit (0–30%)"
                    : "Fixed amount above limit"
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
                      : ` ${s.speedUnit}`
                  }
                />
              </ParamRow>
            )}

            <ParamRow
              label="Auto Engage"
              description="dp_sl_ctrl_at — automatically adjust cruise speed when entering a new speed limit zone"
            >
              <Toggle
                checked={s.speedLimitControl.autoEngage}
                onChange={(v) => setSlc("autoEngage", v)}
              />
            </ParamRow>

            <ParamRow
              label="Engage Alert"
              description="Show notification on HUD when speed limit changes"
            >
              <Toggle
                checked={s.speedLimitControl.engageAlert}
                onChange={(v) => setSlc("engageAlert", v)}
              />
            </ParamRow>
          </>
        )}
      </div>

      <div className="divider" />

      {/* ─── VTSC ─── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Vision Turn Speed Control (VTSC)
        </p>
        <p className="text-xs text-zinc-600">
          dp_vtsc_enabled — uses camera-detected curve geometry to pre-slow for
          turns
        </p>

        <ParamRow label="Enabled">
          <Toggle
            checked={s.visionTurnControl.enabled}
            onChange={(v) => setVtsc("enabled", v)}
          />
        </ParamRow>

        {s.visionTurnControl.enabled && (
          <>
            <ParamRow
              label="Target Turn Speed"
              description="dp_vtsc_speed_ctrl — minimum speed OpenPilot targets when entering a curve"
            >
              <Slider
                value={s.visionTurnControl.turnSpeed}
                onChange={(v) => setVtsc("turnSpeed", v)}
                min={10}
                max={45}
                step={1}
                decimals={0}
                unit={` ${s.speedUnit}`}
              />
            </ParamRow>
            <ParamRow
              label="Curve Aggressiveness"
              description="1 = gentle long braking  /  10 = sharp hard braking"
            >
              <Slider
                value={s.visionTurnControl.smoothFactor}
                onChange={(v) => setVtsc("smoothFactor", v)}
                min={1}
                max={10}
                step={1}
                decimals={0}
              />
            </ParamRow>
          </>
        )}
      </div>

      <div className="divider" />

      {/* ─── MTSC ─── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Map Turn Speed Control (MTSC)
        </p>
        <p className="text-xs text-zinc-600">
          dp_mtsc_enabled — uses OSM map data to look ahead for curves and slow
          pre-emptively
        </p>

        <ParamRow label="Enabled">
          <Toggle
            checked={s.mapTurnControl.enabled}
            onChange={(v) => setMtsc("enabled", v)}
          />
        </ParamRow>

        {s.mapTurnControl.enabled && (
          <ParamRow
            label="Speed Margin"
            description="dp_mtsc_speed_margin — allowed speed above the mapped curve speed limit"
          >
            <Slider
              value={s.mapTurnControl.speedMargin}
              onChange={(v) => setMtsc("speedMargin", v)}
              min={0}
              max={20}
              step={1}
              decimals={0}
              unit={` ${s.speedUnit}`}
            />
          </ParamRow>
        )}
      </div>

      <div className="divider" />

      {/* ─── Cruise settings ─── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Cruise Settings
        </p>

        <ParamRow
          label="Set Speed Offset"
          description="Offset applied to displayed cruise speed (−20 to +20). Useful for speedometer calibration."
        >
          <Slider
            value={s.setSpeedOffset}
            onChange={(v) => set("setSpeedOffset", v)}
            min={-20}
            max={20}
            step={1}
            decimals={0}
            unit={` ${s.speedUnit}`}
          />
        </ParamRow>

        <ParamRow
          label="Cruise Increment"
          description="Speed change per button press"
        >
          <Select
            value={String(s.cruiseIncrement)}
            onChange={(v) => set("cruiseIncrement", parseInt(v) as 1 | 5)}
            options={CRUISE_INCREMENT_OPTS}
          />
        </ParamRow>

        <ParamRow label="Speed Unit">
          <Select
            value={s.speedUnit}
            onChange={(v) => set("speedUnit", v as "mph" | "kph")}
            options={[
              { value: "mph", label: "MPH" },
              { value: "kph", label: "KPH" },
            ]}
          />
        </ParamRow>

        <ParamRow
          label="Auto Resume"
          description="Automatically resume cruise after a brief complete stop (e.g. at lights)"
        >
          <Toggle
            checked={s.autoResume}
            onChange={(v) => set("autoResume", v)}
          />
        </ParamRow>

        <ParamRow
          label="Show Speed Limit on HUD"
          description="Display active speed limit on the openpilot HUD overlay"
        >
          <Toggle
            checked={s.showSpeedLimit}
            onChange={(v) => set("showSpeedLimit", v)}
          />
        </ParamRow>
      </div>
    </ConfigSection>
  );
};
