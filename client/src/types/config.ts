// ─── Enumerations ────────────────────────────────────────────────────────────

export type SPBranch = "stable-sp" | "dev-sp" | "staging-sp" | "nightly";

export type CommaHardware = "comma4" | "comma3x" | "comma3";

export type CarMake =
  | "toyota"
  | "lexus"
  | "honda"
  | "acura"
  | "hyundai"
  | "kia"
  | "genesis"
  | "gm"
  | "ford"
  | "lincoln"
  | "chrysler"
  | "jeep"
  | "ram"
  | "volkswagen"
  | "audi"
  | "subaru"
  | "mazda"
  | "nissan"
  | "infiniti"
  | "other";

/**
 * SpeedLimitOffsetType — how the speed offset above the limit is calculated.
 * none = match limit exactly, fixed = fixed value added/subtracted, percentage = % of limit.
 */
export type SLCOffsetType = "none" | "fixed" | "percentage";

export type LongPersonality = "relaxed" | "standard" | "aggressive";

// ─── Main config type ────────────────────────────────────────────────────────

export interface SPConfig {
  /** App metadata (not sent to device) */
  metadata: {
    sunnypilotVersion: string;
    branch: SPBranch;
    /** Active driving model — ModelManager_ActiveBundle (model name/path) */
    activeModel: string;
    /**
     * Comma AI hardware device. Optional — absent on configs created before
     * this field was added; treat missing value as "unknown".
     */
    hardware?: CommaHardware;
  };

  // ── 1. Vehicle ─────────────────────────────────────────────────────────────
  vehicle: {
    make: CarMake;
    model: string;
    year: number;
  };

  // ── 2. Driving Personality ────────────────────────────────────────────────
  drivingPersonality: {
    /** Comma AI longitudinal personality — coarse follow-distance + accel tuning */
    longitudinalPersonality: LongPersonality;
  };

  // ── 3. Lateral Control (Steering) ─────────────────────────────────────────
  lateral: {
    /** Camera lateral offset from lane centre (−0.3 to +0.3 m) — CameraOffset */
    cameraOffset: number;
    /** Live torque parameter estimation from drive data — LiveTorqueParamsToggle */
    liveTorque: boolean;
    /** Slower learning rate for live torque updates — LiveTorqueParamsRelaxedToggle */
    liveTorqueRelaxed: boolean;
    /** Torque tuning preset: 0=Comma stock, 1=SP, 2=SP+ — TorqueControlTune */
    torqueControlTune: 0 | 1 | 2;
    /** Live Actuator Group Delay (LAGD) estimation — LagdToggle */
    lagdEnabled: boolean;
    /** LAGD manual delay offset in seconds — LagdToggleDelay */
    lagdDelay: number;
    /** Use on-device trained NN lateral model — NeuralNetworkLateralControl */
    useNNModel: boolean;
    /** Force torque-based controller (disable stock lateral) — EnforceTorqueControl */
    enforceTorqueControl: boolean;
    /** Manual torque parameter overrides */
    torqueOverride: {
      /** Enable manual override — TorqueParamsOverrideEnabled */
      enabled: boolean;
      /** Friction override (0.01–0.5) — TorqueParamsOverrideFriction */
      friction: number;
      /** Lat accel factor override (1.0–4.0) — TorqueParamsOverrideLatAccelFactor */
      latAccelFactor: number;
    };
  };

  // ── 4. Longitudinal Control ───────────────────────────────────────────────
  longitudinal: {
    /** Enable Comma E2E (end-to-end neural net) longitudinal — ExperimentalMode */
    e2eEnabled: boolean;
    /** Auto-switch to E2E based on road conditions — DynamicExperimentalControl */
    dynamicE2E: boolean;
    /** Alpha longitudinal: next-gen SP improvements — AlphaLongitudinalEnabled */
    alphaLongEnabled: boolean;
    /** Hyundai/Kia/Genesis tuning preset: 0=stock, 1=SP, 2=SP+ — HyundaiLongitudinalTuning */
    hyundaiLongTune: 0 | 1 | 2;
    /** Planplus longitudinal planner — PlanplusControl */
    planplusEnabled: boolean;
    /** Replace stock ACC increment steps — CustomAccIncrementsEnabled */
    customAccEnabled: boolean;
    /** Short-press increment (km/h) — CustomAccShortPressIncrement */
    customAccShort: number;
    /** Long-press increment (km/h) — CustomAccLongPressIncrement */
    customAccLong: number;
  };

