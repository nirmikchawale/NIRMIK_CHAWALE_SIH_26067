# Data Dictionary

## Runtime scientific inputs

| File | Type | Role |
|---|---|---|
| `data/glorys12_20240102_67E70E_12N14N_0m500m.nc` | Cached NetCDF | Actual Copernicus model context used by 3D/slice views |
| `data/comparison/profile_*_level_comparison.csv` | Processed CSV | Single source of truth for selected matched-level profile/bias charts |
| `data/comparison/profile_*_summary.json` | Processed JSON | Selected-profile identity, metrics and provenance fields |
| `data/comparison/comparison_config.json` | Method config | QC, collocation, time and temperature policies |
| `data/comparison/comparison_provenance.json` | Provenance | Input hashes, environment, raw-integrity evidence |
| `data/comparison/verification_results.json` | Verification | Preserved comparison verification results |

## Model variables

| Variable | Meaning | Units | Raw/derived |
|---|---|---|---|
| `longitude` | Model longitude | degrees_east | Source |
| `latitude` | Model latitude | degrees_north | Source |
| `depth` | Positive-down model depth | m | Source |
| `time` | Model field time coordinate | hours since 1950-01-01 | Source |
| `thetao` | Sea-water potential temperature | degrees_C | Source, packed/decoded by loader |
| `so` | Sea-water salinity | 1e-3 | Source, roadmap context only |
| `uo` | Eastward sea-water velocity | m s-1 | Source, roadmap context only |
| `vo` | Northward sea-water velocity | m s-1 | Source, roadmap context only |

## Matched comparison CSV fields

| Column | Meaning | Units/source |
|---|---|---|
| `profile_id` | Curated profile identifier | text |
| `source_level_index` | Original curated level index | integer |
| `observation_depth_m` | Argo-derived positive-down depth | m |
| `observed_temperature` | Observation potential temperature used for comparison | °C |
| `observed_in_situ_temperature_celsius` | Adjusted in-situ temperature before potential-temperature conversion | °C |
| `pressure_dbar` | Adjusted pressure | dbar |
| `pressure_qc` | Accepted provider pressure QC | expected 1 |
| `temperature_qc` | Accepted provider temperature QC | expected 1 |
| `salinity_auxiliary_qc` | Accepted auxiliary salinity QC | expected 1 |
| `position_qc` | Position QC | expected 1 |
| `time_qc` | Time QC | expected 1 |
| `model_temperature_interpolated` | Model potential temperature interpolated to observation depth | °C |
| `signed_bias_celsius` | Model − Observation | °C |
| `absolute_error_celsius` | Absolute model–observation difference | °C |
| `model_lower_depth_m` | Lower model bracket depth | m |
| `model_upper_depth_m` | Upper model bracket depth | m |
| `temperature_basis` | Comparison quantity description | text |
| `spatial_distance_km` | Observation-to-model-cell separation | km |
| `time_offset_hours` | Observation minus encoded model timestamp | h |
| `time_offset_from_daily_midpoint_hours` | Observation minus daily-mean midpoint | h |
| `qc_status` | Pipeline acceptance tag | text |

## Missing values and validation

Critical plotted values must be finite. The loader raises a visible evidence error rather than replacing missing scientific data with zeros or synthetic values. Model `_FillValue` and packed valid-range masks are applied before scale/offset decoding.

## Provenance boundary

The final runtime package contains processed Argo comparison evidence and source metadata, not the complete original raw Argo workspace. Original-source hashes and “raw unchanged” status are retained from the verified comparison run.
