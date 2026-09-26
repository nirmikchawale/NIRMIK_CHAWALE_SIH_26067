# SIH PPT Content — No Streamlit Screenshots

The official presentation constraint for this project is treated as: **do not use Streamlit UI screenshots in the PPT**. Use native diagrams, charts, tables and concise text. Demonstrate the app live.

## Slide 1 — OceanTwin 3D

**One-liner:** Explainable water-column diagnostics connecting a Copernicus model subset with QC-screened Argo observations.

**Native visual:** Ocean column icon/diagram with model grid + float profile.

**Speaker note:** “We are not presenting a complete Digital Twin Ocean; this is a focused diagnostic layer that makes model–observation comparison interactive and traceable.”

**Avoid:** real-time, forecasting, AI or global-coverage claims.

## Slide 2 — Problem

- Gridded reanalysis and in-situ profiles have different spatial, vertical and temporal structures.
- A number alone does not explain where a model and observation agree or differ through depth.
- Comparison must preserve QC, collocation method and provenance to be scientifically interpretable.

**Native visual:** two disconnected blocks (“Model grid” / “Argo profile”) converging on a question mark.

## Slide 3 — Focused solution

- Local offline Streamlit/Plotly explorer.
- Temperature diagnostic first; unfinished variables remain roadmap only.
- Links collocation context, depth profile, bias and provenance in one workflow.

**Native visual:** four-block product flow.

## Slide 4 — Data foundation

- Copernicus `GLOBAL_MULTIYEAR_PHY_001_030` / GLORYS12V1.
- 2 Jan 2024 subset, 67–70°E and 12–14°N.
- Cached `thetao`: 31 depths from ~0.49 to 454 m.
- 26 Argo profiles ingested; 2 eligible under the current comparison criteria.

**Native visual:** source cards + small region schematic.

## Slide 5 — Methodology

Native flowchart:

`Argo adjusted fields + QC=1` → `Pressure→depth + potential temperature` → `Nearest valid model water cell` → `Linear interpolation to Argo depths` → `Matched-level residuals` → `MAE / RMSE / bias-by-depth`

Add: no vertical extrapolation; daily model field vs instantaneous profile remains a limitation.

## Slide 6 — Application architecture

Native architecture:

`Bundled NetCDF + verified CSV/JSON` → `Validated local loaders` → `Single selected-profile evidence bundle` → `Plotly scientific views + Streamlit controls` → `Localhost live demo + evidence downloads`

Cross-cutting bars: `offline`, `read-only evidence`, `tests`, `provenance`.

## Slide 7 — Verified result

Metric callout for default profile:

- Float 5907092, cycle 13 descending.
- 50 matched levels, ~1.4–447 m.
- 3.851 km nearest-cell separation.
- MAE 0.2254 °C; RMSE 0.3188 °C.
- Observation +2.767 h from daily-mean midpoint.

**Native visual:** recreate the profile/bias result as a chart directly from the scientific CSV, not a screenshot of the app.

**Avoid:** “high accuracy proven”, “validated model”, or interpreting all residual as model error.

## Slide 8 — Explainability and limits

- Every displayed profile has identity, QC, time, location and model-cell provenance.
- Bias sign is explicit: Model − Observation.
- Reanalysis assimilates in-situ T/S profiles, so this is not independent validation.
- Limited to one day, one region and two eligible profiles.

**Native visual:** provenance checklist + limitation callout.

## Slide 9 — Innovation and impact

Defensible innovation:

- water-column-first model–observation explanation;
- collocation shown rather than hidden;
- depth-resolved residuals and provenance beside the visualisation;
- reproducible offline demo built from real scientific evidence.

Roadmap: salinity, currents, gliders, bilinear sensitivity, wider Indian EEZ, scheduled refresh.

**Avoid:** claiming these roadmap features are implemented.

## Slide 10 — Closing

**Closing statement:** “OceanTwin 3D turns a traceable scientific comparison into an interactive water-column explanation, while making its assumptions and limitations visible.”

Acknowledgements/sources:

- Copernicus Marine Global Ocean Physics Reanalysis: https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/description
- DOI: https://doi.org/10.48670/moi-00021
- Argo data acknowledgement: https://argo.ucsd.edu/data/acknowledging-argo/
- Argo data-use/QC guidance: https://argo.ucsd.edu/data/how-to-use-argo-files/
- Argo DOI: https://doi.org/10.17882/42182

## 20 judge Q&A

