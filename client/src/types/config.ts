// ─── Enumerations ────────────────────────────────────────────────────────────

export type SPBranch = "stable-sp" | "dev-sp" | "nightly";

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

export type LateralMethod = "torque" | "pid" | "indi" | "lqr";

export type LongitudinalMethod = "sunnypilot" | "stock" | "e2e";

export type DrivingProfile = "eco" | "normal" | "sport";

export type SLCSource = "none" | "nav" | "osm" | "nav_osm";

export type SLCOffsetType = "none" | "percentage" | "fixed_mph" | "fixed_kph";

export type LongPersonality = "relaxed" | "standard" | "aggressive";

export type SpeedUnit = "mph" | "kph";

export type FingerprintMethod = "firmware" | "vin" | "smart";

// ─── Sub-interfaces ──────────────────────────────────────────────────────────

export interface TorqueParams {
  /** 0.01 – 0.5  — rolling friction contribution */
  friction: number;
  /** 1.0 – 4.0  — lateral acceleration scaling factor */
  latAccelFactor: number;
  /** 0.0 – 0.5 s — hardware actuator delay */
  steerActuatorDelay: number;
  /** Use neural-network lateral model instead of rule-based tuning */
  useNNModel: boolean;
  /** Steer limit timer: time before error resets (0.1 – 5.0 s) */
  steerLimitTimer: number;
}

export interface PIDParams {
  /** High-speed proportional gain */
  kpHighSpeed: number;
  /** Low-speed proportional gain */
  kpLowSpeed: number;
  /** High-speed integral gain */
  kiHighSpeed: number;
  /** Low-speed integral gain */
  kiLowSpeed: number;
  /** Feed-forward gain */
  kf: number;
  /** Hardware actuator delay (0.0 – 0.5 s) */
  steerActuatorDelay: number;
  /** Steer limit timer */
  steerLimitTimer: number;
}

export interface INDIParams {
  /** Inner loop gain (1.0 – 10.0) */
  innerLoopGain: number;
  /** Outer loop gain (1.0 – 10.0) */
  outerLoopGain: number;
  /** Time constant (0.5 – 5.0) */
  timeConstant: number;
  /** Actuator effectiveness (0.5 – 3.0) */
  actuatorEffectiveness: number;
  /** Hardware actuator delay */
  steerActuatorDelay: number;
  /** Steer limit timer */
  steerLimitTimer: number;
}

export interface LQRParams {
  /** Scale factor (1000 – 5000) */
  scale: number;
  /** Integral gain */
  ki: number;
  /** A matrix row 0 */
  a0: number;
  /** A matrix row 1 */
  a1: number;
  /** B matrix row 0 */
  b0: number;
  /** B matrix row 1 */
  b1: number;
  /** Hardware actuator delay */
  steerActuatorDelay: number;
  /** Steer limit timer */
  steerLimitTimer: number;
}

export interface ProfileTune {
  /** Max acceleration rising (0.1 – 3.5 m/s²) */
  accelMax: number;
  /** Max deceleration (0.5 – 4.0 m/s²) */
  decelMax: number;
  /** Follow time gap (0.8 – 2.5 s) */
  followGap: number;
}

// ─── Main config type ────────────────────────────────────────────────────────

export interface SPConfig {
  /** App metadata (not sent to device) */
  metadata: {
    sunnypilotVersion: string;
    branch: SPBranch;
  };

  // ── 1. Vehicle ─────────────────────────────────────────────────────────────
  vehicle: {
    make: CarMake;
    model: string;
    year: number;
    fingerprintSource: FingerprintMethod;
    /** Enable startup cinematic animation */
    enableCinematic: boolean;
    /** Force a specific fingerprint ID override (empty = auto) */
    fingerprintOverride: string;
  };

  // ── 2. Driving Personality ────────────────────────────────────────────────
  drivingPersonality: {
    /** Active profile selection */
    activeProfile: DrivingProfile | "traffic";
    /** Comma AI longitudinal personality (coarse-level) */
    longitudinalPersonality: LongPersonality;
    eco: ProfileTune;
    normal: ProfileTune;
    sport: ProfileTune;
    /** Enable dynamic traffic mode (adjusts gap based on detected traffic) */
    trafficMode: boolean;
    /** Smooth deceleration into curves */
    smoothDecelerationOnCurves: boolean;
  };

