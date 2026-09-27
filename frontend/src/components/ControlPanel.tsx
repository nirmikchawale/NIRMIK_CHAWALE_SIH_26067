import type { Catalog, ColorPalette, ColorScaleMode, ProfileSummary, ViewMode, VisualizationMode } from "../types";

interface Props {
  catalog: Catalog;
  profiles: ProfileSummary[];
  sourceMode: "glorys" | "incois";
  operationalAvailable: boolean;
  variable: "thetao" | "so" | "currents";
  viewMode: ViewMode;
  visualizationMode: VisualizationMode;
  waterColumnOpacity: number;
  depthIndex: number;
  timeIndex: number;
  verticalExaggeration: number;
  selectedProfileId: string;
  playing: boolean;
  colorPalette: ColorPalette;
  colorScale: ColorScaleMode;
  colorMinimum: number;
  colorMaximum: number;
  isoSurfaceEnabled: boolean;
  isoValue: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSourceModeChange: (value: "glorys" | "incois") => void;
  onVariableChange: (value: "thetao" | "so" | "currents") => void;
  onViewModeChange: (value: ViewMode) => void;
  onWaterColumnOpacityChange: (value: number) => void;
  onDepthChange: (value: number) => void;
  onTimeChange: (value: number) => void;
  onVerticalExaggerationChange: (value: number) => void;
  onProfileChange: (value: string) => void;
  onPlayingChange: (value: boolean) => void;
  onColorPaletteChange: (value: ColorPalette) => void;
  onColorScaleChange: (value: ColorScaleMode) => void;
  onColorMinimumChange: (value: number) => void;
  onColorMaximumChange: (value: number) => void;
  onIsoSurfaceEnabledChange: (value: boolean) => void;
  onIsoValueChange: (value: number) => void;
}

