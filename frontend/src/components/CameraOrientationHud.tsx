export type CameraPreset = "north" | "nadir" | "perspective" | "cross-section" | "basin";

interface Props {
  context: "globe" | "water-column";
  activePreset: CameraPreset;
  onPreset: (preset: CameraPreset) => void;
}

const PRESETS: Array<{ id: CameraPreset; short: string; label: string; title: string }> = [
  { id: "nadir", short: "2D", label: "Nadir", title: "Nadir plan view" },
  { id: "perspective", short: "45°", label: "Perspective", title: "Perspective 45 degree view" },
  { id: "cross-section", short: "X", label: "Cross-section", title: "Equatorial cross-section view" },
  { id: "basin", short: "FIT", label: "Basin", title: "Basin framing view" }
];

export function CameraOrientationHud({ context, activePreset, onPreset }: Props) {
  const contextLabel = context === "globe" ? "Ocean Globe" : "Water-Column 3D";
  return (
    <aside className="camera-orientation-hud" aria-label={`${contextLabel} orientation presets`} data-camera-preset={activePreset}>
      <div className="compass-rosette" aria-label={`${contextLabel} compass`}>
        <button
          type="button"
          className={activePreset === "north" ? "active compass-north" : "compass-north"}
          aria-label={`Face ${contextLabel} camera due north`}
          title="Reset heading due north"
          onClick={() => onPreset("north")}
        >
          N
        </button>
        <span className="compass-east" aria-hidden="true">E</span>
        <span className="compass-south" aria-hidden="true">S</span>
        <span className="compass-west" aria-hidden="true">W</span>
        <span className="tilt-ring" aria-hidden="true" />
      </div>
      <div className="camera-science-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={activePreset === preset.id ? "active" : ""}
            aria-pressed={activePreset === preset.id}
            aria-label={preset.title}
            title={preset.title}
            onClick={() => onPreset(preset.id)}
          >
            <span>{preset.short}</span>
            <strong>{preset.label}</strong>
          </button>
        ))}
      </div>
    </aside>
  );
}
