import { GitBranch } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Badge } from "../../ui/Badge";
import { NumberInput } from "../../ui/NumberInput";
import { RadioGroup } from "../../ui/RadioGroup";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

const METHOD_OPTS = [
  {
    value: "torque",
    label: "Torque",
    description:
      "Default SP controller — uses torque-based model with friction & lat accel factor",
  },
  {
    value: "pid",
    label: "PID",
    description:
      "Classic Proportional-Integral-Derivative with feed-forward (kp, ki, kf)",
  },
  {
    value: "indi",
    label: "INDI",
    description:
      "Incremental Non-linear Dynamic Inversion — adaptive, smooth at limits",
  },
  {
    value: "lqr",
    label: "LQR",
    description:
      "Linear Quadratic Regulator — optimal for vehicles with good physics models",
  },
];

export const LateralControlSection: React.FC = () => {
  const { editingConfig, updateField, updateSection } = useConfigStore();
  const lat = editingConfig.lateral;
  const set = <K extends keyof typeof lat>(k: K, val: (typeof lat)[K]) =>
    updateField("lateral", k, val);

  const setTorque = (k: keyof typeof lat.torque, v: number | boolean) =>
    updateSection("lateral", { ...lat, torque: { ...lat.torque, [k]: v } });
  const setPID = (k: keyof typeof lat.pid, v: number) =>
    updateSection("lateral", { ...lat, pid: { ...lat.pid, [k]: v } });
  const setINDI = (k: keyof typeof lat.indi, v: number) =>
    updateSection("lateral", { ...lat, indi: { ...lat.indi, [k]: v } });
  const setLQR = (k: keyof typeof lat.lqr, v: number) =>
    updateSection("lateral", { ...lat, lqr: { ...lat.lqr, [k]: v } });

  return (
    <ConfigSection
      id="lateral"
      icon={GitBranch}
      title="Lateral Control"
      subtitle="Steering algorithm, actuator tuning, and angle corrections"
      badge={<Badge variant="primary">{lat.method.toUpperCase()}</Badge>}
    >
      <ParamRow
        label="Control Method"
        description="dp_lat_ctrl_type — the algorithm used to compute steering commands"
        wide
      >
        <RadioGroup
          name="lat-method"
          value={lat.method}
          onChange={(v) => set("method", v as typeof lat.method)}
          options={METHOD_OPTS}
          layout="vertical"
        />
      </ParamRow>

      {/* ─── Torque ─── */}
      {lat.method === "torque" && (
        <>
          <div className="divider" />
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Torque Parameters
          </p>
          <ParamRow
            label="Friction"
            description="dp_lat_torque_friction — rolling friction compensation (0.01–0.5)"
          >
            <Slider
              value={lat.torque.friction}
              onChange={(v) => setTorque("friction", v)}
              min={0.01}
              max={0.5}
              step={0.01}
              decimals={2}
            />
          </ParamRow>
          <ParamRow
            label="Lat Accel Factor"
            description="dp_lat_lat_accel_factor — scales how much lateral acceleration is requested (1.0–4.0)"
          >
            <Slider
              value={lat.torque.latAccelFactor}
              onChange={(v) => setTorque("latAccelFactor", v)}
              min={1.0}
              max={4.0}
              step={0.05}
              decimals={2}
            />
          </ParamRow>
          <ParamRow
            label="Actuator Delay"
            description="dp_lat_steer_actuator_delay — hardware steering response delay (0–0.5s)"
          >
            <Slider
              value={lat.torque.steerActuatorDelay}
              onChange={(v) => setTorque("steerActuatorDelay", v)}
              min={0.0}
              max={0.5}
              step={0.01}
              unit="s"
              decimals={2}
            />
          </ParamRow>
          <ParamRow
            label="Steer Limit Timer"
            description="Time (s) before steer error resets after limit exceeded"
          >
            <Slider
              value={lat.torque.steerLimitTimer}
              onChange={(v) => setTorque("steerLimitTimer", v)}
              min={0.1}
              max={5.0}
              step={0.1}
              unit="s"
              decimals={1}
            />
          </ParamRow>
          <ParamRow
            label="Use Neural Network Model"
            description="Replace rule-based torque model with on-device trained NN lateral model"
          >
            <Toggle
              checked={lat.torque.useNNModel}
              onChange={(v) => setTorque("useNNModel", v)}
            />
          </ParamRow>
        </>
      )}

      {/* ─── PID ─── */}
      {lat.method === "pid" && (
        <>
          <div className="divider" />
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            PID Parameters
          </p>
          <ParamRow
            label="Kp High Speed"
            description="Proportional gain at highway speed"
          >
            <Slider
              value={lat.pid.kpHighSpeed}
              onChange={(v) => setPID("kpHighSpeed", v)}
              min={0.1}
              max={2.0}
              step={0.01}
              decimals={2}
            />
          </ParamRow>
          <ParamRow
            label="Kp Low Speed"
            description="Proportional gain at low/city speed"
          >
            <Slider
              value={lat.pid.kpLowSpeed}
              onChange={(v) => setPID("kpLowSpeed", v)}
              min={0.1}
              max={2.0}
              step={0.01}
              decimals={2}
            />
          </ParamRow>
          <ParamRow
            label="Ki High Speed"
            description="Integral gain at highway speed — corrects persistent errors"
          >
            <Slider
              value={lat.pid.kiHighSpeed}
              onChange={(v) => setPID("kiHighSpeed", v)}
              min={0.001}
              max={0.2}
              step={0.001}
              decimals={3}
            />
          </ParamRow>
          <ParamRow label="Ki Low Speed">
            <Slider
              value={lat.pid.kiLowSpeed}
              onChange={(v) => setPID("kiLowSpeed", v)}
              min={0.001}
              max={0.2}
              step={0.001}
              decimals={3}
            />
          </ParamRow>
          <ParamRow
            label="Kf (Feed-forward)"
            description="Feed-forward gain — look-ahead steering correction"
          >
            <Slider
              value={lat.pid.kf}
              onChange={(v) => setPID("kf", v)}
              min={0.00001}
              max={0.0002}
              step={0.000005}
              decimals={7}
            />
          </ParamRow>
          <ParamRow label="Actuator Delay">
            <Slider
              value={lat.pid.steerActuatorDelay}
              onChange={(v) => setPID("steerActuatorDelay", v)}
              min={0.0}
              max={0.5}
              step={0.01}
              unit="s"
              decimals={2}
            />
          </ParamRow>
          <ParamRow label="Steer Limit Timer">
            <Slider
              value={lat.pid.steerLimitTimer}
              onChange={(v) => setPID("steerLimitTimer", v)}
              min={0.1}
              max={5.0}
              step={0.1}
              unit="s"
              decimals={1}
            />
          </ParamRow>
        </>
      )}

      {/* ─── INDI ─── */}
      {lat.method === "indi" && (
        <>
          <div className="divider" />
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            INDI Parameters
          </p>
          <ParamRow
            label="Inner Loop Gain"
            description="Controls responsiveness of the inner feedback loop (1–10)"
          >
            <Slider
              value={lat.indi.innerLoopGain}
              onChange={(v) => setINDI("innerLoopGain", v)}
              min={1.0}
              max={10.0}
              step={0.1}
              decimals={1}
            />
          </ParamRow>
          <ParamRow
            label="Outer Loop Gain"
            description="Controls the outer reference tracking loop (1–10)"
          >
            <Slider
              value={lat.indi.outerLoopGain}
              onChange={(v) => setINDI("outerLoopGain", v)}
              min={1.0}
              max={10.0}
              step={0.1}
              decimals={1}
            />
          </ParamRow>
          <ParamRow
            label="Time Constant"
            description="Controller time constant — larger = smoother (0.5–5.0)"
          >
            <Slider
              value={lat.indi.timeConstant}
              onChange={(v) => setINDI("timeConstant", v)}
              min={0.5}
              max={5.0}
              step={0.1}
              decimals={1}
            />
          </ParamRow>
          <ParamRow
            label="Actuator Effectiveness"
            description="How effectively steering commands translate to actual wheel movement (0.5–3.0)"
          >
            <Slider
              value={lat.indi.actuatorEffectiveness}
              onChange={(v) => setINDI("actuatorEffectiveness", v)}
              min={0.5}
              max={3.0}
              step={0.05}
              decimals={2}
            />
          </ParamRow>
          <ParamRow label="Actuator Delay">
            <Slider
              value={lat.indi.steerActuatorDelay}
              onChange={(v) => setINDI("steerActuatorDelay", v)}
              min={0.0}
              max={0.5}
              step={0.01}
              unit="s"
              decimals={2}
            />
          </ParamRow>
          <ParamRow label="Steer Limit Timer">
            <Slider
              value={lat.indi.steerLimitTimer}
              onChange={(v) => setINDI("steerLimitTimer", v)}
              min={0.1}
              max={5.0}
              step={0.1}
              unit="s"
              decimals={1}
            />
          </ParamRow>
        </>
      )}

      {/* ─── LQR ─── */}
      {lat.method === "lqr" && (
        <>
          <div className="divider" />
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            LQR Parameters
          </p>
          <ParamRow
            label="Scale"
            description="Global tuning scale factor (1000–5000)"
          >
            <NumberInput
              value={lat.lqr.scale}
              onChange={(v) => setLQR("scale", v)}
              min={500}
              max={5000}
              step={50}
              decimals={0}
            />
          </ParamRow>
          <ParamRow label="Ki" description="Integral gain">
            <Slider
              value={lat.lqr.ki}
              onChange={(v) => setLQR("ki", v)}
              min={0.001}
              max={0.1}
              step={0.001}
              decimals={3}
            />
          </ParamRow>
          <ParamRow label="A[0]">
            <Slider
              value={lat.lqr.a0}
              onChange={(v) => setLQR("a0", v)}
              min={-2}
              max={2}
              step={0.001}
              decimals={3}
            />
          </ParamRow>
          <ParamRow label="A[1]">
            <Slider
              value={lat.lqr.a1}
              onChange={(v) => setLQR("a1", v)}
              min={-2}
              max={2}
              step={0.001}
              decimals={3}
            />
          </ParamRow>
          <ParamRow label="B[0]">
            <Slider
              value={lat.lqr.b0}
              onChange={(v) => setLQR("b0", v)}
              min={-1}
              max={1}
              step={0.0001}
              decimals={4}
            />
          </ParamRow>
          <ParamRow label="B[1]">
            <Slider
              value={lat.lqr.b1}
              onChange={(v) => setLQR("b1", v)}
              min={-1}
              max={1}
              step={0.0001}
              decimals={4}
            />
          </ParamRow>
          <ParamRow label="Actuator Delay">
            <Slider
              value={lat.lqr.steerActuatorDelay}
              onChange={(v) => setLQR("steerActuatorDelay", v)}
              min={0.0}
              max={0.5}
              step={0.01}
              unit="s"
              decimals={2}
            />
          </ParamRow>
          <ParamRow label="Steer Limit Timer">
            <Slider
              value={lat.lqr.steerLimitTimer}
              onChange={(v) => setLQR("steerLimitTimer", v)}
              min={0.1}
              max={5.0}
              step={0.1}
              unit="s"
              decimals={1}
            />
          </ParamRow>
        </>
      )}

      {/* ─── Common ─── */}
      <div className="divider" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Common Parameters
      </p>
      <ParamRow
        label="Steer Rate Cost"
        description="Penalises rapid steering rate changes — higher = smoother but slower (0.01–1.0)"
      >
        <Slider
          value={lat.steerRateCost}
          onChange={(v) => set("steerRateCost", v)}
          min={0.01}
          max={1.0}
          step={0.01}
          decimals={2}
        />
      </ParamRow>
      <ParamRow
        label="Steering Angle Deadzone"
        description="Angle below which no correction is applied — eliminates microsteering (0–5°)"
      >
        <Slider
          value={lat.steeringAngleDeadzone}
          onChange={(v) => set("steeringAngleDeadzone", v)}
          min={0.0}
          max={5.0}
          step={0.1}
          unit="°"
          decimals={1}
        />
      </ParamRow>
      <ParamRow
        label="Steer Angle Offset"
        description="Static offset to correct persistent left/right pull (−3 to +3°)"
      >
        <Slider
          value={lat.steerAngleOffset}
          onChange={(v) => set("steerAngleOffset", v)}
          min={-3.0}
          max={3.0}
          step={0.1}
          unit="°"
          decimals={1}
        />
      </ParamRow>
      <ParamRow
        label="Custom Steering Ratio"
        description="Override car default steering ratio. Set to 0 to use factory value."
      >
        <NumberInput
          value={lat.customSteeringRatio ?? 0}
          onChange={(v) => set("customSteeringRatio", v === 0 ? null : v)}
          min={0}
          max={30}
          step={0.1}
          decimals={1}
          unit=""
        />
      </ParamRow>
      <ParamRow
        label="Reset Steering on LM Lost"
        description="Reset lateral control when lane markings are no longer visible"
      >
        <Toggle
          checked={lat.resetSteeringOnLM}
          onChange={(v) => set("resetSteeringOnLM", v)}
        />
      </ParamRow>
      <ParamRow
        label="Auto-Tune Lateral"
        description="Continuously refine lateral tuning using on-device drive data (experimental)"
      >
        <Toggle checked={lat.autoTune} onChange={(v) => set("autoTune", v)} />
      </ParamRow>
    </ConfigSection>
  );
};
