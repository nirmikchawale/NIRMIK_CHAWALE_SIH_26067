import type { Catalog, ProfileSummary, ViewMode } from "../types";

interface Props {
  catalog: Catalog;
  profiles: ProfileSummary[];
  variable: "thetao" | "so" | "currents";
  viewMode: ViewMode;
  depthIndex: number;
  timeIndex: number;
  verticalExaggeration: number;
  selectedProfileId: string;
  playing: boolean;
  onVariableChange: (value: "thetao" | "so" | "currents") => void;
  onViewModeChange: (value: ViewMode) => void;
  onDepthChange: (value: number) => void;
  onTimeChange: (value: number) => void;
  onVerticalExaggerationChange: (value: number) => void;
  onProfileChange: (value: string) => void;
  onPlayingChange: (value: boolean) => void;
}

export function ControlPanel({
  catalog,
  profiles,
  variable,
  viewMode,
  depthIndex,
  timeIndex,
  verticalExaggeration,
  selectedProfileId,
  playing,
  onVariableChange,
  onViewModeChange,
  onDepthChange,
  onTimeChange,
  onVerticalExaggerationChange,
  onProfileChange,
  onPlayingChange
}: Props) {
  const depth = catalog.coordinates.depth[depthIndex] ?? 0;
  const time = catalog.coordinates.time[timeIndex] ?? "Unavailable";
  const scalar = variable !== "currents";

  return (
    <aside className="control-panel">
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

        <div className="segmented" aria-label="Visualization mode">
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
        {!scalar && <p className="microcopy">Currents use selected-depth vector glyphs.</p>}
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
        <p className="microcopy">
          Geometry only. Scientific depth values remain metres positive downward.
        </p>
      </section>

      <section>
        <div className="section-kicker">Time</div>
        <div className="time-row">
          <button
            className="play-button"
            disabled={!catalog.capabilities.time_animation}
            onClick={() => onPlayingChange(!playing)}
            title={
              catalog.capabilities.time_animation
                ? "Play verified time steps"
                : "Only one verified model time step is currently bundled"
            }
          >
            {playing ? "■" : "▶"}
          </button>
          <div>
            <strong>{time.replace("T00:00:00Z", "")}</strong>
            <span>
              {catalog.capabilities.time_steps} verified timestep
              {catalog.capabilities.time_steps === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, catalog.coordinates.time.length - 1)}
          value={timeIndex}
          disabled={catalog.coordinates.time.length < 2}
          onChange={(event) => onTimeChange(Number(event.target.value))}
        />
        {!catalog.capabilities.time_animation && (
          <p className="microcopy warning">
            Playback is intentionally disabled—no synthetic second timestamp is created.
          </p>
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
