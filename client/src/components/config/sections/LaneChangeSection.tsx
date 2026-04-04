import { ArrowLeftRight } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Select } from "../../ui/Select";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow, SourceLegend } from "../ConfigSection";

// SP AutoLaneChangeTimer integer enum values
const TIMER_OPTS = [
  { value: "-1", label: "Off (auto disabled)" },
  { value: "0", label: "Nudge required" },
  { value: "1", label: "Nudgeless (immediate)" },
  { value: "2", label: "0.5 s after signal" },
  { value: "3", label: "1.0 s after signal" },
  { value: "4", label: "2.0 s after signal" },
  { value: "5", label: "3.0 s after signal" },
];

export const LaneChangeSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const lc = editingConfig.laneChange;
  const set = <K extends keyof typeof lc>(k: K, val: (typeof lc)[K]) =>
    updateField("laneChange", k, val);

  return (
    <ConfigSection
      id="lane-change"
      icon={ArrowLeftRight}
      title="Lane Change"
      subtitle="Auto lane change timing, speed limits, and BSM integration"
    >
      <SourceLegend />

      <ParamRow
        label="Lane Change Assist"
        source="openpilot"
        since="2021"
        description="Enable openpilot-assisted lane changes when the turn signal is held."
      >
        <Toggle checked={lc.enabled} onChange={(v) => set("enabled", v)} />
      </ParamRow>

      <ParamRow
        label="Auto Timer"
        source="sunnypilot"
        since="2022"
        description="AutoLaneChangeTimer — how long the signal must be held before the lane change begins. 0 = nudge always required."
      >
        <Select
          value={String(lc.autoTimer)}
          onChange={(v) =>
            set("autoTimer", parseInt(v, 10) as typeof lc.autoTimer)
          }
          options={TIMER_OPTS}
          disabled={!lc.enabled}
        />
      </ParamRow>

      <ParamRow
        label="Minimum Speed"
        source="sunnypilot"
        since="2022"
        description="BlinkerMinLateralControlSpeed — lane change will not trigger below this speed."
      >
        <Slider
          value={lc.minimumSpeed}
          onChange={(v) => set("minimumSpeed", v)}
          min={0}
          max={120}
          step={5}
          decimals={0}
          unit=" kph"
          disabled={!lc.enabled}
        />
      </ParamRow>

      <ParamRow
        label="Blind Spot Monitoring"
        source="sunnypilot"
        since="2022"
        description="BlindSpot — integrate BSM radar data to block the lane change when a vehicle is detected in the blind spot."
      >
        <Toggle
          checked={lc.bsmMonitoring}
          onChange={(v) => set("bsmMonitoring", v)}
          disabled={!lc.enabled}
        />
      </ParamRow>

      <div className="divider" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Blinker Behaviour
      </p>

      <ParamRow
        label="Pause Lateral on Blinker"
        source="sunnypilot"
        since="2024"
        description="BlinkerPauseLateralControl — suspend steering control while the turn signal is active. Gives full manual steering during signalling."
      >
        <Toggle
          checked={lc.blinkerPauseLateral}
          onChange={(v) => set("blinkerPauseLateral", v)}
        />
      </ParamRow>

      <ParamRow
        label="Lateral Re-engage Delay"
        source="sunnypilot"
        since="2024"
        description="BlinkerLateralReengageDelay — seconds after the blinker turns off before lateral control re-engages."
      >
        <Slider
          value={lc.blinkerReengageDelay}
          onChange={(v) => set("blinkerReengageDelay", v)}
          min={0}
          max={3}
          step={0.1}
          decimals={1}
          unit=" s"
        />
      </ParamRow>
    </ConfigSection>
  );
};
