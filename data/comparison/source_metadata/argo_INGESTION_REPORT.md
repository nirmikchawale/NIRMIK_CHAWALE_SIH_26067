# OceanTwin 3D — source verification and MVP ingestion

**Result: Argo ready; glider ingested with QC restrictions; INCOIS and Copernicus blocked; dataset 5 unconfirmed.** No synthetic measurements, model fields, comparisons or live-data claims were created.

Acquisition occurred on **25 September 2026 UTC / 26 September 2026 India time**. Exact per-request timestamps, source URLs, methods, response headers, file sizes and SHA-256 hashes are in `metadata/access_log.jsonl` and `metadata/manifest.json`. The clock reported by the execution environment is used; observation dates are separate.

| Source | Verified result | Local data / next action |
|---|---|---|
| 1. INCOIS LAS | UI and THREDDS catalogues accessible over verified HTTPS using Windows trust. Python's certificate chain failed. Three linked OPeNDAP DDS/DAS requests returned no bytes within 40 seconds each. | Discovery metadata only. No measurement files. A working dataset-specific OPeNDAP/export URL and its reuse licence are needed. No evidence of an authentication challenge was observed; credentials would not necessarily fix these timeouts. |
| 2. Copernicus `GLOBAL_MULTIYEAR_PHY_001_030` | Official product, daily dataset ID and service/licence pages verified. | No model download: no standard local credentials or named credential environment variables were present. A prepared small subset request is saved. |
| 3. Ifremer / Argo | Original regional daily NetCDF files retrieved from Ifremer's HTTPS GDAC endpoint. | **26 profiles, 23 floats, 5,259 depth levels**, 60–100°E, 0–25°N, 1–3 January 2024, 0–500 m. **5,257 temperature and 4,046 salinity levels pass the strict QC policy.** |
| 4. Ifremer glider v2 | Anonymous FTP directory, original mission NetCDF, mission JSON and Ifremer ERDDAP subset verified. | Bellatrix / BoBBLE, Bay of Bengal. **7,637 records** on 3 July 2016 at 0–500 m ingested for inspection; **zero accepted comparison records**, because source QC flags are missing. |
| 5. Unspecified in-situ collection | Identity and licence still unspecified. | Research only: Copernicus global in-situ product and CORA are explicitly **unconfirmed candidates**. No candidate measurement data were downloaded. |

## What is saved

```text
raw/argo/                     3 unchanged Indian Ocean daily NetCDF files
raw/glider/                   original Bellatrix mission + unchanged ERDDAP response
curated/argo/v1/               profile catalogue, complete selected levels, 26 profile JSON assets
curated/glider/v1/             observations_quarantined.jsonl
metadata/discovery/            source catalogues and mission attribution
metadata/licences/             captured licence pages and DOI registration records
metadata/*_structure.json      full dimensions, variables, units, fill values and attributes
metadata/*_summary.json        subset limits, QC counts and processing decisions
metadata/access_log.jsonl      successful and failed access attempts
metadata/manifest.json         file inventory, checksums, provenance and lineage
metadata/validation.json       verification results
scripts/                      reproducible local transformations and verification
```

Raw measurement files total **57,546,704 bytes (54.88 MiB)**. They retain provider bytes and are marked read-only; fetch code refuses existing paths. This is local immutability by convention and file attribute, not a WORM storage guarantee. SHA-256 checks detect changes.

The raw acquisition unit is a **regional provider granule**: three Indian Ocean days for Argo and one 14-day Bay of Bengal glider mission. These originals retain full sampled depth (glider reaches about 1,017 dbar); depth trimming is applied to curated products. This preserves original QC/calibration metadata. No global measurement archive was downloaded. The additional 0.4 MB ERDDAP response is an actual server-side day/region/pressure subset, retained as evidence of metadata defects. It is not the source of the final glider records.

## Scientific processing and caveats

