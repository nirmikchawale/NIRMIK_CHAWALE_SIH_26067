# OceanTwin 3D — temperature model–observation diagnostic comparison

**SIH26067 · The Optimizers**

Completed for the two specified Argo profiles: **99 matched levels**, with raw input checksums unchanged. Select **20240102_indian_ocean_prof:23**, file alias **5907092_cycle013_D**, for the first demonstration. This is a diagnostic residual analysis, not independent model validation.

## Results and ranking

| Rank | Profile alias | Matched levels | Distance km | Δt from stored timestamp h | Δt from daily midpoint h | Mean bias °C | MAE °C | RMSE °C | Max absolute error °C |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 5907092_cycle013_D | 50 | 3.851 | +14.767 | +2.767 | +0.0233 | 0.2254 | 0.3188 | 1.0760 |
| 2 | 5907092_cycle012_A | 49 | 4.216 | +13.450 | +1.450 | -0.0184 | 0.2081 | 0.3314 | 1.3822 |

Ranking is lexicographic in the requested order: **most matched levels**, then **smallest absolute stored-timestamp offset**, then **smallest distance**, then **lowest RMSE**. These are not weighted scores. Cycle 13 wins first on 50 versus 49 levels. Cycle 12 has a smaller time offset and MAE; neither is hidden. Both casts are from float 5907092 and are not independent samples of the wider ocean.

| File alias | Exact curated profile ID | Original profile index | Float / cycle / direction |
|---|---|---:|---|
| 5907092_cycle013_D | 20240102_indian_ocean_prof:23 | 23 | 5907092 / 13 / descending |
| 5907092_cycle012_A | 20240102_indian_ocean_prof:26 | 26 | 5907092 / 12 / ascending |

## Selected demonstration

- Observation: 2 January 2024 at **14:46 UTC**, 67.61864833°E, 12.83710333°N.
- Model grid centre: **67.58333588°E, 12.83333302°N**; grid indices longitude 7, latitude 10 (zero-based).
- Separation: **3.851345 km**, great-circle distance on a 6371.0088 km-radius sphere.
- Matched depths: **1.392–447.024 m**.
- Mean signed bias: **+0.0233°C**, model minus observation.
- MAE **0.2254°C**; RMSE **0.3188°C**.
- The maximum absolute error is **1.0760°C**. Small mean bias does not imply small errors: positive and negative residuals partly cancel.

## Exact fields and temperature compatibility

| Quantity | Exact source field(s) | Curated/output field(s) |
|---|---|---|
| Model temperature | `thetao(time, depth, latitude, longitude)` | `model_temperature_interpolated` |
| Model coordinates | `longitude`, `latitude`, `time`, `depth` | model-cell and timestamp fields in each summary |
| Argo in-situ temperature | `TEMP_ADJUSTED`; unadjusted `TEMP` is retained but unused | `TEMP_ADJUSTED`, `observed_in_situ_temperature_celsius` |
| Argo pressure | `PRES_ADJUSTED`, decibar | `pressure_dbar` |
| Argo salinity, auxiliary only | `PSAL_ADJUSTED`, psu | used solely in temperature conversion, no salinity comparison |
| Argo position | `LONGITUDE`, `LATITUDE` | `longitude`, `latitude` in profile catalogue |
| Argo time | `JULD`, days since 1950-01-01 UTC | `time_utc` |
| Argo level QC | `TEMP_ADJUSTED_QC`, `PRES_ADJUSTED_QC`, `PSAL_ADJUSTED_QC` | retained QC fields in level CSV |
| Argo profile QC | `POSITION_QC`, `JULD_QC` | `position_qc`, `time_qc` |
| Argo derived depth | calculated, not an original depth variable | `depth_m` → `observation_depth_m` |
| Argo comparable temperature | `potential_temperature_0dbar_degC`, recomputed and checked | `observed_temperature` |

The raw definitions **are not directly comparable**: Argo adjusted temperature is in-situ ITS-90 (`degree_Celsius`), whereas `thetao` is potential temperature (`degrees_C`). The comparison uses potential temperature referenced to sea-level pressure (0 dbar), consistent with the model's CF standard name. Argo practical salinity is converted to Absolute Salinity with `gsw.SA_from_SP(SP, p, lon, lat)`, then `gsw.pt0_from_t(SA, t, p)` converts temperature. Curated conversion results are independently recomputed from original Argo values before use. [CF definition](https://cfconventions.org/Data/cf-standard-names/37/build/cf-standard-name-table.html), [TEOS-10 conversion](https://www.teos-10.org/pubs/gsw/html/gsw_pt0_from_t.html).

**Remaining limitation:** the supplied model metadata does not fully identify its equation-of-state implementation and temperature-scale conventions. Physical quantity and reference pressure are aligned; exact thermodynamic implementation equivalence is not established. The derived temperature is not Conservative Temperature.

