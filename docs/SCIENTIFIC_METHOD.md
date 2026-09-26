# Scientific Method

## Scope

OceanTwin 3D is an explainable model–observation diagnostic prototype for one cached ocean-model subset and two QC-screened Argo profiles. It is not an independent validation, forecast, or complete Digital Twin Ocean.

## Model evidence

- Copernicus Marine product: `GLOBAL_MULTIYEAR_PHY_001_030` (GLORYS12V1).
- Cached dataset: `cmems_mod_glo_phy_my_0.083deg_P1D-m`, version `202311`.
- Date: 2 January 2024.
- Region: 67–70°E, 12–14°N.
- Implemented variable: `thetao`.
- Local NetCDF metadata: `standard_name=sea_water_potential_temperature`, units `degrees_C`.
- Local subset geometry: 31 depth levels × 25 latitudes × 37 longitudes.
- Local depth range: 0.494–453.938 m, positive down.

The Copernicus product page describes GLORYS12V1 as a 1/12° global reanalysis with 50 parent-product vertical levels, daily/monthly means, and assimilation of in-situ temperature/salinity profiles. The MVP uses only the 31 cached levels within the requested ~0–500 m subset.

Official source: https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/description

## Argo evidence and QC

The preserved comparison pipeline documents:

- selected profiles are delayed-mode (`DATA_MODE=D`);
- temperature source: `TEMP_ADJUSTED`;
- pressure source: `PRES_ADJUSTED`;
- salinity auxiliary source: `PSAL_ADJUSTED`;
- accepted provider QC flag: `1` for position, time, adjusted pressure, adjusted temperature and auxiliary adjusted salinity;
- bad adjusted values do not silently fall back to raw values.

Argo documentation states that adjusted variables are used when data mode is A or D and that QC flag 1 denotes good data.

Official sources:

- https://argo.ucsd.edu/data/how-to-use-argo-files/
- https://argo.ucsd.edu/data/acknowledging-argo/

## Temperature basis

The observation-side comparison temperature is potential temperature referenced to 0 dbar, derived in the preserved comparison engine from adjusted Argo fields using TEOS-10/GSW. The model field is `thetao`, identified by the NetCDF as sea-water potential temperature.

Important limitation: matching the CF physical quantity/reference does not prove exact equivalence of every equation-of-state implementation or historical temperature-scale convention used by the model. The app reports this as a limitation rather than silently asserting perfect thermodynamic identity.

## Depth conversion

Argo pressure is converted to positive-down depth with:

`depth = -gsw.z_from_p(PRES_ADJUSTED, latitude)`

The comparison configuration documents that dynamic-height and sea-surface-geopotential corrections are omitted and that no extrapolation is performed.

## Spatial collocation

For each selected profile, the engine chooses the nearest valid model water cell under the configured 10 km cap. “Valid” means the cell contains a usable temperature profile for the required vertical bracketing. The default profile is 3.851 km from its selected model cell.

This is a transparent baseline collocation method. It is not claimed to be universally optimal; bilinear sensitivity analysis remains future work.

## Vertical collocation

Model potential temperature is linearly interpolated only between adjacent valid model depths that bracket the observation depth. No vertical extrapolation is performed.

## Time treatment

The cached model time coordinate decodes to 2024-01-02 00:00 UTC. The preserved configuration/PUM evidence defines the daily field as the mean from midnight to midnight, centred at noon. No time interpolation is performed.

For the default profile:

- observation time: 2024-01-02 14:46 UTC;
- observation minus encoded model timestamp: +14.767 h;
- observation minus daily-mean midpoint: +2.767 h.

The Argo profile is effectively instantaneous relative to the model daily mean, so residuals combine model–observation differences with temporal representativeness differences.

## Metrics

For the finite accepted matched levels of one selected profile:

- `bias_i = T_model,i − T_observation,i`
- `MAE = mean(|bias_i|)`
- `RMSE = sqrt(mean(bias_i²))`

Metrics are unweighted across levels; they are not depth-thickness weighted, and vertical samples are correlated.

Default profile: 50 matched levels, MAE 0.2254 °C, RMSE 0.3188 °C.

## Interpretation

Positive bias means the model is warmer than the observation at that matched depth. Negative bias means the model is cooler.

The residual should not be described as “model error” alone: it can reflect model representation, daily-vs-instantaneous timing, spatial separation, interpolation, observation uncertainty and thermodynamic-convention differences.

## Diagnostic status

**This is a model–observation diagnostic comparison, not independent validation. The reanalysis may assimilate in-situ observations. This prototype covers one region, one day and a small set of profiles, and is not a complete Digital Twin Ocean or operational forecasting system.**
