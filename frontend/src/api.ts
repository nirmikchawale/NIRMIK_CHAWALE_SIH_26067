import type {
  AnomalyResponse,
  Catalog,
  ConnectorRegistryResponse,
  CurrentsResponse,
  CurrentsVolumeResponse,
  FieldResponse,
  IncoisChlorophyllSnapshot,
  IncoisOperationalSnapshot,
  ProfileDetail,
  ProfilesResponse,
  ProvenanceResponse,
  TelemetryResponse,
  VerifiedObservationPack,
  VolumeResponse
} from "./types";
import { DataLoadError } from "./friendlyError";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? "" : "http://localhost:8000")
).replace(/\/$/, "");

const STATIC_SCIENCE = import.meta.env.VITE_STATIC_SCIENCE === "true";
const STATIC_BASE = `${import.meta.env.BASE_URL}science-static`.replace(/\/$/, "");

function safeProfileId(profileId: string): string {
  return profileId.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "profile";
}

async function getJson<T>(path: string, staticPath: string): Promise<T> {
  const target = STATIC_SCIENCE
    ? `${STATIC_BASE}${staticPath}`
    : `${API_BASE}${path}`;

  const response = await fetch(target, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new DataLoadError(`${response.status} ${response.statusText} for ${target}`, response.status);
  }
  return response.json() as Promise<T>;
}

export async function fetchIncoisOperational(): Promise<IncoisOperationalSnapshot> {
  const target = `${import.meta.env.BASE_URL}operational/incois-argo-10d-vam.json`;
  const response = await fetch(target, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new DataLoadError(`INCOIS operational snapshot: ${response.status} ${response.statusText}`, response.status);
  }
  return response.json() as Promise<IncoisOperationalSnapshot>;
}


export async function fetchIncoisChlorophyll(): Promise<IncoisChlorophyllSnapshot> {
  const target = `${import.meta.env.BASE_URL}operational/incois-chlorophyll.json`;
  const response = await fetch(target, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new DataLoadError(`INCOIS chlorophyll snapshot: ${response.status} ${response.statusText}`, response.status);
  }
  return response.json() as Promise<IncoisChlorophyllSnapshot>;
}


export async function fetchVerifiedObservationPack(): Promise<VerifiedObservationPack> {
  const target = `${import.meta.env.BASE_URL}observations/verified-profiles.json`;
  const response = await fetch(target, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new DataLoadError(`Observation pack: ${response.status} ${response.statusText}`, response.status);
  }
  return response.json() as Promise<VerifiedObservationPack>;
}

export const api = {
  health: () => getJson<Record<string, unknown>>("/api/health", "/health.json"),
  catalog: () => getJson<Catalog>("/api/catalog", "/catalog.json"),
  connectors: () => getJson<ConnectorRegistryResponse>("/api/connectors", "/connectors.json"),
  profiles: () => getJson<ProfilesResponse>("/api/profiles", "/profiles/index.json"),
  provenance: () => getJson<ProvenanceResponse>("/api/provenance", "/provenance.json"),
  profile: (profileId: string) =>
    getJson<ProfileDetail>(
      `/api/profiles/${encodeURIComponent(profileId)}`,
      `/profiles/${safeProfileId(profileId)}.json`
    ),
  field: (variable: "thetao" | "so", timeIndex: number, depthIndex: number) =>
    getJson<FieldResponse>(
      `/api/field?variable=${variable}&time_index=${timeIndex}&depth_index=${depthIndex}&stride=1`,
      `/fields/${variable}/t${timeIndex}_d${depthIndex}.json`
    ),
  volume: (variable: "thetao" | "so", timeIndex: number) =>
    getJson<VolumeResponse>(
      `/api/volume?variable=${variable}&time_index=${timeIndex}&horizontal_stride=2&depth_stride=1`,
      `/volumes/${variable}/t${timeIndex}.json`
    ),
  telemetry: (variable: "thetao" | "so", timeIndex: number, depthIndex: number) =>
    getJson<TelemetryResponse>(
      `/api/telemetry?variable=${variable}&time_index=${timeIndex}&depth_index=${depthIndex}`,
      `/telemetry/${variable}/t${timeIndex}_d${depthIndex}.json`
    ),
  anomalies: (variable: "thetao" | "so", timeIndex: number, depthIndex: number) =>
    getJson<AnomalyResponse>(
      `/api/anomalies?variable=${variable}&time_index=${timeIndex}&depth_index=${depthIndex}`,
      `/anomalies/${variable}/t${timeIndex}_d${depthIndex}.json`
    ),
  currents: (timeIndex: number, depthIndex: number) =>
    getJson<CurrentsResponse>(
      `/api/currents?time_index=${timeIndex}&depth_index=${depthIndex}&stride=2`,
      `/currents/t${timeIndex}_d${depthIndex}.json`
    ),
  currentsVolume: (timeIndex: number) =>
    getJson<CurrentsVolumeResponse>(
      `/api/currents-volume?time_index=${timeIndex}&horizontal_stride=4&depth_stride=1`,
      `/currents-volume/t${timeIndex}.json`
    )
};
