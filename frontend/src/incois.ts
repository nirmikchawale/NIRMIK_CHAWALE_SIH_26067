import type { Catalog, FieldResponse, VolumeResponse } from "./types";

export type ScientificSourceMode = "copernicus" | "incois";

export interface IncoisTime {
  iso: string;
  remoteIndex: number;
}

export interface IncoisBootstrap {
  times: IncoisTime[];
  temperature: VolumeResponse;
  salinity: VolumeResponse;
  catalog: Catalog;
}

const BASE = "https://erddap.incois.gov.in/erddap/griddap/incois_argo_mnt_VAM";
export const INCOIS_DATASET_ID = "incois_argo_mnt_VAM";
export const INCOIS_DEPTHS = [
  5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 250, 300,
  400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1600, 1800, 2000
] as const;
const INCOIS_LATITUDES = [12.5, 13.5];
const INCOIS_LONGITUDES = [67.5, 68.5, 69.5];
const LAT_CONSTRAINT = "[42:1:43]";
const LON_CONSTRAINT = "[37:1:39]";
const DEPTH_CONSTRAINT = "[0:1:23]";
const TIME_WINDOW = 24;

interface ErddapTable {
  columnNames?: string[];
  rows?: unknown[][];
}

interface ErddapPayload {
  table?: ErddapTable;
}

function withTimeout(milliseconds = 12000): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), milliseconds);
  return {
    signal: controller.signal,
    cancel: () => window.clearTimeout(timer)
  };
}

