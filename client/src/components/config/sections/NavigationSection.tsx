import { Map } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Input } from "../../ui/Input";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

export const NavigationSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const nav = editingConfig.navigation;
  const set = <K extends keyof typeof nav>(k: K, val: (typeof nav)[K]) =>
    updateField("navigation", k, val);

  return (
    <ConfigSection
      id="navigation"
      icon={Map}
      title="Navigation & Maps"
      subtitle="Turn-by-turn navigation, OSM speed data, and map tile settings"
    >
      <ParamRow
        label="Navigation on OpenPilot"
        description="dp_noo — enable Comma/Mapbox turn-by-turn navigation integration. Allows openpilot to follow planned routes autonomously on approved highways."
      >
        <Toggle
          checked={nav.navigationOnOP}
          onChange={(v) => set("navigationOnOP", v)}
        />
      </ParamRow>

      <ParamRow
        label="OSM Integration"
        description="dp_osm — download and use OpenStreetMap data for speed limits, road classifications, and map-based turn speed control"
      >
        <Toggle
          checked={nav.osmEnabled}
          onChange={(v) => set("osmEnabled", v)}
        />
      </ParamRow>

      <ParamRow
        label="Prefer Navigation Speed Limits"
        description="When both navigation data and OSM data provide speed limits, navigation (GPS-based) data takes priority"
      >
        <Toggle
          checked={nav.preferNavSpeedLimits}
          onChange={(v) => set("preferNavSpeedLimits", v)}
          disabled={!nav.navigationOnOP && !nav.osmEnabled}
        />
      </ParamRow>

      <ParamRow
        label="Preload Map Data"
        description="dp_map_data_update_once — download map tiles in advance over WiFi. Reduces latency and data usage on cellular."
      >
        <Toggle
          checked={nav.preloadMaps}
          onChange={(v) => set("preloadMaps", v)}
        />
      </ParamRow>

      <ParamRow
        label="Show Car Distance on Map"
        description="dp_nav_car_distance — overlay the current following distance on the navigation map panel"
      >
        <Toggle
          checked={nav.showNavCarDistance}
          onChange={(v) => set("showNavCarDistance", v)}
        />
      </ParamRow>

      <ParamRow
        label="Custom Mapbox Token"
        description="Override the default Mapbox API token. Leave blank to use the built-in token."
      >
        <Input
          value={nav.mapboxToken}
          onChange={(e) => set("mapboxToken", e.target.value)}
          placeholder="pk.eyJ1IjoieW91ci10…"
          className="font-mono text-xs"
          type="password"
        />
      </ParamRow>
    </ConfigSection>
  );
};
