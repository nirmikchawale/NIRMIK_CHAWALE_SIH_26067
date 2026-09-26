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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: () => getJson<Record<string, unknown>>("/api/health"),
  catalog: () => getJson<Catalog>("/api/catalog"),
  profiles: () => getJson<ProfilesResponse>("/api/profiles"),
  provenance: () => getJson<ProvenanceResponse>("/api/provenance"),
  profile: (profileId: string) =>
    getJson<ProfileDetail>(`/api/profiles/${encodeURIComponent(profileId)}`),
  field: (variable: "thetao" | "so", timeIndex: number, depthIndex: number) =>
    getJson<FieldResponse>(
      `/api/field?variable=${variable}&time_index=${timeIndex}&depth_index=${depthIndex}&stride=1`
    ),
  volume: (variable: "thetao" | "so", timeIndex: number) =>
    getJson<VolumeResponse>(
      `/api/volume?variable=${variable}&time_index=${timeIndex}&horizontal_stride=2&depth_stride=2`
    ),
  currents: (timeIndex: number, depthIndex: number) =>
    getJson<CurrentsResponse>(
      `/api/currents?time_index=${timeIndex}&depth_index=${depthIndex}&stride=2`
    )
};