1. **What is OceanTwin 3D?** Technical: a local model–observation diagnostic prototype. Spoken: “It connects one real Copernicus subset with QC-screened Argo profiles and explains the comparison through depth.” Avoid: “full digital twin.”
2. **Why temperature only?** Technical: it is the only variable with a completed, tested end-to-end comparison path. Spoken: “We chose one variable and made it scientifically traceable before expanding.” Avoid: implying salinity/current validation is complete.
3. **Why only two profiles?** Technical: 26 were ingested, but two met this date/region/QC/comparison eligibility configuration. Spoken: “Two are eligible for this exact demo setup, not two in the ocean.” Avoid: saying only two Argo profiles exist.
4. **Why Argo?** Technical: direct vertical in-situ profiles with explicit QC and adjusted fields. Spoken: “Argo gives us real water-column observations with documented quality flags.” Avoid: calling every Argo value ground truth.
5. **What is GLORYS12V1?** Technical: Copernicus Marine global physical reanalysis at nominal 1/12°. Spoken: “It is a global ocean reanalysis product from Copernicus Marine.” Avoid: calling it an observation dataset.
6. **What is `thetao`?** Technical: NetCDF metadata identifies it as sea-water potential temperature. Spoken: “It is the model’s potential-temperature field in degrees Celsius.” Avoid: calling it arbitrary surface temperature.
7. **Why nearest cell?** Technical: transparent baseline collocation with a distance cap and valid-water requirement. Spoken: “For the MVP we use the nearest valid model water cell and show the distance instead of hiding it.” Avoid: claiming it is universally best.
8. **Why 3.851 km?** Technical: Haversine distance between the selected Argo position and chosen model-cell centre. Spoken: “That is the actual spatial separation for the default profile.” Avoid: saying the locations are identical.
9. **Why linear interpolation?** Technical: model levels do not exactly match observation depths; interpolation uses adjacent valid brackets only. Spoken: “It compares both at the observation depth rather than snapping to the nearest model level.” Avoid: claiming no interpolation uncertainty.
10. **Why no bilinear interpolation?** Technical: held as a future sensitivity analysis to keep the verified baseline stable. Spoken: “We froze one transparent baseline first; bilinear sensitivity is roadmap.” Avoid: saying bilinear would never matter.
11. **What is bias?** Technical: `T_model − T_observation`. Spoken: “Positive means model warmer; negative means model cooler.” Avoid: reversing the sign.
12. **What is MAE?** Technical: mean absolute matched-level temperature difference. Spoken: “Average size of the difference, ignoring sign.” Avoid: saying it proves accuracy everywhere.
13. **What is RMSE?** Technical: root mean square matched-level difference; larger deviations receive more weight. Spoken: “Like MAE, but more sensitive to larger mismatches.” Avoid: interpreting it as uncertainty.
14. **Why is RMSE higher than MAE?** Technical: squaring gives larger residuals more influence. Spoken: “A few larger differences pull RMSE upward.” Avoid: saying higher RMSE means the calculation is wrong.
15. **Is this model validation?** Technical: no; the reanalysis assimilates in-situ profiles, so independence is not guaranteed. Spoken: “We deliberately call it a diagnostic comparison, not independent validation.” Avoid: “we validated Copernicus.”
16. **What about the 14.767-hour offset?** Technical: that is relative to the encoded model timestamp; the daily field is a 24-hour mean centred at noon, making the profile +2.767 h from the midpoint. Spoken: “The field is daily mean, so we show both timestamp references and keep timing as a limitation.” Avoid: treating a daily mean as an instantaneous noon state.
17. **Why offline?** Technical: reproducible cached evidence and no judging-time API failure. Spoken: “It makes the scientific demo deterministic even without Wi-Fi.” Avoid: claiming production systems should never refresh data.
18. **Why Streamlit and Plotly?** Technical: low-complexity local scientific UI with interactive charts and minimal deployment risk. Spoken: “They let us focus on scientific traceability rather than building unnecessary infrastructure.” Avoid: claiming they are the only possible stack.
19. **Can it scale?** Technical: the architecture can extend, but current evidence covers one subset/day and two profiles. Spoken: “The workflow is extensible; the present scientific claims stay limited to this verified subset.” Avoid: claiming current national/global operational scale.
20. **What is the next scientific step?** Technical: sensitivity/coverage expansion only after MVP freeze, including bilinear spatial sensitivity and more profiles/dates. Spoken: “First freeze the reliable diagnostic; then test how conclusions change under broader collocation and coverage.” Avoid: presenting roadmap work as completed.