  // ── 3. Lateral Control (Steering) ─────────────────────────────────────────
  lateral: {
    /** Active control method */
    method: LateralMethod;
    torque: TorqueParams;
    pid: PIDParams;
    indi: INDIParams;
    lqr: LQRParams;
    /** Steer rate cost: penalises rapid steering changes (0.01 – 1.0) */
    steerRateCost: number;
    /** Dead zone: angle below which no correction is applied (0 – 5°) */
    steeringAngleDeadzone: number;
    /** Static offset correction (−3 to +3°) */
    steerAngleOffset: number;
    /** Custom steering ratio (null = use car default) */
    customSteeringRatio: number | null;
    /** Reset steering on lane markings lost */
    resetSteeringOnLM: boolean;
    /** Auto-tune lateral controller using drive data */
    autoTune: boolean;
  };

  // ── 4. Longitudinal Control ───────────────────────────────────────────────
  longitudinal: {
    /** Use SunnyPilot custom longitudinal instead of stock */
    useSPLong: boolean;
    /** Enable Comma E2E (end-to-end) longitudinal model */
    e2eEnabled: boolean;
    /** Smooth stop: gentler stop at low speeds */
    smoothStop: boolean;
    /** Dynamic e2e toggle: switch between e2e and non-e2e conditionally */
    dynamicE2E: boolean;
    /** Jerk upper limit override (m/s³, 0 = stock) */
    jerkUpperLimit: number;
    /** Jerk lower limit override (m/s³, 0 = stock) */
    jerkLowerLimit: number;
    /** Override lead car accel profile at close range */
    aggressiveAccelBehindLead: boolean;
    /** Coast decel: allow coasting instead of braking below threshold */
    coastDecelEnabled: boolean;
  };

  // ── 5. Speed Control ──────────────────────────────────────────────────────
  speedControl: {
    speedLimitControl: {
      enabled: boolean;
      /** Data source for speed limits */
      source: SLCSource;
      /** How much above the limit to drive */
      offsetType: SLCOffsetType;
      /** Offset value (% or absolute mph/kph depending on offsetType) */
      offsetValue: number;
      /** Automatically engage when speed limit changes */
      autoEngage: boolean;
      /** Show notification when speed limit changes */
      engageAlert: boolean;
    };
    visionTurnControl: {
      enabled: boolean;
      /** Target minimum speed when entering a curve (mph) */
      turnSpeed: number;
      /** Braking aggression: 1=gentle, 10=aggressive */
      smoothFactor: number;
    };
    mapTurnControl: {
      enabled: boolean;
      /** Speed margin above mapped turn speed (mph) */
      speedMargin: number;
    };
    /** Speed offset applied to set-speed display (−20 to +20) */
    setSpeedOffset: number;
    /** Cruise increment per button press */
    cruiseIncrement: 1 | 5;
    speedUnit: SpeedUnit;
    /** Auto-resume cruise after brief stop */
    autoResume: boolean;
    /** Show current speed limit on HUD */
    showSpeedLimit: boolean;
  };

  // ── 6. Lane Change ────────────────────────────────────────────────────────
  laneChange: {
    enabled: boolean;
    /** Seconds before auto lane change after signal (0 = nudge required) */
    autoTimer: 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3;
    /** Minimum speed for auto lane change (mph) */
    minimumSpeed: number;
    /** Integrate blind spot monitoring if available */
    bsmMonitoring: boolean;
    /** Allow lane change without physical nudge */
    nudgeless: boolean;
    /** Alert sound when lane change starts */
    alertOnChange: boolean;
    /** Cancel if speed drops below minimum during lane change */
    cancelBelowMinSpeed: boolean;
    /** Disable signal required (use LKAS for subtle lane keeping only) */
    oneLaneChange: boolean;
  };

  // ── 7. Navigation ─────────────────────────────────────────────────────────
  navigation: {
    /** Enable Navigation on OpenPilot (NOO) */
    navigationOnOP: boolean;
    /** Use OpenStreetMap data for speed limits */
    osmEnabled: boolean;
    /** Prefer navigation speed limits over OSM when both available */
    preferNavSpeedLimits: boolean;
    /** Custom Mapbox token (leave empty to use default) */
    mapboxToken: string;
    /** Download and cache map tiles on WiFi */
    preloadMaps: boolean;
    /** Gap distance to lead vehicle shown on map */
    showNavCarDistance: boolean;
  };

