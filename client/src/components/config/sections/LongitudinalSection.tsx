import { ArrowUpDown } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { NumberInput } from "../../ui/NumberInput";
import { Select } from "../../ui/Select";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

const HYUNDAI_TUNE_OPTS = [
  { value: "0", label: "0 — Off (Default openpilot tuning)" },
  { value: "1", label: "1 — Dynamic (Sportier acceleration & braking)" },
  { value: "2", label: "2 — Predictive (Smooth, comfort-focused)" },
];

const SLC_MODE_OPTS = [
  { value: "0", label: "Off — speed limit data not used" },
  { value: "1", label: "Info — display limit on HUD only" },
  { value: "2", label: "Warning — display + alert when exceeded" },
  { value: "3", label: "Assist — auto-adjust cruise speed" },
];

const SLC_SOURCE_OPTS = [
  { value: "0", label: "Car State Only — vehicle sign recognition" },
  { value: "1", label: "Map Data Only — OSM database" },
  { value: "2", label: "Car State Priority — car data, fall back to map (recommended)" },
  { value: "3", label: "Map Data Priority — map data, fall back to car" },
  { value: "4", label: "Combined — use the higher of both sources" },
];

const SLC_OFFSET_OPTS = [
  { value: "none",       label: "None — match limit exactly" },
  { value: "fixed",      label: "Fixed — add/subtract a set amount" },
  { value: "percentage", label: "% — apply a percentage above/below limit" },
];

