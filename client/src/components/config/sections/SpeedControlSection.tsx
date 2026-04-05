import { TrendingUp } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Select } from "../../ui/Select";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

// SpeedLimitMode — how sunnypilot responds to detected speed limits.
// 0=Off, 1=Info (HUD display only), 2=Warning (display + alert when exceeded),
// 3=Assist (auto-adjust cruise speed with optional offset).
// Source: sunnypilot official docs → Settings → Cruise → Speed Limit
const SLC_MODE_OPTS = [
  { value: "0", label: "Off — speed limit data not used" },
  { value: "1", label: "Info — display limit on HUD only" },
  { value: "2", label: "Warning — display + alert when exceeded" },
  { value: "3", label: "Assist — auto-adjust cruise speed" },
];

// SpeedLimitSource (our field: policy) — which data source provides the limit.
// 0=Car State Only, 1=Map Data Only, 2=Car State Priority, 3=Map Data Priority, 4=Combined
// Source: sunnypilot official docs → docs.sunnypilot.ai/settings/cruise/speed-limit/source/
const SLC_SOURCE_OPTS = [
  { value: "0", label: "Car State Only — vehicle sign recognition" },
  { value: "1", label: "Map Data Only — OSM database" },
  {
    value: "2",
    label: "Car State Priority — car data, fall back to map (recommended)",
  },
  { value: "3", label: "Map Data Priority — map data, fall back to car" },
  { value: "4", label: "Combined — use the higher of both sources" },
];

// SpeedLimitOffsetType — None / Fixed value / Percentage
const SLC_OFFSET_OPTS = [
  { value: "none", label: "None — match limit exactly" },
  { value: "fixed", label: "Fixed — add/subtract a set amount" },
  { value: "percentage", label: "% — apply a percentage above/below limit" },
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
      title="Cruise — Speed Limit"
      subtitle="Speed limit assist (SLC) and smart cruise curve control"
    >
      {/* ─── ICBM ─── */}
      <ParamRow
        label="Cruise Button Management (ICBM)"
        spKey="IntelligentCruiseButtonManagement"
        description="IntelligentCruiseButtonManagement — Alpha feature that intelligently manages cruise control button behaviour for better sunnypilot integration."
      >
        <Toggle
          checked={s.icbmEnabled}
          onChange={(v) => set("icbmEnabled", v)}
        />
      </ParamRow>

      {/* ─── Speed Limit Control ─── */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          Speed Limit (SLC)
        </p>

        {/* SpeedLimitMode — Off / Info / Warning / Assist */}
        <ParamRow
          label="Speed Limit Mode"
          spKey="SpeedLimitMode"
          description="SpeedLimitMode — Off: disabled. Info: display limit on HUD. Warning: display + alert when exceeded. Assist: auto-adjust cruise speed to the limit (with optional offset)."
        >
          <Select
            value={String(s.speedLimitControl.mode)}
            onChange={(v) => setSlc("mode", parseInt(v) as 0 | 1 | 2 | 3)}
            options={SLC_MODE_OPTS}
          />
        </ParamRow>

        {s.speedLimitControl.mode > 0 && (
          <>
            {/* SpeedLimitSource — which data source provides the limit */}
            <ParamRow
              label="Speed Limit Source"
              spKey="SpeedLimitSource"
              description="SpeedLimitSource — which data source(s) provide the speed limit. Car = vehicle sign recognition, Map = downloaded OSM database."
            >
              <Select
                value={String(s.speedLimitControl.policy)}
                onChange={(v) => setSlc("policy", parseInt(v))}
                options={SLC_SOURCE_OPTS}
              />
            </ParamRow>

            {/* Offset settings — only relevant when Assist mode auto-adjusts speed */}
            {s.speedLimitControl.mode === 3 && (
              <>
                <ParamRow
                  label="Speed Offset Type"
                  spKey="SpeedLimitOffsetType"
                  description="SpeedLimitOffsetType — None: match limit exactly. Fixed: add/subtract a set value. %: apply a percentage to the limit."
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
                    spKey="SpeedLimitValueOffset"
                    description={
                      s.speedLimitControl.offsetType === "percentage"
                        ? "SpeedLimitValueOffset — percentage offset (e.g. +10 = 10% over, −5 = 5% under)."
                        : "SpeedLimitValueOffset — fixed amount added to the speed limit. Positive = faster, negative = slower."
                    }
                  >
                    <Slider
                      value={s.speedLimitControl.offsetValue}
                      onChange={(v) => setSlc("offsetValue", v)}
                      min={-30}
                      max={30}
                      step={1}
                      decimals={0}
                      unit={
                        s.speedLimitControl.offsetType === "percentage"
                          ? "%"
                          : ""
                      }
                    />
                  </ParamRow>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="divider" />

      {/* ─── Curve speed ─── */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          Curve Speed Control
        </p>

        <ParamRow
          label="Vision Turn Speed Control"
          spKey="SmartCruiseControlVision"
          description="SmartCruiseControlVision — use camera-detected curve geometry to pre-slow for turns."
        >
          <Toggle
            checked={s.visionEnabled}
            onChange={(v) => set("visionEnabled", v)}
          />
        </ParamRow>

        <ParamRow
          label="Map Turn Speed Control"
          spKey="SmartCruiseControlMap"
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
