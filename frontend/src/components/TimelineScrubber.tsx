interface TimelineObservation {
  timestamp: string;
  label: string;
}

interface Props {
  times: string[];
  currentIndex: number;
  playing: boolean;
  playbackSpeed: number;
  observations: TimelineObservation[];
  onIndexChange: (index: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onPlaybackSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.5, 1, 2, 5] as const;

function utcDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace("T", " ").replace(":00.000Z", "Z");
}

export function TimelineScrubber({
  times,
  currentIndex,
  playing,
  playbackSpeed,
  observations,
  onIndexChange,
  onPlayingChange,
  onPlaybackSpeedChange
}: Props) {
  const maximum = Math.max(0, times.length - 1);
  const index = Math.min(maximum, Math.max(0, currentIndex));
  const selectedTime = times[index] ?? "Unavailable";
  const dayToIndex = new Map(times.map((time, timeIndex) => [utcDay(time), timeIndex]));
  const markers = observations
    .map((observation) => {
      const matchedIndex = dayToIndex.get(utcDay(observation.timestamp));
      return matchedIndex == null ? null : { ...observation, matchedIndex };
    })
    .filter((marker): marker is TimelineObservation & { matchedIndex: number } => marker !== null);
  const groupedMarkers = [...markers.reduce((map, marker) => {
    const existing = map.get(marker.matchedIndex) ?? [];
    existing.push(marker.label);
    map.set(marker.matchedIndex, existing);
    return map;
  }, new Map<number, string[]>()).entries()];

  const step = (delta: number) => {
    if (times.length === 0) return;
    onIndexChange((index + delta + times.length) % times.length);
  };

  return (
    <div
      className="timeline-scrubber"
      data-playback-speed={playbackSpeed}
      data-marker-count={groupedMarkers.length}
      aria-label="Genuine ocean timeline scrubber"
    >
      <div className="timeline-now">
        <span>ACTIVE UTC STEP</span>
        <strong>{displayTime(selectedTime)}</strong>
        <small>{times.length} verified timestamp{times.length === 1 ? "" : "s"} · no synthetic time interpolation</small>
      </div>

      <div className="timeline-transport" role="group" aria-label="Timeline playback controls">
        <button type="button" aria-label="Previous genuine time step" onClick={() => step(-1)}>⏮</button>
        <button
          type="button"
          className="timeline-play-toggle"
          aria-label={playing ? "Pause genuine Explore time playback" : "Play genuine Explore time playback"}
          aria-pressed={playing}
          onClick={() => onPlayingChange(!playing)}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button type="button" aria-label="Next genuine time step" onClick={() => step(1)}>⏭</button>
      </div>

      <div className="timeline-track-shell">
        <input
          type="range"
          aria-label="Explore genuine timestamp"
          min={0}
          max={maximum}
          step={1}
          value={index}
          onChange={(event) => onIndexChange(Number(event.target.value))}
        />
        <div className="timeline-surfacing-markers" aria-label="Verified Argo surfacing date markers">
          {groupedMarkers.map(([markerIndex, labels]) => {
            const position = maximum > 0 ? (markerIndex / maximum) * 100 : 0;
            return (
              <button
                type="button"
                key={markerIndex}
                className={markerIndex === index ? "active" : ""}
                style={{ left: `${position}%` }}
                aria-label={`Argo surfacing marker at ${displayTime(times[markerIndex] ?? "")}`}
                title={labels.join(" · ")}
                onClick={() => onIndexChange(markerIndex)}
              />
            );
          })}
        </div>
      </div>

      <div className="timeline-footer">
        <div className="timeline-speed" role="group" aria-label="Timeline playback speed">
          {SPEEDS.map((speed) => (
            <button
              type="button"
              key={speed}
              className={playbackSpeed === speed ? "active" : ""}
              aria-pressed={playbackSpeed === speed}
              aria-label={`Playback speed ${speed} times`}
              onClick={() => onPlaybackSpeedChange(speed)}
            >
              {speed.toFixed(1)}×
            </button>
          ))}
        </div>
        <small>
          {groupedMarkers.length > 0
            ? `${groupedMarkers.length} timeline date${groupedMarkers.length === 1 ? "" : "s"} coincide with verified Argo surfacing records.`
            : "No verified Argo surfacing date intersects this active source window."}
        </small>
      </div>
    </div>
  );
}