## Time matching

The file stores `2024-01-02T00:00:00Z`, but the official product manual specifies a UTC daily averaging interval spanning that calendar day, with its midpoint at noon. Both observations lie within **[2024-01-02 00:00, 2024-01-03 00:00)**. There is no temporal interpolation and no observation outside that interval is allowed. [Copernicus product manual, section 2c, printed page 9](https://documentation.marine.copernicus.eu/PUM/CMEMS-GLO-PUM-001-030.pdf).

`time_offset_hours = observation_time − encoded_model_time`: +14.766667 h and +13.45 h. Additional offsets from the daily midpoint are +2.766667 h and +1.45 h. An instantaneous Argo profile and a daily model mean have different temporal sampling; these offsets do not eliminate that representativeness difference. Original model timestamps and inherited metadata were not altered.

## QC, spatial selection and interpolation

Both selected profiles are delayed-mode (`DATA_MODE=D`). Require provider flag **1** for position, time, adjusted pressure, adjusted temperature and the adjusted salinity needed for conversion. Missing/fill/masked or non-finite values are rejected; bad adjusted values never fall back to raw values. Source profile and level indices are included for traceability.

Depth is explicitly derived as **`-gsw.z_from_p(PRES_ADJUSTED, latitude)`** in metres, positive down. Dynamic-height and sea-surface-geopotential corrections are omitted; this is a documented hydrostatic conversion, not the assumption that one decibar equals one metre. [TEOS-10 depth conversion](https://www.teos-10.org/pubs/gsw/html/gsw_z_from_p.html).

Nearest-cell search uses great-circle distance over the supplied grid. A usable cell needs at least two valid temperature levels and a valid adjacent vertical bracket for at least one eligible observation. Missing temperature masks serve as the available wet-cell indicator; no separate bathymetry or basin-connectivity mask was supplied. A configurable **10 km** distance cap applies. All 31 temperature levels are valid at the selected cell, which is the nearest centre for both casts. No cross-land issue is indicated in this small all-valid tile; this is not a general coastline-aware algorithm.

Linear interpolation is permitted only between **adjacent valid model levels**. It does not bridge an internal masked gap or extrapolate above 0.494025 m or below 453.937714 m. The level CSV retains both bracketing model depths and the native 31-level model column is also saved.

Of the previously curated records, cycle 13 has 54 levels: 2 rejected by QC, 2 outside model depths, 50 matched. Cycle 12 has 51: 2 outside model depths, 49 matched. The excluded-record audit concerns these curated inputs only, not the full-depth raw Argo file.

## Metrics and limits

For each matched level, residual = model − observation and absolute error = |residual|. Profile bias, MAE and RMSE use only valid matched levels with **equal weight per level**; RMSE = sqrt(mean(residual²)). No missing value contributes zero. These are not depth-thickness-weighted statistics; sampling density and vertical correlation affect interpretation. No uncertainty or confidence intervals are claimed.

The model is GLORYS12 reanalysis, product `GLOBAL_MULTIYEAR_PHY_001_030`, dataset version `202311`, part `default`. Its assimilation of in-situ observations means these residuals are **not necessarily independent validation**. No assertion is made about whether these particular casts were assimilated. No salinity/current/glider comparison, app, dashboard or UI was built.

## Delivered figures and evidence

Three 300-dpi static PNGs are supplied **for each profile**, including the selected profile: observed versus model temperature, bias by depth, and geographic grid context with a local zoom. Depth increases downward. The map is a coordinate plot with no coastline layer; its distance is calculated by the spherical formula, not by map-screen length.

The package includes the engine, configuration, synthetic regression tests, test results, independent output verification, original source schema/inspection copies, reference documents, per-level CSVs, profile summaries, ranking, excluded rows and provenance. Raw source files remain at their original paths and are unchanged. Checksums are verified before and after calculation.

## Execution board

| Done | Limitation to retain | Next |
|---|---|---|
| Temperature comparison for 2 casts / 99 levels; nearest valid cell; no-extrapolation interpolation; metrics and ranking; six static figures; synthetic and independent verification | Daily mean versus instantaneous observation; thermodynamic implementation uncertainty; correlated levels and related casts; reanalysis assimilation | Test sensitivity to horizontal matching by comparing nearest-cell and bilinear results for these same two profiles. |

The original ingestion archive remains unchanged; this is a separate derived-output package.

## Environment note

All 25 tests passed, with one nonfatal NumPy/Cython import warning from netCDF4: `numpy.ndarray size changed, may indicate binary incompatibility. Expected 16 from C header, got 96 from PyObject`. This warning remains unresolved and is retained in `test_results.txt`. The packed-NetCDF fixture and independent checks of all 99 exported levels passed. Exact installed versions are recorded in `requirements-lock.txt`; passing numerical checks does not guarantee compatibility for every other workload.
