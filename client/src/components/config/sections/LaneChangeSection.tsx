import { ArrowLeftRight } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Select } from "../../ui/Select";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow, SourceLegend } from "../ConfigSection";

const TIMER_OPTS = [
  { value: "0", label: "Nudge required (no auto)" },
  { value: "0.5", label: "0.5s after signal" },
  { value: "1", label: "1.0s after signal" },
  { value: "1.5", label: "1.5s after signal" },
  { value: "2", label: "2.0s after signal" },
  { value: "2.5", label: "2.5s after signal" },
  { value: "3", label: "3.0s after signal" },
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
        label="Auto Lane Change"
        source="openpilot"
        description="dp_lc_auto_on — enable automatic lane change when turn signal is held"
      >
        <Toggle checked={lc.enabled} onChange={(v) => set("enabled", v)} />
      </ParamRow>

      <ParamRow
        label="Auto Timer"
        source="sunnypilot"
        description="dp_lc_auto_delay — how long after signal activation before the lane change begins. 0 = nudge always required."
      >
        <Select
          value={String(lc.autoTimer)}
          onChange={(v) =>
            set("autoTimer", parseFloat(v) as typeof lc.autoTimer)
          }
          options={TIMER_OPTS}
          disabled={!lc.enabled}
        />
      </ParamRow>

      <ParamRow
        label="Minimum Speed"
        source="openpilot"
        description="dp_lc_auto_min_spd — lane change will not trigger below this speed"
      >
        <Slider
          value={lc.minimumSpeed}
          onChange={(v) => set("minimumSpeed", v)}
          min={15}
          max={80}
          step={1}
          decimals={0}
          unit=" mph"
          disabled={!lc.enabled}
        />
      </ParamRow>

      <ParamRow
        label="Blind Spot Monitoring"
        source="sunnypilot"
        description="dp_lc_auto_unsafe — integrate BSM radar data to block lane change when vehicle detected in blind spot"
      >
        <Toggle
          checked={lc.bsmMonitoring}
          onChange={(v) => set("bsmMonitoring", v)}
          disabled={!lc.enabled}
        />
      </ParamRow>

      <ParamRow
        label="Nudgeless Lane Change"
        source="sunnypilot"
        description="dp_lc_auto_nudge_less — begin lane change purely from signal, no physical steering nudge required"
      >
        <Toggle
          checked={lc.nudgeless}
          onChange={(v) => set("nudgeless", v)}
          disabled={!lc.enabled}
        />
      </ParamRow>

      <ParamRow
        label="Alert on Change"
        source="sunnypilot"
        description="Play audio alert when lane change initiates"
      >
        <Toggle
          checked={lc.alertOnChange}
          onChange={(v) => set("alertOnChange", v)}
          disabled={!lc.enabled}
        />
      </ParamRow>

      <ParamRow
        label="Cancel Below Min Speed"
        source="sunnypilot"
        description="Abort lane change if speed drops below minimum threshold during the maneuver"
      >
        <Toggle
          checked={lc.cancelBelowMinSpeed}
          onChange={(v) => set("cancelBelowMinSpeed", v)}
          disabled={!lc.enabled}
        />
      </ParamRow>

      <ParamRow
        label="One Lane Change Mode"
        source="sunnypilot"
        description="Disable turn-signal-triggered lane change; only use openpilot for subtle in-lane keeping (LKAS mode)"
      >
        <Toggle
          checked={lc.oneLaneChange}
          onChange={(v) => set("oneLaneChange", v)}
        />
      </ParamRow>
    </ConfigSection>
  );
};
