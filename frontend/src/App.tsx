import { useCallback, useEffect, useMemo, useState } from "react";

import { api, fetchIncoisChlorophyll, fetchIncoisOperational, fetchVerifiedObservationPack } from "./api";
import { AppNavigation } from "./components/AppNavigation";
import { EvidenceRail } from "./components/EvidenceRail";
import { PresentationGuide } from "./components/PresentationGuide";
import { ControlPanel } from "./components/ControlPanel";
import { ComparisonPage } from "./pages/ComparisonPage";
import { AnomalyPage } from "./pages/AnomalyPage";
import { TelemetryPage } from "./pages/TelemetryPage";
import { DataLabPage } from "./pages/DataLabPage";
import { InfoPage } from "./pages/InfoPage";
import { OceanGlobe } from "./components/OceanGlobe";
import { WaterColumn3D } from "./components/WaterColumn3D";
import { VisualizationDock } from "./components/VisualizationDock";
import { ProfilePanel } from "./components/ProfilePanel";
import { ImportedObservationPanel } from "./components/ImportedObservationPanel";
import { ProvenanceDrawer } from "./components/ProvenanceDrawer";
import { PAGE_ITEMS, routeFromHash, type PageId } from "./navigation";
import {
  buildIncoisChlorophyllCatalog,
  buildIncoisChlorophyllField,
  buildIncoisExploreCatalog,
  buildIncoisField,
  buildIncoisVolume,
  type ExploreSourceMode
} from "./operationalExplore";
import {
  IMPORTED_OBSERVATIONS_EVENT,
  groupImportedObservationProfiles,
  readImportedObservationRecords,
  sanitizeImportedObservationRecords
} from "./observationSession";
import type {
  Catalog,
  ColorPalette,
  ColorScaleMode,
  CurrentsResponse,
  CurrentsVolumeResponse,
  ExploreVariableId,
  FieldResponse,
  ImportedObservationProfile,
  IncoisChlorophyllSnapshot,
  IncoisOperationalSnapshot,
  ProfileDetail,
  ProfileSummary,
  ProvenanceResponse,
  ViewMode,
  VisualizationMode,
  VolumeResponse
} from "./types";

type ThemeMode = "dark" | "light";
type MobileSheet = "none" | "controls" | "observation";

const THEME_STORAGE_KEY = "oceantwin-theme";

