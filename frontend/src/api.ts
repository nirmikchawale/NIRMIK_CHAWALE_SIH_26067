import type {
  Catalog,
  CurrentsResponse,
  FieldResponse,
  ProfileDetail,
  ProfilesResponse,
  ProvenanceResponse,
  VolumeResponse
} from "./types";

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
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: () => getJson<Record<string, unknown>>("/api/health", "/health.json"),
  catalog: () => getJson<Catalog>("/api/catalog", "/catalog.json"),
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
      `/api/volume?variable=${variable}&time_index=${timeIndex}&horizontal_stride=2&depth_stride=2`,
      `/volumes/${variable}/t${timeIndex}.json`
    ),
  currents: (timeIndex: number, depthIndex: number) =>
    getJson<CurrentsResponse>(
      `/api/currents?time_index=${timeIndex}&depth_index=${depthIndex}&stride=2`,
      `/currents/t${timeIndex}_d${depthIndex}.json`
    )
};
