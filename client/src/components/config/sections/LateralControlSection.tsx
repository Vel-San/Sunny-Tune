import { GitBranch } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Select } from "../../ui/Select";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow, SourceLegend } from "../ConfigSection";

const TUNE_OPTS = [
  { value: "0", label: "0 — Comma stock (upstream defaults)" },
  { value: "1", label: "1 — SP (recommended)" },
  { value: "2", label: "2 — SP+ aggressive" },
];

export const LateralControlSection: React.FC = () => {
  const { editingConfig, updateField, updateSection } = useConfigStore();
  const lat = editingConfig.lateral;
  const set = <K extends keyof typeof lat>(k: K, val: (typeof lat)[K]) =>
    updateField("lateral", k, val);
  const setOverride = (
    k: keyof typeof lat.torqueOverride,
    v: boolean | number,
  ) =>
    updateSection("lateral", {
      ...lat,
      torqueOverride: { ...lat.torqueOverride, [k]: v },
    });

  return (
    <ConfigSection
      id="lateral"
      icon={GitBranch}
      title="Lateral Control"
      subtitle="Steering tuning, live torque estimation, and actuator calibration"
    >
      <SourceLegend />

      {/* ─── Camera ─── */}
      <ParamRow
        label="Camera Offset"
        source="openpilot"
        since="2021"
        description="CameraOffset — lateral offset of the camera from lane centre (m). Adjust if the car consistently drifts left or right of centre."
      >
        <Slider
          value={lat.cameraOffset}
          onChange={(v) => set("cameraOffset", v)}
          min={-0.3}
          max={0.3}
          step={0.01}
          decimals={2}
          unit=" m"
        />
      </ParamRow>

      {/* ─── Torque model selection ─── */}
      <ParamRow
        label="Torque Control Tune"
        source="sunnypilot"
        since="2023"
        description="TorqueControlTune — tuning preset for the torque lateral controller."
      >
        <Select
          value={String(lat.torqueControlTune)}
          onChange={(v) => set("torqueControlTune", parseInt(v) as 0 | 1 | 2)}
          options={TUNE_OPTS}
        />
      </ParamRow>

      <ParamRow
        label="Enforce Torque Control"
        source="sunnypilot"
        since="2024"
        description="EnforceTorqueControl — force SP's torque-based lateral controller even when the car's native steering system would otherwise take over."
      >
        <Toggle
          checked={lat.enforceTorqueControl}
          onChange={(v) => set("enforceTorqueControl", v)}
        />
      </ParamRow>

      <ParamRow
        label="Neural Network Lateral Model"
        source="sunnypilot"
        since="2025"
        description="NeuralNetworkLateralControl — use an on-device trained NN model instead of the rule-based torque controller. Experimental."
      >
        <Toggle
          checked={lat.useNNModel}
          onChange={(v) => set("useNNModel", v)}
        />
        {lat.useNNModel && (
          <p className="text-xs text-amber-400/80 mt-1">
            Experimental — requires a well-trained device model.
          </p>
        )}
      </ParamRow>

      {/* ─── Live torque ─── */}
      <div className="divider" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Live Torque Estimation
      </p>

      <ParamRow
        label="Live Torque Parameters"
        source="sunnypilot"
        since="2023"
        description="LiveTorqueParamsToggle — continuously learn friction and latAccelFactor from real drive data. Improves accuracy after several drives."
      >
        <Toggle
          checked={lat.liveTorque}
          onChange={(v) => set("liveTorque", v)}
        />
      </ParamRow>

      <ParamRow
        label="Relaxed Learning Rate"
        source="sunnypilot"
        since="2023"
        description="LiveTorqueParamsRelaxedToggle — use a slower learning rate for live torque updates. Reduces oscillation on noisy or winding roads."
      >
        <Toggle
          checked={lat.liveTorqueRelaxed}
          onChange={(v) => set("liveTorqueRelaxed", v)}
          disabled={!lat.liveTorque}
        />
      </ParamRow>

      {/* ─── LAGD ─── */}
      <div className="divider" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Live Actuator Group Delay (LAGD)
      </p>

      <ParamRow
        label="LAGD Enabled"
        source="sunnypilot"
        since="2024"
        description="LagdToggle — estimate the actual hardware steer delay from drive data for more accurate lateral prediction."
      >
        <Toggle
          checked={lat.lagdEnabled}
          onChange={(v) => set("lagdEnabled", v)}
        />
      </ParamRow>

      <ParamRow
        label="LAGD Delay Offset"
        source="sunnypilot"
        since="2024"
        description="LagdToggleDelay — manual offset added to the estimated actuator delay (seconds)."
      >
        <Slider
          value={lat.lagdDelay}
          onChange={(v) => set("lagdDelay", v)}
          min={0}
          max={1.0}
          step={0.05}
          decimals={2}
          unit=" s"
          disabled={!lat.lagdEnabled}
        />
      </ParamRow>

      {/* ─── Manual torque override ─── */}
      <div className="divider" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Manual Torque Parameter Override
      </p>
      <p className="text-xs text-zinc-600 -mt-2">
        Override the torque controller friction and lateral accel factor. Only
        active when "Torque Override" is enabled below.
      </p>

      <ParamRow
        label="Enable Torque Override"
        source="sunnypilot"
        since="2024"
        description="TorqueParamsOverrideEnabled — activate manually set friction + latAccelFactor values instead of learned or stock values."
      >
        <Toggle
          checked={lat.torqueOverride.enabled}
          onChange={(v) => setOverride("enabled", v)}
        />
      </ParamRow>

      <ParamRow
        label="Friction Override"
        source="sunnypilot"
        since="2024"
        description="TorqueParamsOverrideFriction — rolling friction compensation (0.01–0.5). Higher = more steering resistance compensation."
      >
        <Slider
          value={lat.torqueOverride.friction}
          onChange={(v) => setOverride("friction", v)}
          min={0.01}
          max={0.5}
          step={0.01}
          decimals={2}
          disabled={!lat.torqueOverride.enabled}
        />
      </ParamRow>

      <ParamRow
        label="Lat Accel Factor Override"
        source="sunnypilot"
        since="2024"
        description="TorqueParamsOverrideLatAccelFactor — scales lateral acceleration requests (1.0–4.0). Higher = more aggressive steering response."
      >
        <Slider
          value={lat.torqueOverride.latAccelFactor}
          onChange={(v) => setOverride("latAccelFactor", v)}
          min={1.0}
          max={4.0}
          step={0.05}
          decimals={2}
          disabled={!lat.torqueOverride.enabled}
        />
      </ParamRow>
    </ConfigSection>
  );
};