function initialTheme(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage can be unavailable in hardened/private browsing contexts.
  }
  return "dark";
}

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [sourceMode, setSourceMode] = useState<ExploreSourceMode>("glorys");
  const [operationalSnapshot, setOperationalSnapshot] = useState<IncoisOperationalSnapshot | null>(null);
  const [operationalError, setOperationalError] = useState("");
  const [chlorophyllSnapshot, setChlorophyllSnapshot] = useState<IncoisChlorophyllSnapshot | null>(null);
  const [chlorophyllError, setChlorophyllError] = useState("");
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileDetail, setProfileDetail] = useState<ProfileDetail | null>(null);
  const [provenance, setProvenance] = useState<ProvenanceResponse | null>(null);
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  const [page, setPage] = useState<PageId>(() => routeFromHash(window.location.hash));
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>("none");
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [sessionImportedProfiles, setSessionImportedProfiles] = useState<ImportedObservationProfile[]>(() =>
    groupImportedObservationProfiles(readImportedObservationRecords())
  );
  const [verifiedObservationProfiles, setVerifiedObservationProfiles] = useState<ImportedObservationProfile[]>([]);
  const importedProfiles = useMemo(() => {
    const profilesById = new Map<string, ImportedObservationProfile>();
    for (const profile of verifiedObservationProfiles) profilesById.set(profile.id, profile);
    for (const profile of sessionImportedProfiles) profilesById.set(profile.id, profile);
    return [...profilesById.values()];
  }, [verifiedObservationProfiles, sessionImportedProfiles]);
  const [selectedImportedProfileId, setSelectedImportedProfileId] = useState("");

  const [variable, setVariable] = useState<ExploreVariableId>("thetao");
  const [viewMode, setViewMode] = useState<ViewMode>("slice");
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>("globe");
  const [waterColumnOpacity, setWaterColumnOpacity] = useState(58);
  const [depthIndex, setDepthIndex] = useState(18);
  const [timeIndex, setTimeIndex] = useState(0);
  const [verticalExaggeration, setVerticalExaggeration] = useState(60);
  const [playing, setPlaying] = useState(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette>("thermal");
  const [colorScale, setColorScale] = useState<ColorScaleMode>("linear");
  const [colorMinimum, setColorMinimum] = useState(0);
  const [colorMaximum, setColorMaximum] = useState(1);
  const [isoSurfaceEnabled, setIsoSurfaceEnabled] = useState(false);
  const [isoValue, setIsoValue] = useState(0.5);

  const [field, setField] = useState<FieldResponse | null>(null);
  const [volume, setVolume] = useState<VolumeResponse | null>(null);
  const [currents, setCurrents] = useState<CurrentsResponse | null>(null);
  const [currentsVolume, setCurrentsVolume] = useState<CurrentsVolumeResponse | null>(null);
  const [scienceLoading, setScienceLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");
  const [startupError, setStartupError] = useState("");
  const [degradedWarnings, setDegradedWarnings] = useState<string[]>([]);

  const operationalCatalog = useMemo(
    () => operationalSnapshot ? buildIncoisExploreCatalog(operationalSnapshot) : null,
    [operationalSnapshot]
  );
  const chlorophyllCatalog = useMemo(
    () => chlorophyllSnapshot ? buildIncoisChlorophyllCatalog(chlorophyllSnapshot) : null,
    [chlorophyllSnapshot]
  );
  const exploreCatalog =
    sourceMode === "incois" && operationalCatalog
      ? operationalCatalog
      : sourceMode === "chlorophyll" && chlorophyllCatalog
        ? chlorophyllCatalog
        : catalog;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme remains usable for the session even if persistence is blocked.
    }
  }, [theme]);

  useEffect(() => {
    const syncRoute = () => {
      const next = routeFromHash(window.location.hash);
      setPage(next);
      if (next !== "explore") {
        setFocusMode(false);
        setMobileSheet("none");
        setProfilePanelOpen(false);
      }
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
    if (next !== "explore") {
      setFocusMode(false);
      setMobileSheet("none");
      setProfilePanelOpen(false);
    }
  }, []);

  useEffect(() => {
    const syncImportedProfiles = () => {
      const next = groupImportedObservationProfiles(readImportedObservationRecords());
      setSessionImportedProfiles(next);
    };
    window.addEventListener(IMPORTED_OBSERVATIONS_EVENT, syncImportedProfiles);
    window.addEventListener("storage", syncImportedProfiles);
    syncImportedProfiles();
    return () => {
      window.removeEventListener(IMPORTED_OBSERVATIONS_EVENT, syncImportedProfiles);
      window.removeEventListener("storage", syncImportedProfiles);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchIncoisOperational()
      .then((payload) => {
        if (cancelled) return;
        if (
          payload.integrity.synthetic_timestamps ||
          payload.integrity.source_values_modified ||
          payload.integrity.genuine_time_count < 2 ||
          payload.integrity.genuine_depth_count < 2
        ) {
          throw new Error("INCOIS operational snapshot failed multi-time scientific-integrity policy.");
        }
        setOperationalSnapshot(payload);
        setOperationalError("");
      })
      .catch((reason: Error) => {
        if (cancelled) return;
        setOperationalSnapshot(null);
        setOperationalError(reason.message);
        setDegradedWarnings((current) =>
          current.includes("INCOIS multi-time Explore source unavailable")
            ? current
            : [...current, "INCOIS multi-time Explore source unavailable"]
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchIncoisChlorophyll()
      .then((payload) => {
        if (cancelled) return;
        if (
          payload.source.provider !== "INCOIS" ||
          payload.integrity.genuine_time_count < 2 ||
          !payload.integrity.surface_only ||
          payload.integrity.synthetic_timestamps ||
          payload.integrity.synthetic_depths ||
          payload.integrity.source_values_modified ||
          payload.records.length === 0
        ) {
          throw new Error("INCOIS chlorophyll snapshot failed scientific-integrity policy.");
        }
        setChlorophyllSnapshot(payload);
        setChlorophyllError("");
      })
      .catch((reason: Error) => {
        if (cancelled) return;
        setChlorophyllSnapshot(null);
        setChlorophyllError(reason.message);
        setDegradedWarnings((current) =>
          current.includes("INCOIS chlorophyll Explore source unavailable")
            ? current
            : [...current, "INCOIS chlorophyll Explore source unavailable"]
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchVerifiedObservationPack()
      .then((payload) => {
        if (cancelled) return;
        if (
          payload.integrity.synthetic_measurements ||
          payload.integrity.synthetic_timestamps ||
          payload.integrity.provider_values_modified
        ) {
          throw new Error("Verified observation pack failed scientific-integrity policy.");
        }
        const records = sanitizeImportedObservationRecords(payload.records);
        const next = groupImportedObservationProfiles(records);
        const sensorTypes = new Set(next.map((profile) => profile.sensor_type));
        if (!["glider", "ctd", "bgc"].every((sensor) => sensorTypes.has(sensor as "glider" | "ctd" | "bgc"))) {
          throw new Error("Verified observation pack is missing Glider, CTD or BGC evidence.");
        }
        setVerifiedObservationProfiles(next);
      })
      .catch((reason: Error) => {
        if (cancelled) return;
        setVerifiedObservationProfiles([]);
        setDegradedWarnings((current) =>
          current.includes("Verified Glider/CTD/BGC evidence unavailable")
            ? current
            : [...current, "Verified Glider/CTD/BGC evidence unavailable"]
        );
        console.warn(reason);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedImportedProfileId((current) =>
      current && importedProfiles.some((profile) => profile.id === current) ? current : ""
    );
  }, [importedProfiles]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileSheet("none");
      setProfilePanelOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
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
        const initialScalar = catalogPayload.variables.find((item) => item.id === "thetao")
          ?? catalogPayload.variables.find((item) => item.kind === "scalar");
        if (initialScalar) {
          setColorMinimum(initialScalar.minimum);
          setColorMaximum(initialScalar.maximum);
          setIsoValue((initialScalar.minimum + initialScalar.maximum) / 2);
        }
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
    if (!exploreCatalog) return;
    if (!exploreCatalog.capabilities.time_animation) {
      setPlaying(false);
      return;
    }
    if (!playing) return;
    const timer = window.setInterval(() => {
      setTimeIndex((current) => (current + 1) % exploreCatalog.coordinates.time.length);
    }, 1300);
    return () => window.clearInterval(timer);
  }, [exploreCatalog, playing]);

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
    if (!exploreCatalog) return;
    let cancelled = false;
    setScienceLoading(true);
    setError("");
    setField(null);
    setVolume(null);
    setCurrents(null);
    setCurrentsVolume(null);

    if (sourceMode === "chlorophyll") {
      try {
        if (!chlorophyllSnapshot) throw new Error("INCOIS chlorophyll snapshot is unavailable.");
        if (variable !== "chlorophyll") throw new Error("Chlorophyll source exposes the chlorophyll variable only.");
        setField(buildIncoisChlorophyllField(chlorophyllSnapshot, timeIndex));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
      } finally {
        setScienceLoading(false);
      }
      return;
    }

    if (sourceMode === "incois") {
      try {
        if (!operationalSnapshot) throw new Error("INCOIS operational snapshot is unavailable.");
        if (variable !== "thetao" && variable !== "so") {
          throw new Error("INCOIS multi-time analysis exposes temperature and salinity only.");
        }
        if (visualizationMode === "water-column" || viewMode === "volume") {
          setVolume(buildIncoisVolume(operationalSnapshot, variable, timeIndex));
        } else {
          setField(buildIncoisField(operationalSnapshot, variable, timeIndex, depthIndex));
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
      } finally {
        setScienceLoading(false);
      }
      return;
    }

    if (variable === "chlorophyll") {
      setError("Chlorophyll is available only from the INCOIS ocean-colour source.");
      setScienceLoading(false);
      return;
    }

    const request =
      variable === "currents"
        ? visualizationMode === "water-column"
          ? api.currentsVolume(timeIndex).then((payload) => {
              if (!cancelled) setCurrentsVolume(payload);
            })
          : api.currents(timeIndex, depthIndex).then((payload) => {
              if (!cancelled) setCurrents(payload);
            })
        : visualizationMode === "water-column" || viewMode === "volume"
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
  }, [exploreCatalog, sourceMode, operationalSnapshot, chlorophyllSnapshot, variable, viewMode, visualizationMode, depthIndex, timeIndex]);

  const handleProfileSelection = useCallback((profileId: string) => {
    setSelectedImportedProfileId("");
    setSelectedProfileId(profileId);
    setProfilePanelOpen(true);
    if (window.matchMedia("(max-width: 760px)").matches) {
      setMobileSheet("observation");
    }
  }, []);

  const handleImportedProfileSelection = useCallback((profileId: string) => {
    setSelectedImportedProfileId(profileId);
    setProfilePanelOpen(true);
    if (window.matchMedia("(max-width: 760px)").matches) {
      setMobileSheet("observation");
    }
  }, []);

  const handleVariableChange = useCallback(
    (value: ExploreVariableId) => {
      setVariable(value);
      const nextVariable = exploreCatalog?.variables.find((item) => item.id === value);
      if (nextVariable && nextVariable.kind === "scalar") {
        setColorMinimum(nextVariable.minimum);
        setColorMaximum(nextVariable.maximum);
        setIsoValue((nextVariable.minimum + nextVariable.maximum) / 2);
        setColorScale("linear");
      }
      if (value === "chlorophyll") {
        setViewMode("slice");
        setVisualizationMode("globe");
        setIsoSurfaceEnabled(false);
      }
      if (value === "currents") {
        setViewMode("slice");
        setIsoSurfaceEnabled(false);
        if (nextVariable) {
          setColorMinimum(nextVariable.minimum);
          setColorMaximum(nextVariable.maximum);
          setColorScale("linear");
        }
      }
    },
    [exploreCatalog]
  );

  const handleSourceModeChange = useCallback((nextSource: ExploreSourceMode) => {
    if (nextSource === "incois" && !operationalCatalog) return;
    if (nextSource === "chlorophyll" && !chlorophyllCatalog) return;
    setSourceMode(nextSource);
    setPlaying(false);
    setTimeIndex(0);
    setProfilePanelOpen(false);
    setSelectedProfileId((current) => current);

    const nextCatalog =
      nextSource === "incois"
        ? operationalCatalog
        : nextSource === "chlorophyll"
          ? chlorophyllCatalog
          : catalog;

    let targetVariable: ExploreVariableId = variable;
    if (nextSource === "chlorophyll") {
      targetVariable = "chlorophyll";
      setVariable(targetVariable);
      setViewMode("slice");
      setVisualizationMode("globe");
      setIsoSurfaceEnabled(false);
    } else if (variable === "chlorophyll" || (nextSource === "incois" && variable === "currents")) {
      targetVariable = "thetao";
      setVariable(targetVariable);
      setViewMode("slice");
      setVisualizationMode("globe");
      setIsoSurfaceEnabled(false);
    }

    const nextDepth = nextSource === "glorys"
      ? Math.min(18, Math.max(0, (nextCatalog?.coordinates.depth.length ?? 1) - 1))
      : 0;
    setDepthIndex(nextDepth);

    const nextVariable = nextCatalog?.variables.find((item) => item.id === targetVariable);
    if (nextVariable) {
      setColorMinimum(nextVariable.minimum);
      setColorMaximum(nextVariable.maximum);
      setIsoValue((nextVariable.minimum + nextVariable.maximum) / 2);
      setColorScale("linear");
    }
  }, [operationalCatalog, chlorophyllCatalog, catalog, variable]);

  const handleEnterWaterColumn = useCallback(() => {
    if (sourceMode === "chlorophyll") return;
    setVisualizationMode("water-column");
  }, [sourceMode]);

  const selectedVariable = useMemo(
    () => exploreCatalog?.variables.find((item) => item.id === variable),
    [exploreCatalog, variable]
  );
  const selectedProfile = useMemo(
    () => profiles.find((item) => item.profile_id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  );
  const selectedImportedProfile = useMemo(
    () => importedProfiles.find((item) => item.id === selectedImportedProfileId) ?? null,
    [importedProfiles, selectedImportedProfileId]
  );
  const currentPage = PAGE_ITEMS.find((item) => item.id === page) ?? PAGE_ITEMS[0];

  if (!catalog) {
    return (
      <div className="boot-screen" data-theme={theme}>
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

  const activeExploreCatalog = exploreCatalog ?? catalog;
  const activeComparisonProfiles = sourceMode === "glorys" ? profiles : [];
  const activeSelectedProfile = sourceMode === "glorys" ? selectedProfile : null;

  return (
    <div
      className={`app-shell ocean-workbench ${focusMode ? "focus-mode" : ""}`}
      data-theme={theme}
      data-page={page}
      data-explore-source={sourceMode}
    >
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark small">OT</div>
          <div>
            <h1>OceanTwin <span>3D</span></h1>
            <p>Explainable water-column explorer · SIH26067</p>
          </div>
        </div>
        <div className="header-status">
          <button className="present-button" type="button" aria-expanded={guideOpen} onClick={() => setGuideOpen((open) => !open)}>Present demo</button>
          <div>
            <span>{page === "explore" ? "ACTIVE FIELD" : "PAGE"}</span>
            <strong>{page === "explore" ? (selectedVariable?.label ?? variable) : currentPage.label}</strong>
          </div>
          <div>
            <span>MODEL</span>
            <strong>{
              page === "explore"
                ? sourceMode === "incois"
                  ? "INCOIS MULTI-TIME"
                  : sourceMode === "chlorophyll"
                    ? "INCOIS OCEAN COLOUR"
                    : "GLORYS12V1"
                : "GLORYS12V1"
            }</strong>
          </div>
          {focusMode && (
            <button className="evidence-button focus-exit-header" onClick={() => setFocusMode(false)}>
              Show panels
            </button>
          )}
          <span className={`system-pill ${degradedWarnings.length > 0 ? "degraded" : ""}`}>
            {degradedWarnings.length > 0 ? "▲ DEGRADED MODE" : "● VERIFIED SNAPSHOT"}
          </span>
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={theme === "light"}
            title={theme === "dark" ? "Use light appearance" : "Use dark appearance"}
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          >
            <span aria-hidden="true" className="theme-toggle-dot" />
            {theme === "dark" ? "LIGHT" : "DARK"}
          </button>
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
          {guideOpen && <PresentationGuide onClose={() => setGuideOpen(false)} onStep={(step) => {
            setFocusMode(false);
            setProfilePanelOpen(false);
            setMobileSheet("none");
            if (step === 0 || step === 1) {
              navigate("explore");
              handleVariableChange("thetao");
              setVisualizationMode(step === 0 ? "globe" : "water-column");
            } else if (step === 2) navigate("compare");
            else { navigate("about"); setProvenanceOpen(true); }
          }} />}
          {page === "explore" ? (
            <>
              <EvidenceRail catalog={activeExploreCatalog} variable={selectedVariable} depth={activeExploreCatalog.coordinates.depth[depthIndex] ?? 0} time={activeExploreCatalog.coordinates.time[timeIndex] ?? "Unavailable"} profile={activeSelectedProfile} loading={scienceLoading} error={error} onInspect={() => activeSelectedProfile && handleProfileSelection(activeSelectedProfile.profile_id)} onCompare={() => navigate("compare")} onSources={() => setProvenanceOpen(true)} />
              {mobileSheet !== "none" && (
                <button
                  type="button"
                  className="mobile-sheet-backdrop"
                  aria-label="Close mobile panel"
                  onClick={() => {
                    if (mobileSheet === "observation") setProfilePanelOpen(false);
                    setMobileSheet("none");
                  }}
                />
              )}

              <ControlPanel
                catalog={activeExploreCatalog}
                profiles={activeComparisonProfiles}
                sourceMode={sourceMode}
                operationalAvailable={Boolean(operationalCatalog) && !operationalError}
                chlorophyllAvailable={Boolean(chlorophyllCatalog) && !chlorophyllError}
                variable={variable}
                viewMode={viewMode}
                visualizationMode={visualizationMode}
                waterColumnOpacity={waterColumnOpacity}
                depthIndex={depthIndex}
                timeIndex={timeIndex}
                verticalExaggeration={verticalExaggeration}
                selectedProfileId={selectedProfileId}
                playing={playing}
                colorPalette={colorPalette}
                colorScale={colorScale}
                colorMinimum={colorMinimum}
                colorMaximum={colorMaximum}
                isoSurfaceEnabled={isoSurfaceEnabled}
                isoValue={isoValue}
                mobileOpen={mobileSheet === "controls"}
                onMobileClose={() => setMobileSheet("none")}
                onSourceModeChange={handleSourceModeChange}
                onVariableChange={handleVariableChange}
                onViewModeChange={setViewMode}
                onWaterColumnOpacityChange={setWaterColumnOpacity}
                onDepthChange={setDepthIndex}
                onTimeChange={setTimeIndex}
                onVerticalExaggerationChange={setVerticalExaggeration}
                onProfileChange={handleProfileSelection}
                onPlayingChange={setPlaying}
                onColorPaletteChange={setColorPalette}
                onColorScaleChange={setColorScale}
                onColorMinimumChange={setColorMinimum}
                onColorMaximumChange={setColorMaximum}
                onIsoSurfaceEnabledChange={setIsoSurfaceEnabled}
                onIsoValueChange={setIsoValue}
              />

              <VisualizationDock
                mode={visualizationMode}
                waterColumnAvailable={sourceMode !== "chlorophyll" && (sourceMode === "glorys" || variable !== "currents")}
                variableLabel={selectedVariable?.label ?? variable}
                depthM={activeExploreCatalog.coordinates.depth[depthIndex] ?? 0}
                timeLabel={activeExploreCatalog.coordinates.time[timeIndex] ?? "Unavailable"}
                regionLabel={activeExploreCatalog.dataset.region}
                modelLabel={activeExploreCatalog.dataset.product}
                observationLabel={
                  selectedImportedProfile
                    ? `${selectedImportedProfile.sensor_type.toUpperCase()} · ${selectedImportedProfile.platform_id}`
                    : activeSelectedProfile
                      ? `${activeSelectedProfile.platform_id} · cycle ${activeSelectedProfile.cycle} ${activeSelectedProfile.direction}`
                      : activeComparisonProfiles.length === 0 && importedProfiles.length === 0
                        ? "Unavailable"
                        : "Not selected"
                }
                onChange={setVisualizationMode}
              />

              <div
                className="visualization-stage"
                data-visualization-mode={visualizationMode}
                aria-label="Connected geographic and water-column visualization stage"
              >
                <div
                  className={`visualization-layer globe-visualization-layer ${visualizationMode === "globe" ? "active" : ""}`}
                  aria-hidden={visualizationMode !== "globe"}
                >
                  <OceanGlobe
                    field={visualizationMode === "globe" ? field : null}
                    volume={visualizationMode === "globe" ? volume : null}
                    currents={visualizationMode === "globe" ? currents : null}
                    profiles={activeComparisonProfiles}
                    selectedProfileId={sourceMode === "glorys" ? selectedProfileId : ""}
                    importedProfiles={importedProfiles}
                    selectedImportedProfileId={selectedImportedProfileId}
                    verticalExaggeration={verticalExaggeration}
                    colorPalette={colorPalette}
                    colorScale={colorScale}
                    colorMinimum={colorMinimum}
                    colorMaximum={colorMaximum}
                    onSelectProfile={handleProfileSelection}
                    onSelectImportedProfile={handleImportedProfileSelection}
                    onEnterWaterColumn={handleEnterWaterColumn}
                  />
                </div>
                <div
                  className={`visualization-layer water-column-visualization-layer ${visualizationMode === "water-column" ? "active" : ""}`}
                  aria-hidden={visualizationMode !== "water-column"}
                >
                  <WaterColumn3D
                    volume={visualizationMode === "water-column" ? volume : null}
                    currentsVolume={visualizationMode === "water-column" ? currentsVolume : null}
                    selectedDepthM={activeExploreCatalog.coordinates.depth[depthIndex] ?? 0}
                    verticalExaggeration={verticalExaggeration}
                    opacity={waterColumnOpacity / 100}
                    colorPalette={colorPalette}
                    colorScale={colorScale}
                    colorMinimum={colorMinimum}
                    colorMaximum={colorMaximum}
                    isoSurfaceEnabled={isoSurfaceEnabled}
                    isoValue={isoValue}
                    theme={theme}
                  />
                </div>
              </div>

              {selectedImportedProfile ? (
                <ImportedObservationPanel
                  profile={selectedImportedProfile}
                  open={profilePanelOpen || mobileSheet === "observation"}
                  mobileOpen={mobileSheet === "observation"}
                  onClose={() => {
                    setProfilePanelOpen(false);
                    setMobileSheet("none");
                  }}
                />
              ) : sourceMode === "glorys" ? (
                <ProfilePanel
                  detail={profileDetail}
                  loading={profileLoading}
                  provenance={provenance}
                  open={profilePanelOpen || mobileSheet === "observation"}
                  mobileOpen={mobileSheet === "observation"}
                  onClose={() => {
                    setProfilePanelOpen(false);
                    setMobileSheet("none");
                  }}
                />
              ) : null}

              <div className="mobile-explore-tray" role="toolbar" aria-label="Explore quick controls">
                <button
                  type="button"
                  aria-pressed={mobileSheet === "controls"}
                  onClick={() => setMobileSheet("controls")}
                >
                  <span>Layer</span>
                  <strong>{selectedVariable?.label ?? variable}</strong>
                </button>
                <button
                  type="button"
                  aria-pressed={mobileSheet === "controls"}
                  onClick={() => setMobileSheet("controls")}
                >
                  <span>Time</span>
                  <strong>{activeExploreCatalog.coordinates.time[timeIndex]?.replace("T00:00:00Z", "") ?? "—"}</strong>
                </button>
                <button
                  type="button"
                  aria-pressed={mobileSheet === "controls"}
                  onClick={() => setMobileSheet("controls")}
                >
                  <span>Depth</span>
                  <strong>{(activeExploreCatalog.coordinates.depth[depthIndex] ?? 0).toFixed(0)} m</strong>
                </button>
                <button
                  type="button"
                  aria-pressed={mobileSheet === "observation"}
                  disabled={!activeSelectedProfile && !selectedImportedProfile}
                  onClick={() => {
                    setProfilePanelOpen(true);
                    setMobileSheet("observation");
                  }}
                >
                  <span>Observation</span>
                  <strong>{
                    selectedImportedProfile
                      ? selectedImportedProfile.platform_id
                      : activeSelectedProfile
                        ? activeSelectedProfile.platform_id
                        : "None"
                  }</strong>
                </button>
                <button type="button" onClick={() => navigate("compare")}>
                  <span>Compare</span>
                  <strong>Model ↔ Argo</strong>
                </button>
              </div>
            </>
          ) : page === "telemetry" ? (
            <TelemetryPage catalog={catalog} provenance={provenance} />
          ) : page === "compare" ? (
            <ComparisonPage
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              detail={profileDetail}
              loading={profileLoading}
              provenance={provenance}
              onProfileChange={setSelectedProfileId}
            />
          ) : page === "anomaly" ? (
            <AnomalyPage catalog={catalog} />
          ) : page === "data-lab" ? (
            <DataLabPage />
          ) : (
            <InfoPage catalog={catalog} provenance={provenance} />
          )}

          <ProvenanceDrawer
            open={provenanceOpen}
            provenance={provenance}
            onClose={() => setProvenanceOpen(false)}
          />
        </div>
      </div>

      {(scienceLoading || error) && (
        <div
          className={`toast ${error ? "error" : ""}`}
          role={error ? "alert" : "status"}
          aria-live={error ? "assertive" : "polite"}
        >
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
