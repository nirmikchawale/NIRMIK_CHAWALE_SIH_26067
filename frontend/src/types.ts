export type VariableKind = "scalar" | "vector";
export type ViewMode = "slice" | "volume";
export type VisualizationMode = "globe" | "water-column";
export type ColorPalette = "thermal" | "viridis" | "icefire";
export type ColorScaleMode = "linear" | "log";

export interface VariableCard {
  id: "thetao" | "so" | "currents" | "chlorophyll";
  label: string;
  kind: VariableKind;
  units: string;
  standard_name?: string;
  components?: string[];
  minimum: number;
  maximum: number;
}

export interface Catalog {
  dataset: {
    label: string;
    product: string;
    dataset_id: string;
    doi: string;
    source: string;
    title: string;
    region: string;
    demo_date: string;
    freshness_class: string;
    runtime_mode: string;
  };
  coordinates: {
    longitude: number[];
    latitude: number[];
    depth: number[];
    depth_units: string;
    depth_positive: string;
    time: string[];
  };
  variables: VariableCard[];
  capabilities: {
    scalar_3d: boolean;
    depth_slice: boolean;
    current_vectors: boolean;
    time_steps: number;
    time_animation: boolean;
    argo_profiles: boolean;
    offline_scientific_data: boolean;
    streamlit_fallback: boolean;
    surface_only?: boolean;
    biogeochemical_field?: boolean;
  };
  scientific_disclaimer: string;
}

export interface FieldResponse {
  variable: string;
  label: string;
  units: string;
  time_index: number;
  time: string;
  depth_index: number;
  depth_m: number;
  latitude: number[];
  longitude: number[];
  values: Array<Array<number | null>>;
  minimum: number;
  maximum: number;
  provenance: {
    product: string;
    dataset_id: string;
    freshness_class: string;
    runtime_mode: string;
  };
}

export interface VolumeResponse {
  variable: string;
  label: string;
  units: string;
  time_index: number;
  time: string;
  points: Array<[number, number, number, number]>;
  minimum: number;
  maximum: number;
  depth_positive: string;
  rendering_note: string;
}

export interface CurrentsVolumeResponse {
  variable: "currents";
  units: string;
  time_index: number;
  time: string;
  vectors: Array<[number, number, number, number, number, number]>;
  minimum: number;
  maximum: number;
  depths_m: number[];
  depth_positive: string;
  components: ["uo", "vo"];
  vertical_component_available: false;
  rendering_note: string;
}

export interface CurrentsResponse {
  variable: "currents";
  units: string;
  time_index: number;
  time: string;
  depth_index: number;
  depth_m: number;
  vectors: Array<[number, number, number, number, number]>;
  minimum: number;
  maximum: number;
  rendering_note: string;
}

export interface ProfileSummary {
  profile_id: string;
  platform_id: string;
  cycle: number;
  direction: string;
  matched_level_count: number;
  mae_celsius: number;
  rmse_celsius: number;
  spatial_distance_km: number;
  time_offset_hours: number;
  observation_time_utc: string;
  observation_longitude: number;
  observation_latitude: number;
  model_cell_longitude: number;
  model_cell_latitude: number;
  shallowest_matched_depth_m: number;
  deepest_matched_depth_m: number;
  [key: string]: unknown;
}

export interface ProfilesResponse {
  provider: string;
  doi: string;
  profiles: ProfileSummary[];
}

export interface ComparisonLevel {
  observation_depth_m: number;
  observed_temperature: number;
  model_temperature_interpolated: number;
  signed_bias_celsius: number;
  absolute_error_celsius: number;
  [key: string]: unknown;
}

export interface ProfileDetail {
  summary: ProfileSummary;
  levels: ComparisonLevel[];
  comparison_semantics: {
    bias: string;
    horizontal: string;
    vertical: string;
    interpretation: string;
  };
}