  // ── 5. Speed Control ──────────────────────────────────────────────────────
  speedControl: {
    speedLimitControl: {
      /**
       * SpeedLimitMode — how sunnypilot responds to detected speed limits.
       * 0 = Off, 1 = Info (HUD display only), 2 = Warning (display + alert),
       * 3 = Assist (auto-adjust cruise speed, with optional offset).
       */
      mode: 0 | 1 | 2 | 3;
      /**
       * SpeedLimitSource — which data source(s) provide the speed limit.
       * 0 = Car State Only, 1 = Map Data Only, 2 = Car State Priority,
       * 3 = Map Data Priority, 4 = Combined (higher of both).
       */
      policy: number;
      /** SpeedLimitOffsetType — offset calculation method — SpeedLimitOffsetType */
      offsetType: SLCOffsetType;
      /** SpeedLimitValueOffset — offset amount (−30 to +30) — SpeedLimitValueOffset */
      offsetValue: number;
    };
    /** Enable vision-based curve speed control — SmartCruiseControlVision */
    visionEnabled: boolean;
    /** Enable map-based curve speed control — SmartCruiseControlMap */
    mapEnabled: boolean;
    /** Intelligent Cruise Button Management (Alpha) — IntelligentCruiseButtonManagement */
    icbmEnabled: boolean;
  };

  // ── 6. Lane Change ────────────────────────────────────────────────────────
  laneChange: {
    /** Enable openpilot-assisted lane changes */
    enabled: boolean;
    /**
     * AutoLaneChangeTimer — SP integer enum:
     * -1=Off, 0=Nudge, 1=Nudgeless, 2=0.5s, 3=1s, 4=2s, 5=3s
     */
    autoTimer: -1 | 0 | 1 | 2 | 3 | 4 | 5;
    /** Minimum speed for assisted lane change (kph) — BlinkerMinLateralControlSpeed */
    minimumSpeed: number;
    /** Use car's BSM radar to block unsafe lane changes — BlindSpot */
    bsmMonitoring: boolean;
    /** Pause lateral control while blinker is active — BlinkerPauseLateralControl */
    blinkerPauseLateral: boolean;
    /** Seconds before lateral re-engages after blinker off — BlinkerLateralReengageDelay */
    blinkerReengageDelay: number;
  };

  // ── 7. Navigation ─────────────────────────────────────────────────────────
  navigation: {
    /** Use OSM map data for speed limits and road info — OsmLocal */
    osmEnabled: boolean;
  };

  // ── 8. Interface & Display ────────────────────────────────────────────────
  interface: {
    /** Display metric units (km/h, km) — IsMetric */
    useMetric: boolean;
    /** Show standstill duration timer on HUD — StandstillTimer */
    standstillTimer: boolean;
    /** Screen brightness 0–100 — Brightness */
    screenBrightness: number;
    /** Screen off timer in seconds (0=never) — OnroadScreenOffTimer */
    screenOffTimer: number;
    /** Show extended developer data overlay — DevUIInfo */
    devUI: boolean;
    /** Prevent uploads while driving — OnroadUploads (inverted) */
    disableOnroadUploads: boolean;
    /** Alert when traffic light turns green — GreenLightAlert */
    greenLightAlert: boolean;
    /** Alert when lead vehicle starts moving — LeadDepartAlert */
    leadDepartAlert: boolean;
    /** Keep driver monitoring active when ACC is off — AlwaysOnDM */
    alwaysOnDM: boolean;
    /** Show turn signal arrows on HUD — ShowTurnSignals */
    showTurnSignals: boolean;
    /** Show current road name on HUD — RoadNameToggle */
    roadNameDisplay: boolean;
    /** Suppress non-critical audio chimes — QuietMode */
    quietMode: boolean;
    /** Hide vehicle speed from HUD — HideVEgoUI */
    hideVegoUI: boolean;
    /** Show GPS-based true speed instead of odometer — TrueVEgoUI */
    trueVegoUI: boolean;
    /** Show lateral torque bar on HUD — TorqueBar */
    torqueBar: boolean;
    /** Show blind spot warning indicators on HUD — BlindSpotDetection */
    blindSpotHUD: boolean;
    /** Show steering arc overlay on HUD — SteeringArc */
    steeringArc: boolean;
    /** Display metrics below the lead car chevron — ChevronInfo */
    chevronInfo: boolean;
    /** Enable Tesla Rainbow Mode (cosmetic) — RainbowMode */
    rainbowMode: boolean;
  };