- Argo originals are NetCDF3 classic, `Argo-3.1 CF-1.6`, with profile/level arrays, raw and adjusted pressure, temperature and salinity, uncertainty arrays, platform/cycle/direction, calibration information and QC. The original files contain 209 basin-wide profile records; the curated regional selection contains 26. Detailed dimensions are in `argo_structure.json`.
- Argo delayed/adjusted mode selects adjusted arrays; real-time mode selects original arrays. Only provider QC **1** passes for position, time, pressure and each measurement. Bad/missing adjusted values never fall back silently to raw. The subset has 24 delayed-mode and 2 real-time profiles. Bad values remain in inspection records, with acceptance false and usable values null. There are 1,213 selected salinity QC-4 and 2 temperature QC-4 levels.
- Depth is positive down in metres, computed with `-gsw.z_from_p(pressure_dbar, latitude)` without dynamic-height correction. Pressure is retained separately. Argo `TEMP` is in-situ temperature; an explicitly labelled potential-temperature-at-0-dbar field is derived only when accepted temperature and salinity are both available. Do not compare in-situ temperature directly with Copernicus `thetao` without reconciling definitions.
- Glider original: EGO format 1.2, 193,458 time samples; `PRES`, `TEMP`, `PSAL`, position, phase, uncertainty and QC variables are retained. The selected region is 87–89°E, 7–9°N. Every examined original QC array is fill value **-128**, not QC 1. Original `TIME` incorrectly has `valid_max=90000` despite being epoch seconds. Curated UTC uses valid `JULD` units and agrees independently with stored epoch time within 1 ms. Original attributes remain unchanged.
- The ERDDAP aggregate incorrectly assigns the Norwegian UFO project and mode A to this mission. The FTP original identifies mode R; mission JSON confirms **BoBBLE**, Bellatrix, owner SAMS. The mission JSON supplies a contact, while original PI/project string variables are blank. These conflicts are documented, not silently rewritten.
- The Argo and glider examples use **different historical periods**. They are independent development fixtures, not a coincident observing campaign. The glider subset is excluded from accepted scientific comparisons.
- Copernicus reanalysis assimilates in-situ profiles. Future model/Argo residuals must be labelled **diagnostic consistency**, not independent validation. No bias/RMSE or model collocation was computed in this ingestion.
- Serve the bounded Argo profile JSON assets through the backend. Raw NetCDF stays in backend storage. Quarantined glider values must remain visibly unverified and must not be represented as accepted observations.

## Licences and attribution

| Source | Licence evidence |
|---|---|
| Argo | DOI **10.17882/42182** registration explicitly states **CC BY 4.0**. Cite Argo GDAC, the DOI, the original URLs and retrieval dates. This acquisition is from mutable live GDAC files, not a registered monthly DOI snapshot. |
| Glider | DOI **10.17882/56509** registration states **CC BY 4.0** for OceanGliders GDAC. The ERDDAP metadata separately carries legacy CLIVAR terms requiring citation and PI contact before commercial use. Original mission has no explicit licence attribute. Preserve both statements and resolve their applicability before external redistribution/commercial use; do not replace this ambiguity with an invented unrestricted licence. |
| Copernicus | Full service commitments/licence page captured; use its attribution obligations and cite product DOI **10.48670/moi-00021** when data are downloaded. |
| INCOIS | No dataset-specific reuse licence verified from the inspected catalogues. The LAS footer's NOAA privacy/disclaimer links are not an INCOIS data licence. |
| Dataset 5 | Not assigned. Candidate terms are evidence only, not confirmation of the intended source. |

Official references: [Argo acknowledgement](https://argo.ucsd.edu/data/acknowledging-argo/), [Argo DOI metadata](https://api.datacite.org/dois/10.17882/42182), [OceanGliders DOI metadata](https://api.datacite.org/dois/10.17882/56509), [Copernicus licence](https://marine.copernicus.eu/user-corner/service-commitments-and-licence), [Copernicus daily service](https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/services).

## Complete the blocked sources

**Copernicus:** register/sign in to a Copernicus Marine account and authenticate locally using `copernicusmarine login` (account username or email and password). Do not put credentials into this report or chat. The official Toolbox was not installed or invoked for a data request in this run; authentication requirements are documented by the provider, not inferred from a fabricated 401 response. Install it in a suitable local environment, then execute the prepared request. The verified daily dataset ID is `cmems_mod_glo_phy_my_0.083deg_P1D-m`.

```powershell
copernicusmarine login
copernicusmarine subset --dataset-id cmems_mod_glo_phy_my_0.083deg_P1D-m --variable thetao --variable so --variable uo --variable vo --minimum-longitude 67 --maximum-longitude 70 --minimum-latitude 12 --maximum-latitude 14 --minimum-depth 0 --maximum-depth 500 --start-datetime 2024-01-02T00:00:00 --end-datetime 2024-01-02T23:59:59 --output-directory outputs/oceantwin_ingestion/raw/copernicus --output-filename glorys12_20240102_67E70E_12N14N_0m500m.nc
```

Run from the workspace root. Before ingesting the result, record the actual dataset version, service URL and retrieval timestamp; checksum and preserve the response; verify variables, units, masks and coordinate extents. The request is also saved in `metadata/copernicus_subset_request.json`. The tile includes three selected Argo records from 2 January 2024.

**INCOIS:** retry the exact failed URLs recorded in the access log, or obtain a working dataset export/OPeNDAP URL and applicable licence from INCOIS. The listed catalogue paths are `las/ocean_atlas_subset/data_ocean_atlas_subset.jnl` and `las/levitus_climatology_cdf/data_levitus_climatology.jnl`. This run does not establish that all INCOIS products are unavailable.

**Glider:** obtain provider-reviewed QC or a different approved mission with populated QC flags, and clarify the conflicting licence metadata. Keep this sample quarantined in the meantime.

**Dataset 5:** supply the intended collection's official URL/product/release and licence, or explicitly select one of the two candidates in `metadata/dataset5_unconfirmed.json`.

The attached data-pipeline and dataset-analysis documents were read and their relevant requirements followed. Nothing was deployed or loaded into a running OceanTwin application or database; the deliverable is a local, inspected ingestion package.
