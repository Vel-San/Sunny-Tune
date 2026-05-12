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

const BRIGHTNESS_DELAY_OPTS = [
  { value: "0", label: "Immediate (default)" },
  { value: "1", label: "1 second" },
  { value: "2", label: "2 seconds" },
  { value: "5", label: "5 seconds" },
  { value: "10", label: "10 seconds" },
  { value: "20", label: "20 seconds" },
  { value: "30", label: "30 seconds" },
];

const LANG_OPTS = [
  { value: "en", label: "English" },
  { value: "ko", label: "Korean" },
  { value: "ja", label: "Japanese" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "it", label: "Italian" },
  { value: "nl", label: "Dutch" },
  { value: "pl", label: "Polish" },
  { value: "tr", label: "Turkish" },
  { value: "zh-Hans", label: "Chinese (Simplified)" },
  { value: "zh-Hant", label: "Chinese (Traditional)" },
];

const INTERACTIVITY_OPTS = [
  { value: "0", label: "Default" },
  { value: "10", label: "10 seconds" },
  { value: "20", label: "20 seconds" },
  { value: "30", label: "30 seconds (default)" },
  { value: "60", label: "1 minute" },
  { value: "120", label: "2 minutes" },
  { value: "300", label: "5 minutes" },
];

const CHEVRON_OPTS = [
  { value: "0", label: "Off" },
  { value: "1", label: "Distance" },
  { value: "2", label: "Speed" },
  { value: "3", label: "Time" },
  { value: "4", label: "All" },
];

const METRICS_POSITION_OPTS = [
  { value: "0", label: "Off" },
  { value: "1", label: "Bottom" },
  { value: "2", label: "Right" },
  { value: "3", label: "Right & Bottom" },
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
        label="Steering Arc (Torque Bar)"
        spKey="TorqueBar"
        description="TorqueBar — display steering arc on the driving screen when lateral control is enabled."
      >
        <Toggle checked={ui.torqueBar} onChange={(v) => set("torqueBar", v)} />
      </ParamRow>

      <ParamRow
        label="Show Blind Spot Warnings"
        spKey="BlindSpot"
        description="BlindSpot — display blind spot warning indicators on the HUD as long as your car has BSM supported."
      >
        <Toggle
          checked={ui.blindSpotHUD}
          onChange={(v) => set("blindSpotHUD", v)}
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
        description="ChevronInfo — display additional metrics below the lead-car chevron. Off = hidden, Distance = gap to lead, Speed = relative speed, Time = time gap, All = all metrics."
      >
        <Select
          value={String(ui.chevronInfo)}
          onChange={(v) => set("chevronInfo", parseInt(v) as 0 | 1 | 2 | 3 | 4)}
          options={CHEVRON_OPTS}
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
        label="Brightness Delay"
        spKey="OnroadBrightnessDelay"
        description="OnroadBrightnessDelay — delay before the onroad brightness change takes effect."
      >
        <Select
          value={String(ui.screenBrightnessDelay)}
          onChange={(v) => set("screenBrightnessDelay", parseInt(v))}
          options={BRIGHTNESS_DELAY_OPTS}
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
        spKey="InteractivityTimeout"
        description="InteractivityTimeout — time after which the settings UI closes automatically if the user is not interacting with the screen."
      >
        <Select
          value={String(ui.interactivityTimeout)}
          onChange={(v) => set("interactivityTimeout", parseInt(v))}
          options={INTERACTIVITY_OPTS}
        />
      </ParamRow>

      <ParamRow
        label="Real-time Accel Bar"
        spKey="RocketFuel"
        description="RocketFuel — show an indicator on the left side of the screen to display real-time vehicle acceleration and deceleration. This displays what the car is currently doing, not what the planner is requesting."
      >
        <Toggle
          checked={ui.realTimeAccelBar}
          onChange={(v) => set("realTimeAccelBar", v)}
        />
      </ParamRow>

      <ParamRow
        label="Display Metrics Position"
        spKey="DisplayMetricsPosition"
        description="DisplayMetricsPosition — choose where extended metrics from various sources are displayed on the HUD."
      >
        <Select
          value={String(ui.displayMetricsPosition)}
          onChange={(v) =>
            set("displayMetricsPosition", parseInt(v) as 0 | 1 | 2 | 3)
          }
          options={METRICS_POSITION_OPTS}
        />
      </ParamRow>

      <ParamRow
        label="UI Debug Mode"
        spKey="ShowDebugInfo"
        description="ShowDebugInfo — enable the UI debug info overlay."
      >
        <Toggle
          checked={ui.showDebugInfo}
          onChange={(v) => set("showDebugInfo", v)}
        />
      </ParamRow>

      <ParamRow
        label="Record Microphone Audio"
        spKey="RecordAudio"
        description="RecordAudio — record and upload microphone audio while driving. The audio will be included in the dashcam video in comma connect."
      >
        <Toggle
          checked={ui.recordAudio}
          onChange={(v) => set("recordAudio", v)}
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