  // ── 9. Comma AI Core ──────────────────────────────────────────────────────
  commaAI: {
    /** Record all three cameras to onboard storage — RecordFront */
    recordDrives: boolean;
    /** Restrict uploads to WiFi only — GsmMetered */
    uploadOnlyOnWifi: boolean;
    /** Disengage when accelerator is pressed — DisengageOnAccelerator */
    disengageOnAccelerator: boolean;
    /** Audible chime on unintended lane departure — IsLdwEnabled */
    ldwEnabled: boolean;
    /** Enable SunnyLink cloud connection — SunnylinkEnabled */
    connectEnabled: boolean;
    /** MADS: lateral assist independent of ACC — Mads */
    mads: boolean;
    /** Allow main cruise button to toggle MADS — MadsMainCruiseAllowed */
    madsMainCruise: boolean;
    /** MADS steering mode on brake pedal: 0=Remain Active, 1=Pause, 2=Disengage — MadsSteeringMode */
    madsSteeringMode: 0 | 1 | 2;
    /** Single button engages MADS + ACC together — MadsUnifiedEngagementMode */
    madsUnifiedEngagement: boolean;
    /** Record cabin audio with drive footage — RecordAudioFeedback */
    recordAudioFeedback: boolean;
  };

  // ── 10. Advanced ──────────────────────────────────────────────────────────
  advanced: {
    /** Skip boot animation for faster startup — QuickBootToggle */
    quickBoot: boolean;
  };
}

// ─── Default config factory ───────────────────────────────────────────────────

export function createDefaultConfig(): SPConfig {
  return {
    metadata: {
      sunnypilotVersion: "2026.001.000",
      branch: "stable-sp",
      activeModel: "",
    },
    vehicle: {
      make: "toyota",
      model: "",
      year: 2023,
    },
    drivingPersonality: {
      longitudinalPersonality: "standard",
    },
    lateral: {
      cameraOffset: 0,
      liveTorque: true,
      liveTorqueRelaxed: true,
      torqueControlTune: 1,
      lagdEnabled: true,
      lagdDelay: 0.2,
      useNNModel: false,
      enforceTorqueControl: false,
      torqueOverride: {
        enabled: false,
        friction: 0.1,
        latAccelFactor: 2.5,
      },
    },
    longitudinal: {
      e2eEnabled: false,
      dynamicE2E: false,
      alphaLongEnabled: false,
      hyundaiLongTune: 0,
      planplusEnabled: false,
      customAccEnabled: false,
      customAccShort: 1,
      customAccLong: 5,
    },
    speedControl: {
      speedLimitControl: {
        mode: 0,
        policy: 2,
        offsetType: "none",
        offsetValue: 0,
      },
      visionEnabled: false,
      mapEnabled: false,
      icbmEnabled: false,
    },
    laneChange: {
      enabled: true,
      autoTimer: 0,
      minimumSpeed: 20,
      bsmMonitoring: false,
      blinkerPauseLateral: false,
      blinkerReengageDelay: 0,
    },
    navigation: {
      osmEnabled: false,
    },
    interface: {
      useMetric: false,
      standstillTimer: false,
      screenBrightness: 0,
      screenOffTimer: 15,
      devUI: false,
      disableOnroadUploads: false,
      greenLightAlert: true,
      leadDepartAlert: true,
      alwaysOnDM: false,
      showTurnSignals: false,
      roadNameDisplay: false,
      quietMode: false,
      hideVegoUI: false,
      trueVegoUI: false,
      torqueBar: false,
      blindSpotHUD: false,
      steeringArc: false,
      chevronInfo: false,
      rainbowMode: false,
    },
    commaAI: {
      recordDrives: true,
      uploadOnlyOnWifi: true,
      disengageOnAccelerator: false,
      ldwEnabled: true,
      connectEnabled: true,
      mads: false,
      madsMainCruise: false,
      madsSteeringMode: 0,
      madsUnifiedEngagement: false,
      recordAudioFeedback: false,
    },
    advanced: {
      quickBoot: false,
    },
  };
}

export interface ConfigRecord {
  id: string;
  name: string;
  description?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  config: SPConfig;
  tags: string[];
  category?: string;
  isShared: boolean;
  isReadOnly: boolean;
  shareToken?: string;
  sharedAt?: string;
  viewCount: number;
  cloneCount: number;
  version?: number;
  /** ID of the config this was cloned from, if any */
  clonedFromId?: string | null;
  /** Summary of the source config (populated when clonedFromId is set) */
  clonedFrom?: { id: string; name: string; shareToken?: string | null } | null;
  // Community fields (present on explore/shared views)
  avgRating?: number | null;
  ratingCount?: number;
  commentCount?: number;
  /** True when the authenticated viewer is the owner of this config */
  isOwn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  token: string;
  createdAt: string;
  lastSeenAt: string;
  _count: { configurations: number };
}