export const LongitudinalSection: React.FC = () => {
  const { editingConfig, updateField, updateSection } = useConfigStore();
  const l = editingConfig.longitudinal;
  const s = editingConfig.speedControl;
  const set    = <K extends keyof typeof l>(k: K, val: (typeof l)[K]) => updateField("longitudinal", k, val);
  const setSpd = <K extends keyof typeof s>(k: K, val: (typeof s)[K]) => updateField("speedControl",  k, val);
  const setSlc = (k: keyof typeof s.speedLimitControl, v: unknown) =>
    updateSection("speedControl", { ...s, speedLimitControl: { ...s.speedLimitControl, [k]: v } });

  return (
    <ConfigSection
      id="cruise"
      icon={ArrowUpDown}
      title="Cruise"
      subtitle="Longitudinal control, ACC increments, and speed management"
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Longitudinal Control
      </p>

      <ParamRow
        label="Dynamic E2E Switch"
        spKey="DynamicExperimentalControl"
        description="DynamicExperimentalControl — automatically switch between E2E and manual longitudinal based on road/traffic conditions."
      >
        <Toggle checked={l.dynamicE2E} onChange={(v) => set("dynamicE2E", v)} />
      </ParamRow>

      <ParamRow
        label="Hyundai/Kia/Genesis Tune"
        spKey="HyundaiLongitudinalTuning"
        description="HyundaiLongitudinalTuning — 0=Off (standard), 1=Dynamic (sportier), 2=Predictive (smooth)."
      >
        <Select
          value={String(l.hyundaiLongTune)}
          onChange={(v) => set("hyundaiLongTune", parseInt(v) as 0 | 1 | 2)}
          options={HYUNDAI_TUNE_OPTS}
        />
      </ParamRow>

      <ParamRow
        label="Planplus Longitudinal"
        spKey="PlanplusControl"
        description="PlanplusControl — SP-developed planner for smoother, more predictive acceleration and braking."
      >
        <Toggle checked={l.planplusEnabled} onChange={(v) => set("planplusEnabled", v)} />
      </ParamRow>

      <div className="divider" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Custom ACC Increments
      </p>

      <ParamRow
        label="Custom ACC Increments"
        spKey="CustomAccIncrementsEnabled"
        description="CustomAccIncrementsEnabled — replace stock cruise +/− button step sizes with custom values."
      >
        <Toggle checked={l.customAccEnabled} onChange={(v) => set("customAccEnabled", v)} />
      </ParamRow>

      <ParamRow
        label="Short-Press Increment"
        spKey="CustomAccShortPressIncrement"
        description="CustomAccShortPressIncrement — speed change on a brief tap of the cruise +/− button (km/h)."
      >
        <NumberInput
          value={l.customAccShort}
          onChange={(v) => set("customAccShort", v)}
          min={1} max={10} step={1} decimals={0} unit="km/h"
          disabled={!l.customAccEnabled}
        />
      </ParamRow>

      <ParamRow
        label="Long-Press Increment"
        spKey="CustomAccLongPressIncrement"
        description="CustomAccLongPressIncrement — speed change when the cruise +/− button is held (km/h)."
      >
        <NumberInput
          value={l.customAccLong}
          onChange={(v) => set("customAccLong", v)}
          min={1} max={20} step={1} decimals={0} unit="km/h"
          disabled={!l.customAccEnabled}
        />
      </ParamRow>

      {/* ─── Smart Cruise ─── */}
      <div className="divider" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Smart Cruise Control
      </p>

      <ParamRow
        label="Cruise Button Management (ICBM)"
        spKey="IntelligentCruiseButtonManagement"
        description="IntelligentCruiseButtonManagement — Alpha feature that intelligently manages cruise control button behaviour for better sunnypilot integration."
      >
        <Toggle checked={s.icbmEnabled} onChange={(v) => setSpd("icbmEnabled", v)} />
      </ParamRow>

      <ParamRow
        label="Vision Turn Speed Control"
        spKey="SmartCruiseControlVision"
        description="SmartCruiseControlVision — use camera-detected curve geometry to pre-slow for turns."
      >
        <Toggle checked={s.visionEnabled} onChange={(v) => setSpd("visionEnabled", v)} />
      </ParamRow>

      <ParamRow
        label="Map Turn Speed Control"
        spKey="SmartCruiseControlMap"
        description="SmartCruiseControlMap — use OSM map data to look ahead for curves and slow pre-emptively."
      >
        <Toggle checked={s.mapEnabled} onChange={(v) => setSpd("mapEnabled", v)} />
      </ParamRow>

      {/* ─── Cruise — Speed Limit (SLC) ─── */}
      <div className="divider" />
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          Cruise — Speed Limit
        </p>

        <ParamRow
          label="Speed Limit Mode"
          spKey="SpeedLimitMode"
          description="SpeedLimitMode — Off: disabled. Info: display on HUD. Warning: alert when exceeded. Assist: auto-adjust cruise speed."
        >
          <Select
            value={String(s.speedLimitControl.mode)}
            onChange={(v) => setSlc("mode", parseInt(v) as 0 | 1 | 2 | 3)}
            options={SLC_MODE_OPTS}
          />
        </ParamRow>

        {s.speedLimitControl.mode > 0 && (
          <>
            <ParamRow
              label="Speed Limit Source"
              spKey="SpeedLimitSource"
              description="SpeedLimitSource — which data source provides the speed limit."
            >
              <Select
                value={String(s.speedLimitControl.policy)}
                onChange={(v) => setSlc("policy", parseInt(v))}
                options={SLC_SOURCE_OPTS}
              />
            </ParamRow>

            {s.speedLimitControl.mode === 3 && (
              <>
                <ParamRow
                  label="Speed Offset Type"
                  spKey="SpeedLimitOffsetType"
                  description="SpeedLimitOffsetType — None: match limit exactly. Fixed: add/subtract value. %: percentage."
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
                        ? "SpeedLimitValueOffset — percentage offset (+10 = 10% over limit)."
                        : "SpeedLimitValueOffset — fixed amount added to limit."
                    }
                  >
                    <Slider
                      value={s.speedLimitControl.offsetValue}
                      onChange={(v) => setSlc("offsetValue", v)}
                      min={-30} max={30} step={1} decimals={0}
                      unit={s.speedLimitControl.offsetType === "percentage" ? "%" : ""}
                    />
                  </ParamRow>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ConfigSection>
  );
};
