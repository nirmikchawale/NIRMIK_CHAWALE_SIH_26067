export type VariableKind = "scalar" | "vector";
export type ViewMode = "slice" | "volume";

export interface VariableCard {
  id: "thetao" | "so" | "currents";
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