export interface ProvenanceResponse {
  model: {
    label: string;
    product: string;
    dataset_id: string;
    doi: string;
    file: string;
    freshness_class: string;
    runtime_mode: string;
  };
  observations: {
    provider: string;
    doi: string;
  };
  quality_control: {
    accepted_provider_qc: string[];
    max_cell_distance_km: number | null;
    matched_profiles: number;
    no_extrapolation: boolean;
    metrics_weighting: string | null;
  };
  methodology: {
    horizontal: string | null;
    depth: string | null;
    time: Record<string, unknown> | null;
    temperature: Record<string, unknown> | null;
  };
  integrity: {
    created_utc: string | null;
    source_checksums_unchanged: boolean | null;
    configuration_sha256: string | null;
    engine_sha256: string | null;
    no_synthetic_measurements_in_outputs: boolean | null;
  };
  source_metadata_available: string[];
  scientific_disclaimer: string;
}


export interface TelemetryStat {
  count: number;
  mean: number;
  minimum: number;
  maximum: number;
  std: number;
  p10: number;
  p50: number;
  p90: number;
}

export interface TelemetryDepthStat extends TelemetryStat {
  depth_index: number;
  depth_m: number;
}

export interface TelemetryTimeStat extends TelemetryStat {
  time_index: number;
  time: string;
}

export interface CurrentTelemetrySummary {
  count: number;
  mean_speed: number;
  maximum_speed: number;
  mean_u: number;
  mean_v: number;
  units: string;
}

export interface TelemetryResponse {
  variable: "thetao" | "so";
  label: string;
  units: string;
  time_index: number;
  time: string;
  selected_depth_index: number;
  selected_depth_m: number;
  depth_positive: string;
  depth_stats: TelemetryDepthStat[];
  time_stats: TelemetryTimeStat[];
  time_series_available: boolean;
  current_summary: CurrentTelemetrySummary | null;
  spatial_grid: {
    longitude_count: number;
    latitude_count: number;
    finite_cell_statistics: string;
  };
  provenance: {
    product: string;
    dataset_id: string;
    freshness_class: string;
    runtime_mode: string;
  };
  statistic_definition: string;
}


export interface SpatialAnomalyFlag {
  longitude: number;
  latitude: number;
  depth_m: number;
  value: number;
  robust_z: number;
}
export interface ResidualAnomalyFlag {
  profile_id: string;
  platform_id: string;
  cycle: number;
  direction: string;
  observation_depth_m: number;
  signed_bias_celsius: number;
  absolute_error_celsius: number;
  /** Robust z with the residual MAD floored (see residual_screen.mad_floor_celsius). */
  robust_z: number;
  /** Robust z with the raw MAD, kept for transparency; null when MAD is zero. */
  robust_z_unfloored: number | null;
  statistical_flag: boolean;
  physical_flag: boolean;
}
export interface ResidualProfileAnomalyStat {
  profile_id: string;
  platform_id: string;
  cycle: number;
  direction: string;
  sample_count: number;
  median_bias_celsius: number;
  mad_bias_celsius: number;
  effective_scale_celsius: number;
  mad_floor_applied: boolean;
  flagged_count: number;
  statistical_flagged_count: number;
  physical_flagged_count: number;
  unfloored_statistical_flagged_count: number;
  screen_available: boolean;
}
export interface AnomalyResponse {
  variable: "thetao" | "so";
  label: string;
  units: string;
  time_index: number;
  time: string;
  depth_index: number;
  depth_m: number;
  method: {
    name: string;
    formula: string;
    absolute_threshold: number;
    two_sided: boolean;
    zero_mad_policy: string;
  };
  spatial_screen: {
    scope: string;
    sample_count: number;
    median: number;
    mad: number;
    screen_available: boolean;
    flagged_count: number;
    flags: SpatialAnomalyFlag[];
  };
  residual_screen: {
    scope: string;
    temperature_only: boolean;
    profiles_screened: number;
    sample_count: number;
    flagged_count: number;
    statistical_flagged_count: number;
    physical_flagged_count: number;
    unfloored_statistical_flagged_count: number;
    mad_floor_celsius: number;
    physical_threshold_celsius: number;
    flag_rule: string;
    explanation: string;
    floor_notes: string[];
    profile_statistics: ResidualProfileAnomalyStat[];
    flags: ResidualAnomalyFlag[];
  };
  temporal_screen: {
    available: boolean;
    genuine_time_count: number;
    status: string;
    reason: string;
  };
  provenance: {
    product: string;
    dataset_id: string;
    freshness_class: string;
    runtime_mode: string;
    argo_provider: string;
  };
  interpretation: string;
}