  // ── 8. Interface & Display ────────────────────────────────────────────────
  interface: {
    /** Show developer info overlay (speed, accel, lead data) */
    devUI: boolean;
    /** Mini dev UI (smaller overlay) */
    devUIMini: boolean;
    /** Display standstill duration timer */
    standstillTimer: boolean;
    /** Show active SLC offset on HUD */
    showSLCOffset: boolean;
    /** Show VTSC (vision turn) active state */
    showVTSCState: boolean;
    /** Show MTSC (map turn) active state */
    showMTSCState: boolean;
    /** Show dynamic following distance alert */
    dfAlert: boolean;
    /** Show maximum acceleration alert */
    maxAccAlert: boolean;
    /** Sidebar visible by default */
    sidebar: boolean;
    /** Screen off timer (seconds, 0 = never) */
    screenOffTimer: number;
    /** Screen brightness 0 – 100 */
    screenBrightness: number;
    /** Place map panel on left side */
    mapOnLeft: boolean;
    /** Disable uploading while driving on cellular */
    disableOnroadUploads: boolean;
    /** Use metric units system-wide */
    useMetric: boolean;
    /** Show braking state indicator */
    showBrakingState: boolean;
  };

  // ── 9. Comma AI Core ──────────────────────────────────────────────────────
  commaAI: {
    /** Record all drives and upload to comma.ai servers */
    recordDrives: boolean;
    /** Only upload drive footage over WiFi */
    uploadOnlyOnWifi: boolean;
    /** Disengage openpilot when accelerator pedal pressed */
    disengageOnAccelerator: boolean;
    /** Enable live parameter estimation (steering ratio, torque) */
    enableLiveParameters: boolean;
    /** Enable Comma E2E longitudinal model flag */
    endToEndLong: boolean;
    /** Lane departure warning (audible alert when crossing lane without signal) */
    ldwEnabled: boolean;
    /** Show wide camera view on screen */
    enableWideCameraView: boolean;
    /** Start WiFi hotspot automatically on boot */
    hotspotOnBoot: boolean;
    /** Upload over cellular data (charges may apply) */
    uploadOnCellular: boolean;
    /** Comma Connect integration enabled */
    connectEnabled: boolean;
    /** Send driving data for model training */
    trainingDataEnabled: boolean;
  };

  // ── 10. Advanced / Tuning ─────────────────────────────────────────────────
  advanced: {
    /** Custom fingerprint string override */
    customFingerprint: string;
    /** Use prebuilt OpenPilot binary */
    enablePrebuilt: boolean;
    /** Extended logging for debugging */
    extendedLogging: boolean;
    /** SSH public key for device access */
    sshPublicKey: string;
    /** Assert safety model in firmware (disable for testing only) */
    assertSafetyModel: boolean;
    /** Comma panda heartbeat check */
    pandaHeartbeat: boolean;
    /** Custom boot logo path */
    customBootLogo: string;
    /** Developer mode on-device */
    dpDeveloperMode: boolean;
  };
}

// ─── Default config factory ───────────────────────────────────────────────────