export function ControlPanel({
  catalog,
  profiles,
  sourceMode,
  operationalAvailable,
  variable,
  viewMode,
  visualizationMode,
  waterColumnOpacity,
  depthIndex,
  timeIndex,
  verticalExaggeration,
  selectedProfileId,
  playing,
  colorPalette,
  colorScale,
  colorMinimum,
  colorMaximum,
  isoSurfaceEnabled,
  isoValue,
  mobileOpen,
  onMobileClose,
  onSourceModeChange,
  onVariableChange,
  onViewModeChange,
  onWaterColumnOpacityChange,
  onDepthChange,
  onTimeChange,
  onVerticalExaggerationChange,
  onProfileChange,
  onPlayingChange,
  onColorPaletteChange,
  onColorScaleChange,
  onColorMinimumChange,
  onColorMaximumChange,
  onIsoSurfaceEnabledChange,
  onIsoValueChange
}: Props) {
  const depth = catalog.coordinates.depth[depthIndex] ?? 0;
  const time = catalog.coordinates.time[timeIndex] ?? "Unavailable";
  const scalar = variable !== "currents";

  return (
    <aside
      className="control-panel"
      data-mobile-open={mobileOpen ? "true" : "false"}
      aria-label="Scientific explorer controls"
    >
      <div className="mobile-sheet-header">
        <div>
          <span>EXPLORER CONTROLS</span>
          <strong>Layer · depth · time · observations</strong>
        </div>
        <button type="button" onClick={onMobileClose} aria-label="Close explorer controls">
          Close
        </button>
      </div>
      <section className="explore-source-section">
        <div className="section-kicker">Scientific source</div>
        <div className="segmented explore-source-selector" aria-label="Explore scientific source">
          <button
            type="button"
            className={sourceMode === "glorys" ? "active" : ""}
            aria-pressed={sourceMode === "glorys"}
            onClick={() => onSourceModeChange("glorys")}
          >
            GLORYS baseline
          </button>
          <button
            type="button"
            className={sourceMode === "incois" ? "active" : ""}
            aria-pressed={sourceMode === "incois"}
            disabled={!operationalAvailable}
            onClick={() => onSourceModeChange("incois")}
          >
            INCOIS multi-time
          </button>
        </div>
        <p className="microcopy">
          {sourceMode === "incois"
            ? "Build-verified INCOIS analysis · genuine timestamps and depths · source values unchanged."
            : "Immutable GLORYS12V1 baseline · one verified model timestamp · Argo diagnostic comparison enabled."}
        </p>
      </section>

      <section>
        <div className="section-kicker">Explore</div>
        <div className="variable-switcher" aria-label="Ocean variable">
          {catalog.variables.map((item) => (
            <button
              key={item.id}
              className={variable === item.id ? "active" : ""}
              aria-pressed={variable === item.id}
              onClick={() => onVariableChange(item.id as "thetao" | "so" | "currents")}
            >
              <span>{item.label}</span>
              <small>{item.units}</small>
            </button>
          ))}
        </div>
        {catalog.variables.find((item) => item.id === variable) && (
          <p className="active-range">
            Verified range{" "}
            <strong>
              {catalog.variables.find((item) => item.id === variable)?.minimum.toFixed(3)}
              {" – "}
              {catalog.variables.find((item) => item.id === variable)?.maximum.toFixed(3)}
              {" "}
              {catalog.variables.find((item) => item.id === variable)?.units}
            </strong>
          </p>
        )}

        <details className="advanced-control-group">
          <summary>
            <span>View settings</span>
            <small>3D mode · rendering · vertical display</small>
          </summary>
          <div className="advanced-control-body">
            <div className="section-kicker visualization-kicker">Active 3D mode</div>
            <div className="active-3d-mode-card">
              <strong>{visualizationMode === "globe" ? "Geographic View" : "Water Column 3D"}</strong>
              <span>
                {visualizationMode === "globe"
                  ? "Geospatial context with depth-aware scientific overlays."
                  : "Scientific lon/lat/depth box using canonical model volume values."}
              </span>
              <small>Switch views from the persistent visualization dock.</small>
            </div>

            {visualizationMode === "globe" && (
              <div className="segmented field-mode-selector" aria-label="Globe field mode">
                <button
                  className={viewMode === "slice" ? "active" : ""}
                  disabled={!scalar}
                  onClick={() => onViewModeChange("slice")}
                >
                  Depth slice
                </button>
                <button
                  className={viewMode === "volume" ? "active" : ""}
                  disabled={!scalar}
                  onClick={() => onViewModeChange("volume")}
                >
                  3D field
                </button>
              </div>
            )}

            {visualizationMode === "water-column" && scalar && (
              <label className="opacity-control">
                <span className="label-row">
                  <span>Point opacity</span>
                  <strong>{waterColumnOpacity}%</strong>
                </span>
                <input
                  type="range"
                  min={15}
                  max={95}
                  value={waterColumnOpacity}
                  onChange={(event) => onWaterColumnOpacityChange(Number(event.target.value))}
                />
              </label>
            )}

            <label>
              <span className="label-row">
                <span>Visual vertical exaggeration</span>
                <strong>{verticalExaggeration}×</strong>
              </span>
              <input
                type="range"
                min={1}
                max={100}
                value={verticalExaggeration}
                onChange={(event) => onVerticalExaggerationChange(Number(event.target.value))}
              />
            </label>

            {scalar && (
              <div className="scientific-color-editor" aria-label="Scientific colorbar editor">
                <div className="section-kicker visualization-kicker">Colorbar</div>
                <label>
                  Palette
                  <select
                    value={colorPalette}
                    onChange={(event) => onColorPaletteChange(event.target.value as ColorPalette)}
                  >
                    <option value="thermal">Thermal</option>
                    <option value="viridis">Viridis</option>
                    <option value="icefire">Ice–Fire</option>
                  </select>
                </label>
                <div className="color-range-grid">
                  <label>
                    Minimum
                    <input
                      type="number"
                      step="any"
                      value={Number.isFinite(colorMinimum) ? colorMinimum : ""}
                      onChange={(event) => onColorMinimumChange(Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Maximum
                    <input
                      type="number"
                      step="any"
                      value={Number.isFinite(colorMaximum) ? colorMaximum : ""}
                      onChange={(event) => onColorMaximumChange(Number(event.target.value))}
                    />
                  </label>
                </div>
                <div className="segmented color-scale-selector" aria-label="Color scale">
                  <button
                    className={colorScale === "linear" ? "active" : ""}
                    onClick={() => onColorScaleChange("linear")}
                  >
                    Linear
                  </button>
                  <button
                    className={colorScale === "log" ? "active" : ""}
                    disabled={colorMinimum <= 0 || colorMaximum <= 0}
                    title={colorMinimum <= 0 || colorMaximum <= 0 ? "Log scale requires a positive range" : "Logarithmic color mapping"}
                    onClick={() => onColorScaleChange("log")}
                  >
                    Log
                  </button>
                </div>
                <label className="iso-toggle">
                  <span className="label-row">
                    <span>Isosurface</span>
                    <input
                      type="checkbox"
                      checked={isoSurfaceEnabled}
                      onChange={(event) => onIsoSurfaceEnabledChange(event.target.checked)}
                    />
                  </span>
                </label>
                {isoSurfaceEnabled && (
                  <label>
                    <span className="label-row">
                      <span>Iso value</span>
                      <strong>{isoValue.toFixed(3)} {catalog.variables.find((item) => item.id === variable)?.units}</strong>
                    </span>
                    <input
                      type="range"
                      min={catalog.variables.find((item) => item.id === variable)?.minimum ?? 0}
                      max={catalog.variables.find((item) => item.id === variable)?.maximum ?? 1}
                      step={Math.max(
                        ((catalog.variables.find((item) => item.id === variable)?.maximum ?? 1) -
                          (catalog.variables.find((item) => item.id === variable)?.minimum ?? 0)) / 200,
                        0.0001
                      )}
                      value={isoValue}
                      onChange={(event) => onIsoValueChange(Number(event.target.value))}
                    />
                  </label>
                )}
                <p className="microcopy">
                  Palette, range and scale affect rendering only. Isosurface geometry is extracted from the genuine scalar water-column values.
                </p>
              </div>
            )}

            {!scalar ? (
              <p className="microcopy warning">
                Water-column 3D is scalar-only. Currents stay on the globe because the bundled
                evidence contains horizontal u/v only—no vertical current is invented.
              </p>
            ) : (
              <p className="microcopy">
                Opacity and vertical exaggeration change display geometry only; scientific values
                and depth metres remain unchanged.
              </p>
            )}
          </div>
        </details>
      </section>

      <section>
        <div className="section-kicker">Water column</div>
        <label>
          <span className="label-row">
            <span>Depth</span>
            <strong>{depth.toFixed(2)} m</strong>
          </span>
          <input
            type="range"
            aria-label="Model depth"
            min={0}
            max={catalog.coordinates.depth.length - 1}
            value={depthIndex}
            onChange={(event) => onDepthChange(Number(event.target.value))}
          />
        </label>

      </section>

      <section>
        <div className="section-kicker">Time</div>
        {catalog.capabilities.time_animation ? (
          <>
            <div className="time-row">
              <button
                className="play-button"
                onClick={() => onPlayingChange(!playing)}
                title="Play verified time steps"
              >
                {playing ? "■" : "▶"}
              </button>
              <div>
                <strong>{time.replace("T00:00:00Z", "")}</strong>
                <span>
                  {catalog.capabilities.time_steps} verified timesteps
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, catalog.coordinates.time.length - 1)}
              value={timeIndex}
              onChange={(event) => onTimeChange(Number(event.target.value))}
            />
          </>
        ) : (
          <div className="time-row static-time-row" aria-label="Verified model timestamp">
            <div>
              <strong>{time.replace("T00:00:00Z", "")}</strong>
              <span>Verified model timestamp · static snapshot</span>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="section-kicker">Observations</div>
        <label>
          Argo profile
          <select
            value={selectedProfileId}
            disabled={profiles.length === 0}
            onChange={(event) => onProfileChange(event.target.value)}
          >
            {profiles.length === 0 && <option value="">No verified profile available</option>}
            {profiles.map((profile) => (
              <option key={profile.profile_id} value={profile.profile_id}>
                {profile.platform_id} · cycle {profile.cycle} {profile.direction}
              </option>
            ))}
          </select>
        </label>
        <p className={`microcopy ${profiles.length === 0 ? "warning" : ""}`}>
          {profiles.length === 0
            ? "Observation layer unavailable; verified model fields remain usable."
            : "Markers on the globe are also clickable."}
        </p>
      </section>

      <section className="source-card">
        <div className="section-kicker">Source status</div>
        <strong>{catalog.dataset.label}</strong>
        <span>{catalog.dataset.product}</span>
        <div className="badges">
          <span className="badge">REANALYSIS</span>
          <span className="badge success">CACHED VERIFIED</span>
        </div>
        <small>{catalog.dataset.region}</small>
      </section>
    </aside>
  );
}
