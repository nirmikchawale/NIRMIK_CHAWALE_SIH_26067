# OceanTwin 3D — Copernicus model subset

**Status: downloaded and inspection passed. The missing-model-data blocker is resolved.**

This package supplements the earlier `OceanTwin_3D_Dataset_Ingestion_2026-09-26` archive. That archive describes the earlier, unauthenticated state and remains unchanged. Credentials are excluded from this package.

| Item | Verified value |
|---|---|
| Product | GLOBAL_MULTIYEAR_PHY_001_030 / GLORYS12V1 |
| Daily dataset | cmems_mod_glo_phy_my_0.083deg_P1D-m |
| Version / part | 202311 / default |
| Model timestamp | 2 January 2024, 00:00 UTC; daily mean product |
| Region | 67–70°E, 12–14°N, Arabian Sea |
| Actual depth coverage | 0.494–453.938 m, 31 levels |
| Grid | 1 time × 31 depths × 25 latitudes × 37 longitudes |
| Variables | thetao, so, uo, vo |
| Raw file size | 262,514 bytes |
| Valid cells | 28,675 per variable; no missing cells in this selected tile |

## Files

- `raw/`: unchanged, read-only subset NetCDF returned by the official toolbox.
- `metadata/request.json`: exact requested bounds and variables.
- `metadata/catalogue.json`: official product/dataset/version/service metadata.
- `metadata/subset_response.json`: toolbox response and actual extents.
- `metadata/provenance.json`: acquisition timestamps, product DOI, SHA-256 and method.
- `metadata/netcdf_structure.json`: every dimension, variable, unit, fill value, packing attribute and global attribute.
- `metadata/inspection.json`: checks, physical ranges and candidate Argo profiles.
- `licences/`: previously captured Copernicus service licence, plus evidence of its original acquisition.
- `scripts/`: the acquisition and inspection scripts used in the original workspace.
- `metadata/manifest.json` and `SHA256SUMS.txt`: package integrity records.

## Inspection and interpretation

The raw checksum, actual coordinates, timestamp, dimensions, units, packed fill values, valid ranges, scale factors and offsets were checked. Independent unpacking matches the NetCDF reader. Temperature is potential temperature (`thetao`, degrees C); currents are m/s. Salinity has units `1e-3` and `unit_long=Practical Salinity Unit`; preserve this convention when matching Argo PSAL.

The request used 0–500 m with `inside` coordinate selection. Available levels begin at approximately 0.494 m and the deepest included level is 453.938 m. The toolbox's warning about requesting depth 0 was expected because no level exists at exactly 0 m. No depth value was fabricated. Do not extrapolate beyond the actual model levels; download a deeper bracketing level if comparisons must reach 500 m.

Inherited global attributes include stale dates, global rather than subset bounds, and an “Analysis and Forecast” title. They are retained unmodified. The authenticated catalogue identifies the requested reanalysis product and version; decoded coordinate arrays establish this subset's actual region and January 2024 timestamp. The source attribute is MERCATOR GLORYS12V1.

The output is about 256 KiB on disk. The toolbox response reports approximately 1,024.56 MB under `data_transfer_size`; this is its reported transfer estimate, not a measured network-byte count. The small stored subset should not be confused with remote chunk-transfer overhead.

## Argo matching readiness

Three previously curated Argo profile records fall inside the region on this date. Two, both from float **5907092**, contain **50 and 49** QC-accepted potential-temperature values within the downloaded depth range. The third profile, float **5905083**, has no accepted potential-temperature values under the current policy requiring both temperature and salinity QC. It must not be silently admitted to a potential-temperature comparison.

These are eligibility checks, not completed collocation. Next implement a temperature comparison for the two eligible profiles: spatial selection with distance recorded, an explicit daily-mean time-matching rule, vertical interpolation within model bounds, and model-minus-observation residuals. Preserve source IDs, timestamps, QC and method. Because GLORYS assimilates in-situ observations, label results **diagnostic consistency**, not independent validation.

## Reproduction

Scripts were run from the original Codex workspace root and refer to `outputs/copernicus_model_20240102` and the existing `outputs/oceantwin_ingestion` Argo package. They are execution records, not standalone scripts for an arbitrary current directory. The acquisition script refuses to overwrite its raw output. Copernicus Toolbox 2.4.1 was used; the full separate environment lockfile is included. Login credentials remain in the local Copernicus configuration and are not archived.

Official product: https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/description

Product DOI: https://doi.org/10.48670/moi-00021

Licence: https://marine.copernicus.eu/user-corner/service-commitments-and-licence
