import { gradientCss, paletteLabel } from "../colorScale";
import type { ScientificSourceMode } from "../incois";
import type { Catalog, ColorPaletteId, ColorScaleMode, ColorTransfer, ProfileSummary, ViewMode, VisualizationMode } from "../types";

interface Props {
  catalog: Catalog;
  profiles: ProfileSummary[];
  sourceMode: ScientificSourceMode;
  sourceStatus: "idle" | "connecting" | "ready" | "error";
  sourceError: string;
  variable: "thetao" | "so" | "currents";
  viewMode: ViewMode;
  visualizationMode: VisualizationMode;
  waterColumnOpacity: number;
  depthIndex: number;
  timeIndex: number;
  verticalExaggeration: number;
  colorTransfer: ColorTransfer;
  selectedProfileId: string;
  playing: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSourceModeChange: (value: ScientificSourceMode) => void | Promise<void>;
  onVariableChange: (value: "thetao" | "so" | "currents") => void;
  onViewModeChange: (value: ViewMode) => void;
  onWaterColumnOpacityChange: (value: number) => void;
  onDepthChange: (value: number) => void;
  onTimeChange: (value: number) => void;
  onVerticalExaggerationChange: (value: number) => void;
  onColorPaletteChange: (value: ColorPaletteId) => void;
  onColorScaleChange: (value: ColorScaleMode) => void;
  onColorMinimumChange: (value: number) => void;
  onColorMaximumChange: (value: number) => void;
  onIsosurfaceValueChange: (value: number) => void;
  onProfileChange: (value: string) => void;
  onPlayingChange: (value: boolean) => void;
}

export function ControlPanel({
  catalog,
  profiles,
  sourceMode,
  sourceStatus,
  sourceError,
  variable,
  viewMode,
  visualizationMode,
  waterColumnOpacity,
  depthIndex,
  timeIndex,
  verticalExaggeration,
  colorTransfer,
  selectedProfileId,
  playing,
  mobileOpen,
  onMobileClose,
  onSourceModeChange,
  onVariableChange,
  onViewModeChange,
  onWaterColumnOpacityChange,
  onDepthChange,
  onTimeChange,
  onVerticalExaggerationChange,
  onColorPaletteChange,
  onColorScaleChange,
  onColorMinimumChange,
  onColorMaximumChange,
  onIsosurfaceValueChange,
  onProfileChange,
  onPlayingChange
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
      <section className="source-mode-section">
        <div className="section-kicker">Scientific source</div>
        <div className="source-mode-switcher" aria-label="Scientific data source">
          <button
            type="button"
            className={sourceMode === "copernicus" ? "active" : ""}
            aria-pressed={sourceMode === "copernicus"}
            onClick={() => onSourceModeChange("copernicus")}
          >
            <strong>Copernicus Verified</strong>
            <small>Offline GLORYS12V1 · deterministic</small>
          </button>
          <button
            type="button"
            className={sourceMode === "incois" ? "active" : ""}
            aria-pressed={sourceMode === "incois"}
            disabled={sourceStatus === "connecting"}
            onClick={() => onSourceModeChange("incois")}
          >
            <strong>{sourceStatus === "connecting" ? "Connecting INCOIS…" : "INCOIS Live"}</strong>
            <small>Official ERDDAP · OPeNDAP · multi-time</small>
          </button>
        </div>
        <p className={`microcopy ${sourceStatus === "error" ? "warning" : ""}`}>
          {sourceMode === "incois"
            ? "Operational TEMP/SAL objective-analysis fields are loaded directly from INCOIS. The verified Copernicus source remains one click away."
            : sourceStatus === "error"
              ? `INCOIS live probe failed: ${sourceError || "external service unavailable"}. Verified Copernicus data remains active.`
              : "Switch to INCOIS Live for genuine multi-time Indian Ocean operational-source data."}
        </p>
      </section>

      <section>
        <div className="section-kicker">Explore</div>
        <div className="variable-switcher" aria-label="Ocean variable">
          {catalog.variables.map((item) => (
            <button
              key={item.id}
              className={variable === item.id ? "active" : ""}
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
              <div className="segmented field-mode-selector three-way" aria-label="Globe field mode">
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
                <button
                  className={viewMode === "isosurface" ? "active" : ""}
                  disabled={!scalar}
                  onClick={() => onViewModeChange("isosurface")}
                >
                  Isosurface
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

            {scalar && (
              <div className="transfer-editor" data-scale={colorTransfer.scale}>
                <div className="section-kicker visualization-kicker">Colorbar & isosurface</div>
                <div
                  className="transfer-gradient"
                  style={{ background: gradientCss(colorTransfer.palette) }}
                  aria-label={`${paletteLabel(colorTransfer.palette)} color palette preview`}
                />
                <div className="transfer-grid">
                  <label>
                    Palette
                    <select
                      aria-label="Color palette"
                      value={colorTransfer.palette}
                      onChange={(event) => onColorPaletteChange(event.target.value as ColorPaletteId)}
                    >
                      <option value="thermal">Thermal</option>
                      <option value="haline">Haline</option>
                      <option value="viridis">Viridis</option>
                      <option value="icefire">Ice–Fire</option>
                    </select>
                  </label>
                  <label>
                    Scale
                    <select
                      aria-label="Color scale"
                      value={colorTransfer.scale}
                      onChange={(event) => onColorScaleChange(event.target.value as ColorScaleMode)}
                    >
                      <option value="linear">Linear</option>
                      <option value="log" disabled={colorTransfer.minimum <= 0}>Logarithmic</option>
                    </select>
                  </label>
                  <label>
                    Minimum
                    <input
                      aria-label="Color minimum"
                      type="number"
                      step="any"
                      value={colorTransfer.minimum}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isFinite(value) && value < colorTransfer.maximum) onColorMinimumChange(value);
                      }}
                    />
                  </label>
                  <label>
                    Maximum
                    <input
                      aria-label="Color maximum"
                      type="number"
                      step="any"
                      value={colorTransfer.maximum}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isFinite(value) && value > colorTransfer.minimum) onColorMaximumChange(value);
                      }}
                    />
                  </label>
                </div>
                <label className="isosurface-control">
                  <span className="label-row">
                    <span>Isosurface threshold</span>
                    <strong>{colorTransfer.isosurfaceValue.toFixed(3)} {catalog.variables.find((item) => item.id === variable)?.units}</strong>
                  </span>
                  <input
                    aria-label="Isosurface threshold"
                    type="range"
                    min={colorTransfer.minimum}
                    max={colorTransfer.maximum}
                    step={Math.max((colorTransfer.maximum - colorTransfer.minimum) / 200, 0.000001)}
                    value={Math.min(colorTransfer.maximum, Math.max(colorTransfer.minimum, colorTransfer.isosurfaceValue))}
                    onChange={(event) => onIsosurfaceValueChange(Number(event.target.value))}
                  />
                </label>
                <p className="microcopy">
                  Color mapping changes presentation only. Isosurface geometry is extracted from neighboring model values at the selected threshold.
                </p>
              </div>
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
          {sourceMode === "incois" ? (
            <>
              <span className="badge success">INCOIS LIVE</span>
              <span className="badge">ERDDAP / OPeNDAP</span>
            </>
          ) : (
            <>
              <span className="badge">REANALYSIS</span>
              <span className="badge success">CACHED VERIFIED</span>
            </>
          )}
        </div>
        <small>{catalog.dataset.region}</small>
      </section>
    </aside>
  );
}
