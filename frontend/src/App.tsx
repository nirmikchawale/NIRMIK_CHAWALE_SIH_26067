import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "./api";
import { AppNavigation } from "./components/AppNavigation";
import { ControlPanel } from "./components/ControlPanel";
import { OceanGlobe } from "./components/OceanGlobe";
import { ProfilePanel } from "./components/ProfilePanel";
import { ProvenanceDrawer } from "./components/ProvenanceDrawer";
import { FeaturePlaceholder } from "./pages/FeaturePlaceholder";
import { PAGE_ITEMS, routeFromHash, type PageId } from "./navigation";
import type {
  Catalog,
  CurrentsResponse,
  FieldResponse,
  ProfileDetail,
  ProfileSummary,
  ProvenanceResponse,
  ViewMode,
  VolumeResponse
} from "./types";

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileDetail, setProfileDetail] = useState<ProfileDetail | null>(null);
  const [provenance, setProvenance] = useState<ProvenanceResponse | null>(null);
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [page, setPage] = useState<PageId>(() => routeFromHash(window.location.hash));

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
  const [startupError, setStartupError] = useState("");
  const [degradedWarnings, setDegradedWarnings] = useState<string[]>([]);

  useEffect(() => {
    const syncRoute = () => {
      const next = routeFromHash(window.location.hash);
      setPage(next);
      if (next !== "explore") setFocusMode(false);
    };
    window.addEventListener("hashchange", syncRoute);
    syncRoute();
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const navigate = useCallback((next: PageId) => {
    const target = `#/${next}`;
    if (window.location.hash === target) {
      setPage(next);
    } else {
      window.location.hash = target;
    }
    if (next !== "explore") setFocusMode(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.provenance()
      .then((payload) => {
        if (!cancelled) setProvenance(payload);
      })
      .catch(() => {
        if (!cancelled) {
          setProvenance(null);
          setDegradedWarnings((current) =>
            current.includes("Provenance metadata unavailable")
              ? current
              : [...current, "Provenance metadata unavailable"]
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([api.health(), api.catalog(), api.profiles()]).then(
      ([healthResult, catalogResult, profilesResult]) => {
        if (cancelled) return;

        if (catalogResult.status === "rejected") {
          const reason = catalogResult.reason as Error;
          setStartupError(reason?.message || "Scientific catalog unavailable.");
          setScienceLoading(false);
          return;
        }

        const catalogPayload = catalogResult.value;
        setCatalog(catalogPayload);
        const safeDepth = Math.min(18, catalogPayload.coordinates.depth.length - 1);
        setDepthIndex(Math.max(0, safeDepth));

        if (healthResult.status === "rejected") {
          setDegradedWarnings((current) => [...current, "Health check unavailable"]);
        }

        if (profilesResult.status === "fulfilled") {
          setProfiles(profilesResult.value.profiles);
          if (profilesResult.value.profiles.length > 0) {
            setSelectedProfileId(profilesResult.value.profiles[0].profile_id);
          } else {
            setDegradedWarnings((current) => [...current, "No eligible Argo comparison profiles"]);
          }
        } else {
          setProfiles([]);
          setDegradedWarnings((current) => [...current, "Argo comparison layer unavailable"]);
        }
      }
    );
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
      .catch(() => {
        if (!cancelled) {
          setProfileDetail(null);
          setDegradedWarnings((current) =>
            current.includes("Selected Argo comparison unavailable")
              ? current
              : [...current, "Selected Argo comparison unavailable"]
          );
        }
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
  const currentPage = PAGE_ITEMS.find((item) => item.id === page) ?? PAGE_ITEMS[0];

  if (!catalog) {
    return (
      <div className="boot-screen">
        <div className="brand-mark">OT</div>
        <h1>OceanTwin 3D</h1>
        {startupError ? (
          <div className="boot-error-card">
            <strong>Scientific API unavailable</strong>
            <p>{startupError}</p>
            <p>Local fail-safe: launch START_OCEANTWIN.cmd. The Streamlit scientific reference remains the emergency fallback.</p>
            <button onClick={() => window.location.reload()}>Retry connection</button>
          </div>
        ) : (
          <p>Connecting to verified scientific evidence…</p>
        )}
      </div>
    );
  }

  return (
    <div className={`app-shell ${focusMode ? "focus-mode" : ""}`}>
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
            <span>{page === "explore" ? "ACTIVE FIELD" : "PAGE"}</span>
            <strong>{page === "explore" ? (selectedVariable?.label ?? variable) : currentPage.label}</strong>
          </div>
          <div>
            <span>MODEL</span>
            <strong>GLORYS12V1</strong>
          </div>
          {focusMode && (
            <button className="evidence-button focus-exit-header" onClick={() => setFocusMode(false)}>
              Show panels
            </button>
          )}
          <span className={`system-pill ${degradedWarnings.length > 0 ? "degraded" : ""}`}>
            {degradedWarnings.length > 0 ? "▲ DEGRADED MODE" : "● SCIENCE API READY"}
          </span>
        </div>
      </header>

      <div className="workspace-frame">
        <AppNavigation
          page={page}
          focusMode={focusMode}
          onNavigate={navigate}
          onToggleFocus={() => setFocusMode((current) => !current)}
          onOpenSources={() => setProvenanceOpen(true)}
        />

        <div className="workspace">
          {page === "explore" ? (
            <>
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

              <ProfilePanel detail={profileDetail} loading={profileLoading} provenance={provenance} />
            </>
          ) : (
            <FeaturePlaceholder page={page} />
          )}

          <ProvenanceDrawer
            open={provenanceOpen}
            provenance={provenance}
            onClose={() => setProvenanceOpen(false)}
          />
        </div>
      </div>

      {(scienceLoading || error) && (
        <div className={`toast ${error ? "error" : ""}`}>
          {error ? error : "Loading selected verified ocean field…"}
        </div>
      )}

      <footer className="science-footer">
        <span>
          Reanalysis · Cached verified · No runtime scientific-data download
          {degradedWarnings.length > 0 ? ` · Degraded: ${degradedWarnings.join(" · ")}` : ""}
        </span>
        <span>{catalog.scientific_disclaimer}</span>
      </footer>
    </div>
  );
}
