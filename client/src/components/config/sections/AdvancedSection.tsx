import { Wrench } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Badge } from "../../ui/Badge";
import { Input } from "../../ui/Input";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow, SourceLegend } from "../ConfigSection";

export const AdvancedSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const a = editingConfig.advanced;
  const set = <K extends keyof typeof a>(k: K, val: (typeof a)[K]) =>
    updateField("advanced", k, val);

  return (
    <ConfigSection
      id="advanced"
      icon={Wrench}
      title="Advanced & Debug"
      subtitle="Low-level overrides, SSH access, and developer tools"
      defaultOpen={false}
      badge={<Badge variant="danger">Advanced</Badge>}
    >
      <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 -mt-1">
        Incorrect values here can prevent openpilot from starting or cause
        unexpected behavior. Only modify if you understand the implications.
      </p>

      <SourceLegend />

      <ParamRow
        label="Custom Fingerprint Override"
        source="openpilot"
        description="Force openpilot to identify the car as a specific fingerprint string. Used for testing unsupported vehicles. Leave blank for auto-detection."
      >
        <Input
          value={a.customFingerprint}
          onChange={(e) => set("customFingerprint", e.target.value)}
          placeholder="e.g. TOYOTA COROLLA 2022"
          className="font-mono text-xs"
        />
      </ParamRow>

      <ParamRow
        label="Enable Prebuilt"
        source="openpilot"
        description="dp_prebuilt — use a precompiled openpilot binary instead of compiling on-device. Speeds up boot time significantly but may be out-of-date."
      >
        <Toggle
          checked={a.enablePrebuilt}
          onChange={(v) => set("enablePrebuilt", v)}
        />
      </ParamRow>

      <ParamRow
        label="Extended Logging"
        source="openpilot"
        description="Write verbose debug logs to device storage. Useful for diagnosing issues but increases storage usage and CPU overhead."
      >
        <Toggle
          checked={a.extendedLogging}
          onChange={(v) => set("extendedLogging", v)}
        />
      </ParamRow>

      <ParamRow
        label="Developer Mode"
        source="sunnypilot"
        description="dp_developer_mode — enable device-level developer mode. Unlocks advanced UI options, debug menus, and SSH access."
      >
        <Toggle
          checked={a.dpDeveloperMode}
          onChange={(v) => set("dpDeveloperMode", v)}
        />
      </ParamRow>

      <ParamRow
        label="Assert Safety Model"
        source="openpilot"
        description="Enforce openpilot safety model checks against car firmware. Disable only for bench testing — NEVER on a public road."
      >
        <Toggle
          checked={a.assertSafetyModel}
          onChange={(v) => set("assertSafetyModel", v)}
        />
      </ParamRow>

      <ParamRow
        label="Panda Heartbeat"
        source="openpilot"
        description="PandaHeartbeatDisabled — require panda heartbeat messages to keep openpilot active. Disabling is for development use only."
      >
        <Toggle
          checked={a.pandaHeartbeat}
          onChange={(v) => set("pandaHeartbeat", v)}
        />
      </ParamRow>

      <ParamRow
        label="SSH Public Key"
        source="openpilot"
        description="SSH authorized_keys entry for remote access to the comma device. Paste your public key (e.g. from ~/.ssh/id_rsa.pub)."
      >
        <Input
          value={a.sshPublicKey}
          onChange={(e) => set("sshPublicKey", e.target.value)}
          placeholder="ssh-ed25519 AAAA…"
          className="font-mono text-xs"
        />
      </ParamRow>

      <ParamRow
        label="Custom Boot Logo Path"
        source="sunnypilot"
        description="Path to a custom boot image on device storage (e.g. /data/media/0/custom_boot.png)"
      >
        <Input
          value={a.customBootLogo}
          onChange={(e) => set("customBootLogo", e.target.value)}
          placeholder="/data/media/0/boot.png"
          className="font-mono text-xs"
        />
      </ParamRow>
    </ConfigSection>
  );
};
