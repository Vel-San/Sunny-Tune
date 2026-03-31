import { ArrowUpDown } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Badge } from "../../ui/Badge";
import { RadioGroup } from "../../ui/RadioGroup";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow, SourceLegend } from "../ConfigSection";

const METHOD_OPTS = [
  {
    value: "sunnypilot",
    label: "SunnyPilot Longitudinal",
    description:
      "SP's custom longitudinal controller with full SLC/VTSC/MTSC support",
  },
  {
    value: "stock",
    label: "Stock (OEM)",
    description: "Use the car's factory ACC system for longitudinal control",
  },
  {
    value: "e2e",
    label: "E2E Full (Experimental)",
    description:
      "Comma AI end-to-end neural network controls both acceleration and braking",
  },
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
      badge={
        l.e2eEnabled ? (
          <Badge variant="warning">E2E</Badge>
        ) : l.useSPLong ? (
          <Badge variant="success">SP Long</Badge>
        ) : (
          <Badge variant="default">Stock</Badge>
        )
      }
    >
      <SourceLegend />

      <ParamRow
        label="Longitudinal Controller"
        description="Which system handles acceleration and braking"
        wide
      >
        <RadioGroup
          name="long-method"
          value={l.useSPLong ? (l.e2eEnabled ? "e2e" : "sunnypilot") : "stock"}
          onChange={(v) => {
            if (v === "stock") {
              set("useSPLong", false);
              set("e2eEnabled", false);
            } else if (v === "e2e") {
              set("useSPLong", true);
              set("e2eEnabled", true);
            } else {
              set("useSPLong", true);
              set("e2eEnabled", false);
            }
          }}
          options={METHOD_OPTS}
        />
      </ParamRow>

      <ParamRow
        label="Dynamic E2E"
        source="sunnypilot"
        description="dp_long_de2e — automatically switch between E2E and non-E2E longitudinal based on road conditions. Requires SP Long."
      >
        <Toggle
          checked={l.dynamicE2E}
          onChange={(v) => set("dynamicE2E", v)}
          disabled={!l.useSPLong}
        />
      </ParamRow>

      <ParamRow
        label="Smooth Stop"
        source="sunnypilot"
        description="dp_long_smooth_stop — apply extra gentle deceleration profile when coming to a complete stop. Reduces jerk at low speeds."
      >
        <Toggle
          checked={l.smoothStop}
          onChange={(v) => set("smoothStop", v)}
          disabled={!l.useSPLong}
        />
      </ParamRow>

      <ParamRow
        label="Coast Deceleration"
        source="sunnypilot"
        description="dp_long_coast_decel — allow the car to coast (not brake) when below a speed threshold instead of engaging brakes. Useful for hypermiling."
      >
        <Toggle
          checked={l.coastDecelEnabled}
          onChange={(v) => set("coastDecelEnabled", v)}
          disabled={!l.useSPLong}
        />
      </ParamRow>

      <ParamRow
        label="Aggressive Accel Behind Lead"
        source="sunnypilot"
        description="Apply higher acceleration profile when resume is triggered after the lead car moves away. Reduces distance gap on resume."
      >
        <Toggle
          checked={l.aggressiveAccelBehindLead}
          onChange={(v) => set("aggressiveAccelBehindLead", v)}
          disabled={!l.useSPLong}
        />
      </ParamRow>

      <div className="divider" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Jerk Limits Override
      </p>
      <p className="text-xs text-zinc-600 -mt-2">
        Set to 0 to use stock values. Jerk = rate of change of acceleration
        (m/s³).
      </p>

      <ParamRow
        label="Jerk Upper Limit"
        source="sunnypilot"
        description="Caps how quickly acceleration can increase (0 = stock)"
      >
        <Slider
          value={l.jerkUpperLimit}
          onChange={(v) => set("jerkUpperLimit", v)}
          min={0}
          max={5.0}
          step={0.1}
          unit=" m/s³"
          decimals={1}
          disabled={!l.useSPLong}
        />
      </ParamRow>
      <ParamRow
        label="Jerk Lower Limit"
        source="sunnypilot"
        description="Caps how quickly deceleration can increase — affects stop smoothness (0 = stock)"
      >
        <Slider
          value={l.jerkLowerLimit}
          onChange={(v) => set("jerkLowerLimit", v)}
          min={0}
          max={5.0}
          step={0.1}
          unit=" m/s³"
          decimals={1}
          disabled={!l.useSPLong}
        />
      </ParamRow>
    </ConfigSection>
  );
};
