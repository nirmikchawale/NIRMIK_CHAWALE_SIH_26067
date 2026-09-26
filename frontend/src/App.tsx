import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "./api";
import { ControlPanel } from "./components/ControlPanel";
import { OceanGlobe } from "./components/OceanGlobe";
import { ProfilePanel } from "./components/ProfilePanel";
import type {
  Catalog,
  CurrentsResponse,
  FieldResponse,
  ProfileDetail,
  ProfileSummary,
  ViewMode,
  VolumeResponse
} from "./types";

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileDetail, setProfileDetail] = useState<ProfileDetail | null>(null);

  const [variable, setVariable] = useState<"thetao" | "so" | "currents">("thetao");
  const [viewMode, setViewMode] = useState<ViewMode>("slice");
  const [depthIndex, setDepthIndex] = useState(18);
  const [timeIndex, setTimeIndex] = useState(0);
  const [verticalExaggeration, setVerticalExaggeration] = useState(60);
  const [playing, setPlaying] = useState(false);

  const [field, setField] = useState<FieldResponse | null>(null);
  const [volume, setVolume] = useState<VolumeResponse | null>(null);
  const [currents, setCurrents] = useState<CurrentsResponse | null>(null);
  const [scienceLoading, setScienceLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.health(), api.catalog(), api.profiles()])
      .then(([, catalogPayload, profilePayload]) => {
        if (cancelled) return;
        setCatalog(catalogPayload);
        setProfiles(profilePayload.profiles);
        const safeDepth = Math.min(18, catalogPayload.coordinates.depth.length - 1);
        setDepthIndex(Math.max(0, safeDepth));
        if (profilePayload.profiles.length > 0) {
          setSelectedProfileId(profilePayload.profiles[0].profile_id);
        }
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!catalog) return;
    if (!catalog.capabilities.time_animation) {
      setPlaying(false);
      return;
    }
    if (!playing) return;
    const timer = window.setInterval(() => {
      setTimeIndex((current) => (current + 1) % catalog.coordinates.time.length);
    }, 1300);
    return () => window.clearInterval(timer);
  }, [catalog, playing]);

  useEffect(() => {
    if (!selectedProfileId) return;
    let cancelled = false;
    setProfileLoading(true);
    api
      .profile(selectedProfileId)
      .then((payload) => {
        if (!cancelled) setProfileDetail(payload);
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProfileId]);

  useEffect(() => {
    if (!catalog) return;
    let cancelled = false;
    setScienceLoading(true);
    setError("");
    setField(null);
    setVolume(null);
    setCurrents(null);

    const request =
      variable === "currents"
        ? api.currents(timeIndex, depthIndex).then((payload) => {
            if (!cancelled) setCurrents(payload);
          })
        : viewMode === "volume"
          ? api.volume(variable, timeIndex).then((payload) => {
              if (!cancelled) setVolume(payload);
            })
          : api.field(variable, timeIndex, depthIndex).then((payload) => {
              if (!cancelled) setField(payload);
            });

    request
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      })
      .finally(() => {
        if (!cancelled) setScienceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [catalog, variable, viewMode, depthIndex, timeIndex]);

  const handleVariableChange = useCallback(
    (value: "thetao" | "so" | "currents") => {
      setVariable(value);
      if (value === "currents") setViewMode("slice");
    },
    []
  );

  const selectedVariable = useMemo(
    () => catalog?.variables.find((item) => item.id === variable),
    [catalog, variable]
  );

  if (!catalog) {
    return (
      <div className="boot-screen">
        <div className="brand-mark">OT</div>
        <h1>OceanTwin 3D</h1>
        <p>{error || "Connecting to verified scientific evidence…"}</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark small">OT</div>
          <div>
            <h1>OceanTwin <span>3D</span></h1>
            <p>Explainable water-column explorer · SIH26067</p>
          </div>
        </div>
        <div className="header-status">
          <div>
            <span>ACTIVE FIELD</span>
            <strong>{selectedVariable?.label ?? variable}</strong>
          </div>
          <div>
            <span>MODEL</span>
            <strong>GLORYS12V1</strong>
          </div>
          <span className="system-pill">● SCIENCE API READY</span>
        </div>
      </header>

      <div className="workspace">
        <ControlPanel
          catalog={catalog}
          profiles={profiles}
          variable={variable}
          viewMode={viewMode}
          depthIndex={depthIndex}
          timeIndex={timeIndex}
          verticalExaggeration={verticalExaggeration}
          selectedProfileId={selectedProfileId}
          playing={playing}
          onVariableChange={handleVariableChange}
          onViewModeChange={setViewMode}
          onDepthChange={setDepthIndex}
          onTimeChange={setTimeIndex}
          onVerticalExaggerationChange={setVerticalExaggeration}
          onProfileChange={setSelectedProfileId}
          onPlayingChange={setPlaying}
        />

        <OceanGlobe
          field={field}
          volume={volume}
          currents={currents}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          verticalExaggeration={verticalExaggeration}
          onSelectProfile={setSelectedProfileId}
        />

        <ProfilePanel detail={profileDetail} loading={profileLoading} />
      </div>

      {(scienceLoading || error) && (
        <div className={`toast ${error ? "error" : ""}`}>
          {error ? error : "Loading selected verified ocean field…"}
        </div>
      )}

      <footer className="science-footer">
        <span>Reanalysis · Cached verified · No runtime scientific-data download</span>
        <span>{catalog.scientific_disclaimer}</span>
      </footer>
    </div>
  );
}