async function fetchErddap(query: string): Promise<ErddapPayload> {
  const timeout = withTimeout();
  try {
    const response = await fetch(`${BASE}.json?${query}`, {
      headers: { Accept: "application/json" },
      signal: timeout.signal,
      mode: "cors",
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`INCOIS ERDDAP returned ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as ErddapPayload;
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === "AbortError") {
      throw new Error("INCOIS ERDDAP request timed out.");
    }
    throw reason instanceof Error ? reason : new Error(String(reason));
  } finally {
    timeout.cancel();
  }
}

function tableRows(payload: ErddapPayload): Array<Record<string, unknown>> {
  const names = payload.table?.columnNames ?? [];
  const rows = payload.table?.rows ?? [];
  if (!names.length || !Array.isArray(rows)) {
    throw new Error("INCOIS ERDDAP response did not contain the expected table contract.");
  }
  return rows.map((row) => {
    const record: Record<string, unknown> = {};
    names.forEach((name, index) => {
      record[String(name)] = row[index];
    });
    return record;
  });
}

function lookup(record: Record<string, unknown>, ...names: string[]): unknown {
  const entries = Object.entries(record);
  for (const candidate of names) {
    const found = entries.find(([name]) => name.toLowerCase() === candidate.toLowerCase());
    if (found) return found[1];
  }
  return undefined;
}

function finiteNumber(value: unknown, label: string): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) throw new Error(`INCOIS response contained invalid ${label}.`);
  return number;
}

function isoTime(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("INCOIS response contained an invalid timestamp.");
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) {
    throw new Error("INCOIS response contained an unparseable timestamp.");
  }
  return parsed.toISOString().replace(".000Z", "Z");
}

export async function fetchIncoisTimes(): Promise<IncoisTime[]> {
  const payload = await fetchErddap("time");
  const rows = tableRows(payload);
  const all = rows.map((record, remoteIndex) => ({
    iso: isoTime(lookup(record, "time")),
    remoteIndex
  }));
  if (all.length < 2) {
    throw new Error("INCOIS operational source exposed fewer than two genuine timestamps.");
  }
  return all.slice(-TIME_WINDOW);
}

function variableMeta(variable: "thetao" | "so") {
  return variable === "thetao"
    ? { remote: "TEMP", label: "Temperature", units: "degree_Celsius" }
    : { remote: "SAL", label: "Salinity", units: "PSU" };
}

export async function fetchIncoisVolume(
  variable: "thetao" | "so",
  time: IncoisTime
): Promise<VolumeResponse> {
  const meta = variableMeta(variable);
  const query = `${meta.remote}[${time.remoteIndex}]${DEPTH_CONSTRAINT}${LAT_CONSTRAINT}${LON_CONSTRAINT}`;
  const payload = await fetchErddap(query);
  const rows = tableRows(payload);
  const points: Array<[number, number, number, number]> = [];
  let responseTime = time.iso;

  for (const record of rows) {
    const value = finiteNumber(lookup(record, meta.remote), meta.remote);
    if (Math.abs(value) > 1e30) continue;
    const longitude = finiteNumber(lookup(record, "longitude", "lon"), "longitude");
    const latitude = finiteNumber(lookup(record, "latitude", "lat"), "latitude");
    const depth = finiteNumber(lookup(record, "ZAX", "depth", "z"), "depth");
    const rawTime = lookup(record, "time");
    if (rawTime != null) responseTime = isoTime(rawTime);
    points.push([longitude, latitude, Math.abs(depth), value]);
  }

  if (!points.length) {
    throw new Error("INCOIS operational subset returned no finite scalar values.");
  }
  const values = points.map((point) => point[3]);
  return {
    variable,
    label: meta.label,
    units: meta.units,
    time_index: time.remoteIndex,
    time: responseTime,
    points,
    minimum: Math.min(...values),
    maximum: Math.max(...values),
    depth_positive: "down",
    rendering_note:
      "INCOIS ARGO Monthly VAM via official ERDDAP OPeNDAP/griddap. Values are objective-analysis fields; display exaggeration never changes scientific coordinates."
  };
}

export function fieldFromIncoisVolume(
  volume: VolumeResponse,
  variable: "thetao" | "so",
  timeIndex: number,
  depthIndex: number
): FieldResponse {
  const depth = INCOIS_DEPTHS[Math.max(0, Math.min(INCOIS_DEPTHS.length - 1, depthIndex))];
  const latitudes = [...INCOIS_LATITUDES];
  const longitudes = [...INCOIS_LONGITUDES];
  const lookupValue = new Map<string, number>();
  for (const [longitude, latitude, pointDepth, value] of volume.points) {
    if (Math.abs(pointDepth - depth) > 1e-6) continue;
    lookupValue.set(`${latitude.toFixed(3)}|${longitude.toFixed(3)}`, value);
  }
  const values = latitudes.map((latitude) =>
    longitudes.map((longitude) => lookupValue.get(`${latitude.toFixed(3)}|${longitude.toFixed(3)}`) ?? null)
  );
  return {
    variable,
    label: volume.label,
    units: volume.units,
    time_index: timeIndex,
    time: volume.time,
    depth_index: depthIndex,
    depth_m: depth,
    latitude: latitudes,
    longitude: longitudes,
    values,
    minimum: volume.minimum,
    maximum: volume.maximum,
    provenance: {
      product: "INCOIS ARGO Monthly Variational Analysis Methodology",
      dataset_id: INCOIS_DATASET_ID,
      freshness_class: "operational-public-service",
      runtime_mode: "live-erddap-opendap"
    }
  };
}

export function makeIncoisCatalog(
  times: IncoisTime[],
  temperature: VolumeResponse,
  salinity: VolumeResponse
): Catalog {
  return {
    dataset: {
      label: "INCOIS ARGO Monthly VAM",
      product: "INCOIS ARGO Monthly Variational Analysis Methodology",
      dataset_id: INCOIS_DATASET_ID,
      doi: "",
      source: "INCOIS ERDDAP · OPeNDAP/griddap",
      title: "INCOIS ARGO Monthly objectively analysed temperature and salinity",
      region: "Indian Ocean · live public INCOIS subset · 67.5–69.5°E · 12.5–13.5°N",
      demo_date: times.at(-1)?.iso.slice(0, 10) ?? "",
      freshness_class: "operational-public-service",
      runtime_mode: "live_erddap_with_verified_offline_fallback"
    },
    coordinates: {
      longitude: [...INCOIS_LONGITUDES],
      latitude: [...INCOIS_LATITUDES],
      depth: [...INCOIS_DEPTHS],
      depth_units: "m",
      depth_positive: "down",
      time: times.map((item) => item.iso)
    },
    variables: [
      {
        id: "thetao",
        label: "Temperature",
        kind: "scalar",
        units: temperature.units,
        standard_name: "sea_water_temperature",
        minimum: temperature.minimum,
        maximum: temperature.maximum
      },
      {
        id: "so",
        label: "Salinity",
        kind: "scalar",
        units: salinity.units,
        standard_name: "sea_water_salinity",
        minimum: salinity.minimum,
        maximum: salinity.maximum
      }
    ],
    capabilities: {
      scalar_3d: true,
      depth_slice: true,
      current_vectors: false,
      time_steps: times.length,
      time_animation: times.length > 1,
      argo_profiles: false,
      offline_scientific_data: false,
      streamlit_fallback: true
    },
    scientific_disclaimer:
      "INCOIS VAM is an objectively analysed Argo-derived field, not a numerical forecast. Live service availability is external; OceanTwin preserves the verified Copernicus fallback."
  };
}

export async function bootstrapIncois(): Promise<IncoisBootstrap> {
  const times = await fetchIncoisTimes();
  const latest = times[times.length - 1];
  const [temperature, salinity] = await Promise.all([
    fetchIncoisVolume("thetao", latest),
    fetchIncoisVolume("so", latest)
  ]);
  return {
    times,
    temperature,
    salinity,
    catalog: makeIncoisCatalog(times, temperature, salinity)
  };
}