export interface ConnectorSpec {
  id: string;
  adapter: string;
  kind: string;
  provider: string;
  title: string;
  role: string;
  variables: string[];
  protocols: string[];
  standards: string[];
  runtime: string;
  official: boolean;
  dataset_id?: string;
  source_url: string;
  opendap_url?: string | null;
  wms_url?: string | null;
  wcs_url?: string | null;
  time_count?: number;
  depth_count?: number;
}

export interface ConnectorRegistryResponse {
  schema: string;
  plugin_contracts: Record<string, {
    input: string[];
    required_coordinates?: string[];
    optional_coordinates?: string[];
    required_metadata?: string[];
    output: string;
  }>;
  connectors: ConnectorSpec[];
  principle: string;
}


export interface IncoisOperationalRecord {
  time: string;
  depth_m: number;
  latitude: number;
  longitude: number;
  temperature: number;
  salinity: number;
}

export interface IncoisOperationalSnapshot {
  schema: "oceantwin-incois-operational-v1";
  source: {
    provider: "INCOIS";
    dataset_id: string;
    title: string;
    service: string;
    query_url: string;
    official_metadata: string;
    conventions: string[];
    runtime_policy: string;
  };
  coverage: {
    times: string[];
    depths_m: number[];
    latitudes: number[];
    longitudes: number[];
  };
  variables: {
    temperature: { source_name: string; units: string; minimum: number; maximum: number };
    salinity: { source_name: string; units: string; minimum: number; maximum: number };
  };
  records: IncoisOperationalRecord[];
  record_count: number;
  integrity: {
    genuine_time_count: number;
    genuine_depth_count: number;
    synthetic_timestamps: false;
    source_values_modified: false;
  };
}


export interface IncoisChlorophyllRecord {
  time: string;
  latitude: number;
  longitude: number;
  chlorophyll_mg_m3: number;
}

export interface IncoisChlorophyllSnapshot {
  schema: "oceantwin-incois-chlorophyll-v1";
  source: {
    provider: "INCOIS";
    dataset_id: string;
    title: string;
    service: string;
    query_url: string;
    official_metadata: string;
    conventions: string[];
    runtime_policy: string;
  };
  coverage: {
    times: string[];
    latitudes: number[];
    longitudes: number[];
    surface_only: true;
  };
  variable: {
    source_name: "CHLOROPHYLL";
    label: string;
    standard_name: string;
    units: string;
    minimum: number;
    maximum: number;
  };
  records: IncoisChlorophyllRecord[];
  record_count: number;
  integrity: {
    genuine_time_count: number;
    surface_only: true;
    synthetic_timestamps: false;
    synthetic_depths: false;
    source_values_modified: false;
  };
}


export type ImportedSensorType = "argo" | "glider" | "ctd" | "bgc" | "other";

export interface ImportedObservationRecord {
  longitude: number;
  latitude: number;
  depth_m: number;
  timestamp: string;
  variable: string;
  value: number;
  units: string;
  source: string;
  platform_id: string;
  sensor_type: ImportedSensorType;
  qc_flag?: string;
  dataset_id?: string;
}

export interface ImportedObservationProfile {
  id: string;
  platform_id: string;
  sensor_type: ImportedSensorType;
  longitude: number;
  latitude: number;
  timestamp: string;
  source: string;
  dataset_id?: string;
  variables: string[];
  records: ImportedObservationRecord[];
}


export interface VerifiedObservationSource {
  id: string;
  provider: string;
  dataset_id: string;
  title: string;
  service: string;
  query_url: string;
  official_metadata: string;
  roles: string[];
  transformations: string[];
  platform?: string;
  profile_id?: string | number;
}

export interface VerifiedObservationPack {
  schema: "oceantwin-verified-observation-pack-v1";
  generated_utc: string;
  sources: VerifiedObservationSource[];
  records: ImportedObservationRecord[];
  record_count: number;
  integrity: {
    sensor_types: Array<"glider" | "ctd" | "bgc">;
    sensor_record_counts: Record<string, number>;
    synthetic_measurements: false;
    synthetic_timestamps: false;
    provider_values_modified: false;
    derived_coordinate_fields: string[];
    runtime_network_required: false;
  };
}

/** How the colour bar range is chosen: fitted to what is on screen, the whole water column, or typed by the user. */
export type ColorRangeMode = "fit" | "column" | "custom";