// ─── Community types ──────────────────────────────────────────────────────────

export interface CommentRecord {
  id: string;
  body: string;
  authorHandle: string;
  authorName?: string | null;
  parentId: string | null;
  /** Replies are built client-side from the flat list returned by the API. */
  replies?: CommentRecord[];
  isOwn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RatingRecord {
  id: string;
  value: number;
  createdAt: string;
}

export interface RatingSummary {
  avg: number | null;
  count: number;
  breakdown: Record<number, number>;
}

export interface ExploreFacets {
  tags: { tag: string; count: number }[];
  makes: { make: string | null; count: number }[];
}

export interface ExploreResponse {
  configs: ConfigRecord[];
  total: number;
  page: number;
  limit: number;
  facets: ExploreFacets;
}

export interface CommunityStats {
  sharedConfigs: number;
  totalRatings: number;
  totalComments: number;
  totalDrafts: number;
  supportedMakes: number;
  totalViews: number;
  totalClones: number;
  topMakes: { make: string; count: number }[];
  topCategories: { category: string; count: number }[];
  topTags: { tag: string; count: number }[];
}

/** A saved bookmark: the config record plus when it was favorited. */
export interface FavoriteRecord extends ConfigRecord {
  favoritedAt: string;
}

/** An in-app notification (clone, rating, comment_reply). */
export interface NotificationRecord {
  id: string;
  type: "clone" | "rating" | "comment_reply";
  configId: string | null;
  config: { id: string; name: string; shareToken: string | null } | null;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

/** Paginated response for GET /api/configs. */
export interface ConfigsPage {
  configs: ConfigRecord[];
  total: number;
  sharedCount: number;
  draftCount: number;
  page: number;
  limit: number;
}

/** A single version snapshot of a config (before an edit). */
export interface ConfigSnapshot {
  id: string;
  configId: string;
  version: number;
  name: string;
  /** Full SPConfig JSON at time of snapshot — only present in the detail endpoint. */
  data?: SPConfig;
  createdAt: string;
}

/** Slim snapshot entry for the history list (no data). */
export interface ConfigSnapshotMeta {
  id: string;
  version: number;
  name: string;
  createdAt: string;
}

/** A user-created collection / playlist of configs. */
export interface CollectionRecord {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
  items?: { configId: string; addedAt: string; config: ConfigRecord }[];
}

/** A vehicle entry from the verified vehicles list. */
export interface VehicleEntry {
  make: string;
  displayName: string;
  models: string[];
}

// ─── Predefined tags ─────────────────────────────────────────────────────────

export const PREDEFINED_TAGS = [
  // ── Driving context ───────────────────────────────────────────────
  "highway",
  "city",
  "daily-driver",
  "long-distance",
  "performance",
  "comfort",
  "smooth",
  "aggressive",
  "eco",
  "traffic-mode",
  // ── Vehicle type ──────────────────────────────────────────────────
  "suv",
  "truck",
  "sedan",
  "crossover",
  // ── Comma AI hardware ────────────────────────────────────────────
  "comma4",
  "comma3x",
  "comma3",
  // ── Branch ───────────────────────────────────────────────────────
  "release",
  "staging",
  "dev",
  // ── Lateral features ─────────────────────────────────────────────
  "torque-ctrl",
  "live-torque",
  "nn-lateral",
  // ── Longitudinal features ────────────────────────────────────────
  "e2e",
  "dynamic-e2e",
  "alpha-long",
  "planplus",
  "hyundai-tune",
  "custom-acc",
  // ── Speed control ─────────────────────────────────────────────────
  "speed-limit",
  "vision-turn",
  "map-turn",
  // ── MADS / safety ─────────────────────────────────────────────────
  "mads",
  "bsm",
  // ── Navigation / connectivity ────────────────────────────────────
  "osm",
  "sunnylink",
  // ── Status ────────────────────────────────────────────────────────
  "experimental",
  "developer",
  "tested",
  "wip",
] as const;

export const CATEGORIES = [
  { value: "daily-driver", label: "Daily Driver" },
  { value: "comfort", label: "Comfort / Smooth" },
  { value: "performance", label: "Performance" },
  { value: "economy", label: "Economy / Eco" },
  { value: "highway", label: "Highway / Long Distance" },
  { value: "city", label: "City / Urban" },
  { value: "experimental", label: "Experimental" },
  { value: "developer", label: "Developer / Debug" },
  { value: "community-pick", label: "Community Pick" },
] as const;
