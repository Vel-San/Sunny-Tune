import { Monitor } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Select } from "../../ui/Select";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

const SCREEN_OFF_OPTS = [
  { value: "0", label: "Never" },
  { value: "15", label: "15 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "60", label: "1 minute" },
  { value: "120", label: "2 minutes" },
  { value: "300", label: "5 minutes" },
];

const LANG_OPTS = [
  { value: "main_en", label: "English" },
  { value: "main_ko", label: "Korean" },
  { value: "main_ja", label: "Japanese" },
  { value: "main_de", label: "German" },
  { value: "main_es", label: "Spanish" },
  { value: "main_fr", label: "French" },
  { value: "main_pt-BR", label: "Portuguese (Brazil)" },
  { value: "main_it", label: "Italian" },
  { value: "main_nl", label: "Dutch" },
  { value: "main_pl", label: "Polish" },
  { value: "main_tr", label: "Turkish" },
  { value: "main_zh-Hans", label: "Chinese (Simplified)" },
  { value: "main_zh-Hant", label: "Chinese (Traditional)" },
];

const INTERACTIVITY_OPTS = [
  { value: "0", label: "Never" },
  { value: "30", label: "30 seconds" },
  { value: "60", label: "1 minute" },
  { value: "90", label: "1.5 minutes (default)" },
  { value: "120", label: "2 minutes" },
  { value: "300", label: "5 minutes" },
];

export const InterfaceSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const ui = editingConfig.interface;
  const set = <K extends keyof typeof ui>(k: K, val: (typeof ui)[K]) =>
    updateField("interface", k, val);

  return (
    <ConfigSection
      id="visuals"
      icon={Monitor}
      title="Visuals"
      subtitle="HUD overlays and onroad display settings"
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        HUD Overlays
      </p>

      <ParamRow
        label="Developer UI"
        spKey="DevUIInfo"
        description="DevUIInfo — show extended data overlay: speed, acceleration, lead car distance, and lat/long error."
      >
        <Toggle checked={ui.devUI} onChange={(v) => set("devUI", v)} />
      </ParamRow>

      <ParamRow
        label="Standstill Timer"
        spKey="StandstillTimer"
        description="StandstillTimer — display the duration of the current complete stop on the HUD."
      >
        <Toggle
          checked={ui.standstillTimer}
          onChange={(v) => set("standstillTimer", v)}
        />
      </ParamRow>

      <ParamRow
        label="Green Light Alert"
        spKey="GreenLightAlert"
        description="GreenLightAlert — chime and HUD notification when a traffic light ahead turns green."
      >
        <Toggle
          checked={ui.greenLightAlert}
          onChange={(v) => set("greenLightAlert", v)}
        />
      </ParamRow>

      <ParamRow
        label="Lead Depart Alert"
        spKey="LeadDepartAlert"
        description="LeadDepartAlert — alert when the lead vehicle begins moving away while you are stationary."
      >
        <Toggle
          checked={ui.leadDepartAlert}
          onChange={(v) => set("leadDepartAlert", v)}
        />
      </ParamRow>

      <ParamRow
        label="Show Turn Signals"
        spKey="ShowTurnSignals"
        description="ShowTurnSignals — display animated turn signal arrows on the onroad HUD."
      >
        <Toggle
          checked={ui.showTurnSignals}
          onChange={(v) => set("showTurnSignals", v)}
        />
      </ParamRow>

      <ParamRow
        label="Road Name Display"
        spKey="RoadNameToggle"
        description="RoadNameToggle — show the current road name on the HUD using OSM data."
      >
        <Toggle
          checked={ui.roadNameDisplay}
          onChange={(v) => set("roadNameDisplay", v)}
        />
      </ParamRow>

      <ParamRow
        label="Hide Speed on HUD"
        spKey="HideVEgoUI"
        description="HideVEgoUI — remove the vehicle speed (vEgo) readout from the onroad HUD."
      >
        <Toggle
          checked={ui.hideVegoUI}
          onChange={(v) => set("hideVegoUI", v)}
        />
      </ParamRow>

      <ParamRow
        label="Torque Bar"
        spKey="TorqueBar"
        description="TorqueBar — display a visual bar showing the current lateral torque output on the HUD."
      >
        <Toggle checked={ui.torqueBar} onChange={(v) => set("torqueBar", v)} />
      </ParamRow>

      <ParamRow
        label="Show Blind Spot Warnings"
        spKey="BlindSpotDetection"
        description="BlindSpotDetection — display blind spot warning indicators on HUD when vehicles are detected in adjacent lanes."
      >
        <Toggle
          checked={ui.blindSpotHUD}
          onChange={(v) => set("blindSpotHUD", v)}
        />
      </ParamRow>

      <ParamRow
        label="Steering Arc"
        spKey="SteeringArc"
        description="SteeringArc — show a steering arc overlay indicating the projected path based on current steering angle."
      >
        <Toggle
          checked={ui.steeringArc}
          onChange={(v) => set("steeringArc", v)}
        />
      </ParamRow>

      <ParamRow
        label="Display True Speed"
        spKey="TrueVEgoUI"
        description="TrueVEgoUI — always display GPS-based true ground speed instead of odometer speed on the HUD."
      >
        <Toggle
          checked={ui.trueVegoUI}
          onChange={(v) => set("trueVegoUI", v)}
        />
      </ParamRow>

      <ParamRow
        label="Metrics Below Chevron"
        spKey="ChevronInfo"
        description="ChevronInfo — display additional metrics (distance to lead, speed delta) below the lead-car chevron."
      >
        <Toggle
          checked={ui.chevronInfo}
          onChange={(v) => set("chevronInfo", v)}
        />
      </ParamRow>

      <ParamRow
        label="Tesla Rainbow Mode"
        spKey="RainbowMode"
        description="RainbowMode — enable Rainbow Mode on Tesla vehicles (cosmetic steering wheel colour effect only)."
      >
        <Toggle
          checked={ui.rainbowMode}
          onChange={(v) => set("rainbowMode", v)}
        />
      </ParamRow>

      <div className="divider" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Display
      </p>

      <ParamRow
        label="Screen Brightness"
        spKey="Brightness"
        description="Brightness — onroad screen brightness 0–100%."
      >
        <Slider
          value={ui.screenBrightness}
          onChange={(v) => set("screenBrightness", v)}
          min={0}
          max={100}
          step={5}
          decimals={0}
          unit="%"
        />
      </ParamRow>

      <ParamRow
        label="Screen Off Timer"
        spKey="OnroadScreenOffTimer"
        description="OnroadScreenOffTimer — dim the screen after an idle period while driving."
      >
        <Select
          value={String(ui.screenOffTimer)}
          onChange={(v) => set("screenOffTimer", parseInt(v))}
          options={SCREEN_OFF_OPTS}
        />
      </ParamRow>

      <ParamRow
        label="Interactivity Timeout"
        spKey="InteractivityTimer"
        description="InteractivityTimer — seconds of inactivity before the HUD becomes non-interactive."
      >
        <Select
          value={String(ui.interactivityTimeout)}
          onChange={(v) => set("interactivityTimeout", parseInt(v))}
          options={INTERACTIVITY_OPTS}
        />
      </ParamRow>

      <ParamRow
        label="Real-time Accel Bar"
        spKey="RealTimeAccelBar"
        description="RealTimeAccelBar — show a live acceleration/deceleration bar on the HUD."
      >
        <Toggle
          checked={ui.realTimeAccelBar}
          onChange={(v) => set("realTimeAccelBar", v)}
        />
      </ParamRow>

      <ParamRow
        label="Language"
        spKey="LanguageSetting"
        description="LanguageSetting — language used for all text in the sunnypilot onroad UI."
      >
        <Select
          value={ui.language}
          onChange={(v) => set("language", v)}
          options={LANG_OPTS}
        />
      </ParamRow>
    </ConfigSection>
  );
};
