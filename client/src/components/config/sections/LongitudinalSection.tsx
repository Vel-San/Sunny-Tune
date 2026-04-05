import { ArrowUpDown } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Badge } from "../../ui/Badge";
import { NumberInput } from "../../ui/NumberInput";
import { Select } from "../../ui/Select";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow, SourceLegend } from "../ConfigSection";

const HYUNDAI_TUNE_OPTS = [
  { value: "0", label: "0 — Off (Default openpilot tuning)" },
  { value: "1", label: "1 — Dynamic (Sportier acceleration & braking)" },
  { value: "2", label: "2 — Predictive (Smooth, comfort-focused)" },
];

export const LongitudinalSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const l = editingConfig.longitudinal;
  const set = <K extends keyof typeof l>(k: K, val: (typeof l)[K]) =>
    updateField("longitudinal", k, val);

  return (
    <ConfigSection
      id="longitudinal"
      icon={ArrowUpDown}
      title="Longitudinal Control"
      subtitle="Speed, braking, and acceleration management"
      badge={l.e2eEnabled ? <Badge variant="warning">E2E</Badge> : undefined}
    >
      <SourceLegend />

      <ParamRow
        label="End-to-End Longitudinal"
        source="openpilot"
        since="2022"
        spKey="ExperimentalMode"
        description="ExperimentalMode — use Comma AI's neural-network E2E model for longitudinal control. Best on well-mapped US highways. Overrides manual tuning."
      >
        <Toggle checked={l.e2eEnabled} onChange={(v) => set("e2eEnabled", v)} />
      </ParamRow>

      <ParamRow
        label="Dynamic E2E Switch"
        source="sunnypilot"
        since="2023"
        spKey="DynamicExperimentalControl"
        description="DynamicExperimentalControl — automatically switches between E2E and manual longitudinal based on road/traffic conditions."
      >
        <Toggle checked={l.dynamicE2E} onChange={(v) => set("dynamicE2E", v)} />
      </ParamRow>

      <div className="divider" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        SP Enhancements
      </p>

      <ParamRow
        label="Alpha Longitudinal"
        source="sunnypilot"
        since="2025"
        spKey="AlphaLongitudinalEnabled"
        description="AlphaLongitudinalEnabled — next-generation experimental SP longitudinal improvements. Test in a safe environment first."
      >
        <Toggle
          checked={l.alphaLongEnabled}
          onChange={(v) => set("alphaLongEnabled", v)}
        />
      </ParamRow>

      <ParamRow
        label="Hyundai/Kia/Genesis Tune"
        source="sunnypilot"
        since="2025"
        spKey="HyundaiLongitudinalTuning"
        description="HyundaiLongitudinalTuning — longitudinal tuning preset for Hyundai/Kia/Genesis vehicles. 0=Off (standard openpilot), 1=Dynamic (more responsive acceleration and braking for a sportier feel), 2=Predictive (smoother, anticipatory speed changes that prioritize comfort)."
      >
        <Select
          value={String(l.hyundaiLongTune)}
          onChange={(v) => set("hyundaiLongTune", parseInt(v) as 0 | 1 | 2)}
          options={HYUNDAI_TUNE_OPTS}
        />
      </ParamRow>

      <ParamRow
        label="Planplus Longitudinal"
        source="sunnypilot"
        since="2025"
        spKey="PlanplusControl"
        description="PlanplusControl — SP-developed planner for smoother, more predictive acceleration and braking."
      >
        <Toggle
          checked={l.planplusEnabled}
          onChange={(v) => set("planplusEnabled", v)}
        />
      </ParamRow>

      <div className="divider" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Custom ACC Increments
      </p>

      <ParamRow
        label="Custom ACC Increments"
        source="sunnypilot"
        since="2024"
        spKey="CustomAccIncrementsEnabled"
        description="CustomAccIncrementsEnabled — replace stock cruise +/− button step sizes with custom values."
      >
        <Toggle
          checked={l.customAccEnabled}
          onChange={(v) => set("customAccEnabled", v)}
        />
      </ParamRow>

      <ParamRow
        label="Short-Press Increment"
        source="sunnypilot"
        since="2024"
        spKey="CustomAccShortPressIncrement"
        description="CustomAccShortPressIncrement — speed change on a brief tap of the cruise +/− button (km/h)."
      >
        <NumberInput
          value={l.customAccShort}
          onChange={(v) => set("customAccShort", v)}
          min={1}
          max={10}
          step={1}
          decimals={0}
          unit="km/h"
          disabled={!l.customAccEnabled}
        />
      </ParamRow>

      <ParamRow
        label="Long-Press Increment"
        source="sunnypilot"
        since="2024"
        spKey="CustomAccLongPressIncrement"
        description="CustomAccLongPressIncrement — speed change when the cruise +/− button is held (km/h)."
      >
        <NumberInput
          value={l.customAccLong}
          onChange={(v) => set("customAccLong", v)}
          min={1}
          max={20}
          step={1}
          decimals={0}
          unit="km/h"
          disabled={!l.customAccEnabled}
        />
      </ParamRow>
    </ConfigSection>
  );
};
