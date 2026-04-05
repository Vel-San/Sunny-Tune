import { GitBranch } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Select } from "../../ui/Select";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

const TUNE_OPTS = [
  { value: "0", label: "0 — Comma stock (upstream defaults)" },
  { value: "1", label: "1 — SP (recommended)" },
  { value: "2", label: "2 — SP+ aggressive" },
];

const MADS_STEERING_OPTS = [
  { value: "0", label: "Remain Active — steering stays active while braking" },
  { value: "1", label: "Pause — pauses on brake, resumes on release" },
  { value: "2", label: "Disengage — steering disengages, must re-engage manually" },
];

const TIMER_OPTS = [
  { value: "-1", label: "Off (auto disabled)" },
  { value: "0",  label: "Nudge required" },
  { value: "1",  label: "Nudgeless (immediate)" },
  { value: "2",  label: "0.5 s after signal" },
  { value: "3",  label: "1.0 s after signal" },
  { value: "4",  label: "2.0 s after signal" },
  { value: "5",  label: "3.0 s after signal" },
];

export const LateralControlSection: React.FC = () => {
  const { editingConfig, updateField, updateSection } = useConfigStore();
  const lat = editingConfig.lateral;
  const ai  = editingConfig.commaAI;
  const lc  = editingConfig.laneChange;
  const set = <K extends keyof typeof lat>(k: K, val: (typeof lat)[K]) =>
    updateField("lateral", k, val);
  const setAi = <K extends keyof typeof ai>(k: K, val: (typeof ai)[K]) =>
    updateField("commaAI", k, val);
  const setLc = <K extends keyof typeof lc>(k: K, val: (typeof lc)[K]) =>
    updateField("laneChange", k, val);
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
      id="steering"
      icon={GitBranch}
      title="Steering"
      subtitle="MADS, lateral assist, torque tuning, and lane change"
    >

      {/* ─── MADS ─── */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        MADS — Steering
      </p>
      <p className="text-xs text-zinc-600 -mt-2">
        Modular Automated Driving System — allows steering assist independently of ACC.
      </p>

      <ParamRow
        label="Enable MADS"
        spKey="Mads"
        description="Mads — allow steering assist to operate without ACC engaged."
      >
        <Toggle checked={ai.mads} onChange={(v) => setAi("mads", v)} />
      </ParamRow>

      <ParamRow
        label="Main Cruise Toggle"
        spKey="MadsMainCruiseAllowed"
        description="MadsMainCruiseAllowed — allow the main cruise button to engage/disengage MADS lateral control."
      >
        <Toggle
          checked={ai.madsMainCruise}
          onChange={(v) => setAi("madsMainCruise", v)}
          disabled={!ai.mads}
        />
      </ParamRow>

      <ParamRow
        label="Steering Mode on Brake"
        spKey="MadsSteeringMode"
        description="MadsSteeringMode — controls what MADS lateral assistance does when you press the brake pedal."
      >
        <Select
          value={String(ai.madsSteeringMode)}
          onChange={(v) => setAi("madsSteeringMode", parseInt(v) as 0 | 1 | 2)}
          options={MADS_STEERING_OPTS}
          disabled={!ai.mads}
        />
      </ParamRow>

      <ParamRow
        label="Unified Engagement"
        spKey="MadsUnifiedEngagementMode"
        description="MadsUnifiedEngagementMode — engage both MADS lateral and ACC longitudinal together with a single button press."
      >
        <Toggle
          checked={ai.madsUnifiedEngagement}
          onChange={(v) => setAi("madsUnifiedEngagement", v)}
          disabled={!ai.mads}
        />
      </ParamRow>

      {/* ─── Lateral Assist ─── */}
      <div className="divider" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Lateral Assist
      </p>

      <ParamRow
        label="Camera Offset"
        spKey="CameraOffset"
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
        spKey="TorqueControlTune"
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
        spKey="EnforceTorqueControl"
        description="EnforceTorqueControl — force SP's torque-based lateral controller even when the car's native steering system would otherwise take over."
      >
        <Toggle
          checked={lat.enforceTorqueControl}
          onChange={(v) => set("enforceTorqueControl", v)}
        />
      </ParamRow>

      <ParamRow
        label="Neural Network Lateral Model"
        spKey="NeuralNetworkLateralControl"
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

      {/* ─── Blinker behaviour ─── */}
      <div className="divider" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Blinker Behaviour
      </p>

      <ParamRow
        label="Pause Lateral on Blinker"
        spKey="BlinkerPauseLateralControl"
        description="BlinkerPauseLateralControl — suspend steering control while the turn signal is active. Gives full manual steering during signalling."
      >
        <Toggle
          checked={lc.blinkerPauseLateral}
          onChange={(v) => setLc("blinkerPauseLateral", v)}
        />
      </ParamRow>

      <ParamRow
        label="Min Speed to Pause Lateral"
        spKey="BlinkerMinLateralControlSpeed"
        description="BlinkerMinLateralControlSpeed — minimum speed at which blinker-pause-lateral activates."
      >
        <Slider
          value={lc.minimumSpeed}
          onChange={(v) => setLc("minimumSpeed", v)}
          min={0}
          max={120}
          step={5}
          decimals={0}
          unit=" kph"
          disabled={!lc.blinkerPauseLateral}
        />
      </ParamRow>

      <ParamRow
        label="Lateral Re-engage Delay"
        spKey="BlinkerLateralReengageDelay"
        description="BlinkerLateralReengageDelay — seconds after the blinker turns off before lateral control re-engages."
      >
        <Slider
          value={lc.blinkerReengageDelay}
          onChange={(v) => setLc("blinkerReengageDelay", v)}
          min={0}
          max={3}
          step={0.1}
          decimals={1}
          unit=" s"
        />
      </ParamRow>

      {/* ─── Steering — Torque ─── */}
      <div className="divider" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Steering — Torque
      </p>

      <ParamRow
        label="Live Torque Parameters"
        spKey="LiveTorqueParamsToggle"
        description="LiveTorqueParamsToggle — continuously learn friction and latAccelFactor from real drive data. Improves accuracy after several drives."
      >
        <Toggle
          checked={lat.liveTorque}
          onChange={(v) => set("liveTorque", v)}
        />
      </ParamRow>

      <ParamRow
        label="Relaxed Learning Rate"
        spKey="LiveTorqueParamsRelaxedToggle"
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
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        LAGD
      </p>

      <ParamRow
        label="LAGD Enabled"
        spKey="LagdToggle"
        description="LagdToggle — estimate the actual hardware steer delay from drive data for more accurate lateral prediction."
      >
        <Toggle
          checked={lat.lagdEnabled}
          onChange={(v) => set("lagdEnabled", v)}
        />
      </ParamRow>

      <ParamRow
        label="LAGD Delay Offset"
        spKey="LagdToggleDelay"
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
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Manual Torque Override
      </p>
      <p className="text-xs text-zinc-600 -mt-2">
        Override the torque controller friction and lateral accel factor. Only
        active when "Torque Override" is enabled below.
      </p>

      <ParamRow
        label="Enable Torque Override"
        spKey="TorqueParamsOverrideEnabled"
        description="TorqueParamsOverrideEnabled — activate manually set friction + latAccelFactor values instead of learned or stock values."
      >
        <Toggle
          checked={lat.torqueOverride.enabled}
          onChange={(v) => setOverride("enabled", v)}
        />
      </ParamRow>

      <ParamRow
        label="Friction Override"
        spKey="ManualTuneFriction"
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

      {/* ─── Steering — Lane Change ─── */}
      <div className="divider" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Steering — Lane Change
      </p>

      <ParamRow
        label="Lane Change Assist"
        description="Enable openpilot-assisted lane changes when the turn signal is held."
      >
        <Toggle checked={lc.enabled} onChange={(v) => setLc("enabled", v)} />
      </ParamRow>

      <ParamRow
        label="Auto Timer"
        spKey="AutoLaneChangeTimer"
        description="AutoLaneChangeTimer — how long the signal must be held before the lane change begins."
      >
        <Select
          value={String(lc.autoTimer)}
          onChange={(v) => setLc("autoTimer", parseInt(v, 10) as typeof lc.autoTimer)}
          options={TIMER_OPTS}
          disabled={!lc.enabled}
        />
      </ParamRow>

      <ParamRow
        label="Blind Spot Monitoring"
        spKey="BlindSpot"
        description="BlindSpot — integrate BSM radar data to block the lane change when a vehicle is detected in the blind spot."
      >
        <Toggle
          checked={lc.bsmMonitoring}
          onChange={(v) => setLc("bsmMonitoring", v)}
          disabled={!lc.enabled}
        />
      </ParamRow>
    </ConfigSection>
  );
};