export function createDefaultConfig(): SPConfig {
  return {
    metadata: {
      sunnypilotVersion: "0.9.7.1",
      branch: "stable-sp",
    },
    vehicle: {
      make: "toyota",
      model: "",
      year: 2023,
      fingerprintSource: "firmware",
      enableCinematic: true,
      fingerprintOverride: "",
    },
    drivingPersonality: {
      activeProfile: "normal",
      longitudinalPersonality: "standard",
      eco: { accelMax: 1.0, decelMax: 1.5, followGap: 2.0 },
      normal: { accelMax: 1.5, decelMax: 2.0, followGap: 1.45 },
      sport: { accelMax: 2.0, decelMax: 2.5, followGap: 1.1 },
      trafficMode: false,
      smoothDecelerationOnCurves: true,
    },
    lateral: {
      method: "torque",
      torque: {
        friction: 0.05,
        latAccelFactor: 2.5,
        steerActuatorDelay: 0.25,
        useNNModel: false,
        steerLimitTimer: 0.8,
      },
      pid: {
        kpHighSpeed: 0.3,
        kpLowSpeed: 0.5,
        kiHighSpeed: 0.05,
        kiLowSpeed: 0.1,
        kf: 0.00007818594,
        steerActuatorDelay: 0.25,
        steerLimitTimer: 0.8,
      },
      indi: {
        innerLoopGain: 4.0,
        outerLoopGain: 3.0,
        timeConstant: 1.0,
        actuatorEffectiveness: 1.0,
        steerActuatorDelay: 0.25,
        steerLimitTimer: 0.8,
      },
      lqr: {
        scale: 1500.0,
        ki: 0.05,
        a0: 0.0,
        a1: 0.1,
        b0: -0.0028,
        b1: 0.0025,
        steerActuatorDelay: 0.25,
        steerLimitTimer: 0.8,
      },
      steerRateCost: 0.5,
      steeringAngleDeadzone: 0.0,
      steerAngleOffset: 0.0,
      customSteeringRatio: null,
      resetSteeringOnLM: false,
      autoTune: false,
    },
    longitudinal: {
      useSPLong: true,
      e2eEnabled: false,
      smoothStop: true,
      dynamicE2E: false,
      jerkUpperLimit: 0,
      jerkLowerLimit: 0,
      aggressiveAccelBehindLead: false,
      coastDecelEnabled: false,
    },
    speedControl: {
      speedLimitControl: {
        enabled: true,
        source: "nav_osm",
        offsetType: "none",
        offsetValue: 0,
        autoEngage: true,
        engageAlert: true,
      },
      visionTurnControl: {
        enabled: true,
        turnSpeed: 25,
        smoothFactor: 5,
      },
      mapTurnControl: {
        enabled: true,
        speedMargin: 5,
      },
      setSpeedOffset: 0,
      cruiseIncrement: 5,
      speedUnit: "mph",
      autoResume: true,
      showSpeedLimit: true,
    },
    laneChange: {
      enabled: true,
      autoTimer: 1,
      minimumSpeed: 25,
      bsmMonitoring: true,
      nudgeless: false,
      alertOnChange: true,
      cancelBelowMinSpeed: true,
      oneLaneChange: false,
    },
    navigation: {
      navigationOnOP: true,
      osmEnabled: true,
      preferNavSpeedLimits: true,
      mapboxToken: "",
      preloadMaps: false,
      showNavCarDistance: true,
    },
    interface: {
      devUI: false,
      devUIMini: false,
      standstillTimer: true,
      showSLCOffset: true,
      showVTSCState: true,
      showMTSCState: true,
      dfAlert: true,
      maxAccAlert: false,
      sidebar: true,
      screenOffTimer: 30,
      screenBrightness: 70,
      mapOnLeft: false,
      disableOnroadUploads: false,
      useMetric: false,
      showBrakingState: false,
    },
    commaAI: {
      recordDrives: true,
      uploadOnlyOnWifi: true,
      disengageOnAccelerator: true,
      enableLiveParameters: true,
      endToEndLong: false,
      ldwEnabled: true,
      enableWideCameraView: true,
      hotspotOnBoot: false,
      uploadOnCellular: false,
      connectEnabled: true,
      trainingDataEnabled: false,
    },
    advanced: {
      customFingerprint: "",
      enablePrebuilt: false,
      extendedLogging: false,
      sshPublicKey: "",
      assertSafetyModel: true,
      pandaHeartbeat: true,
      customBootLogo: "",
      dpDeveloperMode: false,
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
  supportedMakes: number;
}

// ─── Predefined tags ─────────────────────────────────────────────────────────

export const PREDEFINED_TAGS = [
  "highway",
  "city",
  "daily-driver",
  "long-distance",
  "performance",
  "comfort",
  "smooth",
  "aggressive",
  "eco",
  "experimental",
  "e2e",
  "torque-ctrl",
  "pid-ctrl",
  "indi-ctrl",
  "speed-limit",
  "vision-turn",
  "map-turn",
  "traffic-mode",
  "nudgeless-lc",
  "developer",
  "stock-long",
  "sp-long",
  "suv",
  "truck",
  "sedan",
  "crossover",
  "tested",
  "wip",
] as const;

export const CATEGORIES = [
  { value: "daily-driver", label: "Daily Driver" },
  { value: "performance", label: "Performance" },
  { value: "economy", label: "Economy / Eco" },
  { value: "highway", label: "Highway / Long Distance" },
  { value: "experimental", label: "Experimental" },
  { value: "oem-plus", label: "OEM+" },
  { value: "developer", label: "Developer / Debug" },
  { value: "community-pick", label: "Community Pick" },
] as const;
