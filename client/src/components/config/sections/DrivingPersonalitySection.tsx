import { Gauge } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { RadioGroup } from "../../ui/RadioGroup";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

const LONG_PERSONALITY_OPTS = [
  {
    value: "relaxed",
    label: "Relaxed",
    description: "Smooth acceleration, larger follow gap — ideal for comfort",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced behavior matching most driving conditions",
  },
  {
    value: "aggressive",
    label: "Aggressive",
    description: "Quicker acceleration, tighter gap — sport feel",
  },
];

const PROFILE_OPTS = [
  {
    value: "eco",
    label: "Eco",
    description: "Minimal acceleration, maximum efficiency",
  },
  { value: "normal", label: "Normal", description: "Balanced default" },
  {
    value: "sport",
    label: "Sport",
    description: "Responsive acceleration and tighter follow distance",
  },
  {
    value: "traffic",
    label: "Traffic",
    description: "Dynamic gap adjustment for dense stop-and-go traffic",
  },
];

export const DrivingPersonalitySection: React.FC = () => {
  const { editingConfig, updateField, updateSection } = useConfigStore();
  const d = editingConfig.drivingPersonality;
  const set = <K extends keyof typeof d>(k: K, val: (typeof d)[K]) =>
    updateField("drivingPersonality", k, val);

  const setProfileTune = (
    profile: "eco" | "normal" | "sport",
    key: keyof typeof d.eco,
    val: number,
  ) => {
    updateSection("drivingPersonality", {
      ...d,
      [profile]: { ...d[profile], [key]: val },
    });
  };

  return (
    <ConfigSection
      id="driving-personality"
      icon={Gauge}
      title="Driving Personality"
      subtitle="Acceleration profiles, follow distance, and longitudinal behavior"
    >
      <ParamRow
        label="Active Profile"
        description="The driving personality applied when openpilot is engaged. Switch on-device during a drive."
        wide
      >
        <RadioGroup
          name="active-profile"
          value={d.activeProfile}
          onChange={(v) => set("activeProfile", v as typeof d.activeProfile)}
          options={PROFILE_OPTS}
          layout="horizontal"
        />
      </ParamRow>

      <ParamRow
        label="Longitudinal Personality"
        description="Comma AI's coarse-level longitudinal tuning layer applied on top of your profile."
        wide
      >
        <RadioGroup
          name="long-personality"
          value={d.longitudinalPersonality}
          onChange={(v) =>
            set(
              "longitudinalPersonality",
              v as typeof d.longitudinalPersonality,
            )
          }
          options={LONG_PERSONALITY_OPTS}
          layout="vertical"
        />
      </ParamRow>

      <ParamRow
        label="Traffic Mode"
        description="dp_trafficd — dynamically shrinks follow gap in dense stop-and-go traffic. Requires SP longitudinal."
      >
        <Toggle
          checked={d.trafficMode}
          onChange={(v) => set("trafficMode", v)}
        />
      </ParamRow>

      <ParamRow
        label="Smooth Deceleration on Curves"
        description="Apply gentle braking ahead of detected curves using vision data."
      >
        <Toggle
          checked={d.smoothDecelerationOnCurves}
          onChange={(v) => set("smoothDecelerationOnCurves", v)}
        />
      </ParamRow>

      {/* Per-profile tuning */}
      {(["eco", "normal", "sport"] as const).map((profile) => (
        <div key={profile} className="space-y-3 pt-2 border-t border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 capitalize">
            {profile} Profile Tune
          </p>
          <ParamRow
            label="Max Acceleration"
            description={`dp_long_accel_profile — rising acceleration cap for ${profile} mode`}
          >
            <Slider
              value={d[profile].accelMax}
              onChange={(v) => setProfileTune(profile, "accelMax", v)}
              min={0.1}
              max={3.5}
              step={0.05}
              unit=" m/s²"
              decimals={2}
            />
          </ParamRow>
          <ParamRow
            label="Max Deceleration"
            description={`Braking cap for ${profile} mode`}
          >
            <Slider
              value={d[profile].decelMax}
              onChange={(v) => setProfileTune(profile, "decelMax", v)}
              min={0.5}
              max={4.0}
              step={0.05}
              unit=" m/s²"
              decimals={2}
            />
          </ParamRow>
          <ParamRow
            label="Follow Gap"
            description="Time headway to lead vehicle (seconds)"
          >
            <Slider
              value={d[profile].followGap}
              onChange={(v) => setProfileTune(profile, "followGap", v)}
              min={0.8}
              max={2.5}
              step={0.05}
              unit="s"
              decimals={2}
            />
          </ParamRow>
        </div>
      ))}
    </ConfigSection>
  );
};
