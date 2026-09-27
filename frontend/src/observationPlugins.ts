import { api } from "./api";

export type ObservationSensor = "Argo" | "Glider" | "CTD" | "BGC";

export interface ObservationVariable {
  id: string;
  label: string;
  units: string;
}

export interface ObservationSample {
  vertical: number;
  values: Record<string, number | null>;
}

export interface ObservationProfile {
  id: string;
  sensor: ObservationSensor;
  provider: string;
  platform: string;
  time: string;
  latitude: number;
  longitude: number;
  verticalLabel: string;
  verticalUnits: string;
  variables: ObservationVariable[];
  samples: ObservationSample[];
  protocol: string;
  endpoint: string;
  provenance: string;
}

export interface ObservationPlugin {
  id: string;
  sensor: ObservationSensor;
  provider: string;
  protocol: string;
  endpoint: string;
  description: string;
  load: () => Promise<ObservationProfile>;
}

interface ErddapPayload {
  table?: {
    columnNames?: string[];
    rows?: unknown[][];
  };
}

function withTimeout(milliseconds = 12000): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), milliseconds);
  return { signal: controller.signal, cancel: () => window.clearTimeout(timer) };
}

async function fetchTable(endpoint: string, query: string): Promise<Array<Record<string, unknown>>> {
  const timeout = withTimeout();
  try {
    const response = await fetch(`${endpoint}.json?${query}`, {
      headers: { Accept: "application/json" },
      mode: "cors",
      cache: "no-store",
      signal: timeout.signal
    });
    if (!response.ok) throw new Error(`source returned ${response.status} ${response.statusText}`);
    const payload = (await response.json()) as ErddapPayload;
    const names = payload.table?.columnNames ?? [];
    const rows = payload.table?.rows ?? [];
    if (!names.length || !rows.length) throw new Error("source returned no tabular observations");
    return rows.map((row) => {
      const record: Record<string, unknown> = {};
      names.forEach((name, index) => {
        record[String(name)] = row[index];
      });
      return record;
    });
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === "AbortError") {
      throw new Error("source request timed out");
    }
    throw reason instanceof Error ? reason : new Error(String(reason));
  } finally {
    timeout.cancel();
  }
}

function get(record: Record<string, unknown>, ...names: string[]): unknown {
  const entries = Object.entries(record);
  for (const candidate of names) {
    const found = entries.find(([key]) => key.toLowerCase() === candidate.toLowerCase());
    if (found) return found[1];
  }
  return undefined;
}

function numberOrNull(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && Math.abs(number) < 1e30 ? number : null;
}

function requireNumber(value: unknown, label: string): number {
  const number = numberOrNull(value);
  if (number == null) throw new Error(`invalid ${label} in source response`);
  return number;
}

function requireTime(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("invalid time in source response");
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return value;
  return parsed.toISOString().replace(".000Z", "Z");
}

function median(values: number[]): number {
  if (!values.length) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function profileFromRows(options: {
  id: string;
  sensor: ObservationSensor;
  provider: string;
  platform: string;
  protocol: string;
  endpoint: string;
  provenance: string;
  rows: Array<Record<string, unknown>>;
  verticalKeys: string[];
  verticalLabel: string;
  verticalUnits: string;
  variables: Array<ObservationVariable & { keys: string[] }>;
}): ObservationProfile {
  const samples: ObservationSample[] = [];
  const latitudes: number[] = [];
  const longitudes: number[] = [];
  const times: string[] = [];

  for (const record of options.rows) {
    const vertical = numberOrNull(get(record, ...options.verticalKeys));
    if (vertical == null) continue;
    const values: Record<string, number | null> = {};
    let hasValue = false;
    for (const variable of options.variables) {
      const value = numberOrNull(get(record, ...variable.keys));
      values[variable.id] = value;
      if (value != null) hasValue = true;
    }
    if (!hasValue) continue;
    samples.push({ vertical: Math.abs(vertical), values });

    const latitude = numberOrNull(get(record, "latitude", "lat"));
    const longitude = numberOrNull(get(record, "longitude", "lon"));
    const time = get(record, "time", "profile_time", "JULD");
    if (latitude != null) latitudes.push(latitude);
    if (longitude != null) longitudes.push(longitude);
    if (typeof time === "string" && time) times.push(requireTime(time));
  }

  if (samples.length < 2) throw new Error("source returned fewer than two valid profile samples");
  samples.sort((a, b) => a.vertical - b.vertical);
  const latitude = median(latitudes);
  const longitude = median(longitudes);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("source profile has no valid geographic position");
  }

  return {
    id: options.id,
    sensor: options.sensor,
    provider: options.provider,
    platform: options.platform,
    time: times.at(-1) ?? "unknown",
    latitude,
    longitude,
    verticalLabel: options.verticalLabel,
    verticalUnits: options.verticalUnits,
    variables: options.variables.map(({ id, label, units }) => ({ id, label, units })),
    samples,
    protocol: options.protocol,
    endpoint: options.endpoint,
    provenance: options.provenance
  };
}

async function loadLocalArgo(): Promise<ObservationProfile> {
  const profiles = await api.profiles();
  if (!profiles.profiles.length) throw new Error("verified Argo comparison evidence unavailable");
  const summary = profiles.profiles[0];
  const detail = await api.profile(summary.profile_id);
  return {
    id: `argo-${summary.profile_id}`,
    sensor: "Argo",
    provider: profiles.provider,
    platform: `${summary.platform_id} · cycle ${summary.cycle} ${summary.direction}`,
    time: summary.observation_time_utc,
    latitude: summary.observation_latitude,
    longitude: summary.observation_longitude,
    verticalLabel: "Depth",
    verticalUnits: "m",
    variables: [{ id: "temperature", label: "Temperature", units: "°C" }],
    samples: detail.levels.map((row) => ({
      vertical: row.observation_depth_m,
      values: { temperature: row.observed_temperature }
    })),
    protocol: "Bundled verified Argo NetCDF → static scientific API",
    endpoint: "OceanTwin verified evidence bundle",
    provenance: "FR GDAC / Ifremer Argo · provider-QC-screened delayed-mode profile"
  };
}

async function loadGlider(): Promise<ObservationProfile> {
  const endpoint = "https://erddap.aoml.noaa.gov/hdb/erddap/tabledap/GLIDERS_2021_04_06";
  const rows = await fetchTable(
    endpoint,
    "time,latitude,longitude,depth,temperature,salinity,profile_id&time>=2021-06-17T17:00:00Z&time<=2021-06-17T18:00:00Z"
  );
  const profileId = String(get(rows[0], "profile_id") ?? "sp034-20210617");
  const matching = rows.filter((row) => String(get(row, "profile_id") ?? profileId) === profileId);
  return profileFromRows({
    id: `glider-${profileId}`,
    sensor: "Glider",
    provider: "NOAA AOML / IOOS source archive",
    platform: profileId,
    protocol: "ERDDAP tabledap / OPeNDAP",
    endpoint,
    provenance: "Public glider profile data; geographic and vertical coordinates preserved from source.",
    rows: matching.length >= 2 ? matching : rows,
    verticalKeys: ["depth"],
    verticalLabel: "Depth",
    verticalUnits: "m",
    variables: [
      { id: "temperature", label: "Temperature", units: "°C", keys: ["temperature"] },
      { id: "salinity", label: "Salinity", units: "1", keys: ["salinity"] }
    ]
  });
}

async function loadCtd(): Promise<ObservationProfile> {
  const endpoint = "https://data.cioospacific.ca/erddap/tabledap/IOS_CTD_Profiles";
  const rows = await fetchTable(
    endpoint,
    "time,latitude,longitude,depth,sea_water_temperature,sea_water_practical_salinity&time>=2025-10-24T20:00:00Z&time<=2025-10-24T21:00:00Z"
  );
  return profileFromRows({
    id: "ctd-ios-20251024",
    sensor: "CTD",
    provider: "IOS / CIOOS Pacific",
    platform: "IOS CTD cast · 2025-10-24",
    protocol: "ERDDAP tabledap / OPeNDAP",
    endpoint,
    provenance: "Public Institute of Ocean Sciences CTD profile service via CIOOS ERDDAP.",
    rows,
    verticalKeys: ["depth"],
    verticalLabel: "Depth",
    verticalUnits: "m",
    variables: [
      { id: "temperature", label: "Temperature", units: "°C", keys: ["sea_water_temperature"] },
      { id: "salinity", label: "Practical salinity", units: "PSS-78", keys: ["sea_water_practical_salinity"] }
    ]
  });
}

async function loadBgc(): Promise<ObservationProfile> {
  const endpoint = "https://cwcgom.aoml.noaa.gov/erddap/tabledap/DATA_5c67_4238_ecal";
  const rows = await fetchTable(
    endpoint,
    "time,latitude,longitude,PRES,TEMP,PSAL,DOXY,CHLA,NITRATE,CYCLE_NUMBER&CYCLE_NUMBER=93"
  );
  return profileFromRows({
    id: "bgc-argo-7901009-cycle93",
    sensor: "BGC",
    provider: "NOAA AOML BGC-Argo",
    platform: "BGC-Argo 7901009 · cycle 93",
    protocol: "ERDDAP tabledap / OPeNDAP",
    endpoint,
    provenance: "Public BGC-Argo profile with pressure-resolved physical and biogeochemical measurements.",
    rows,
    verticalKeys: ["PRES", "PRES_ADJUSTED"],
    verticalLabel: "Pressure",
    verticalUnits: "dbar",
    variables: [
      { id: "temperature", label: "Temperature", units: "°C", keys: ["TEMP", "TEMP_ADJUSTED"] },
      { id: "salinity", label: "Salinity", units: "psu", keys: ["PSAL", "PSAL_ADJUSTED"] },
      { id: "oxygen", label: "Dissolved oxygen", units: "µmol/kg", keys: ["DOXY", "DOXY_ADJUSTED"] },
      { id: "chlorophyll", label: "Chlorophyll-a", units: "mg/m³", keys: ["CHLA", "CHLA_ADJUSTED"] },
      { id: "nitrate", label: "Nitrate", units: "µmol/kg", keys: ["NITRATE", "NITRATE_ADJUSTED"] }
    ]
  });
}

export const OBSERVATION_PLUGINS: ObservationPlugin[] = [
  {
    id: "argo",
    sensor: "Argo",
    provider: "Ifremer Argo GDAC",
    protocol: "Verified local NetCDF evidence",
    endpoint: "OceanTwin bundled evidence",
    description: "Indian-Ocean profiling float with QC-screened depth-resolved temperature.",
    load: loadLocalArgo
  },
  {
    id: "glider",
    sensor: "Glider",
    provider: "NOAA AOML / IOOS",
    protocol: "ERDDAP tabledap",
    endpoint: "https://erddap.aoml.noaa.gov/hdb/erddap/tabledap/GLIDERS_2021_04_06",
    description: "Autonomous glider temperature/salinity profile through a standards-based public endpoint.",
    load: loadGlider
  },
  {
    id: "ctd",
    sensor: "CTD",
    provider: "IOS / CIOOS Pacific",
    protocol: "ERDDAP tabledap",
    endpoint: "https://data.cioospacific.ca/erddap/tabledap/IOS_CTD_Profiles",
    description: "Ship-based CTD temperature/salinity profile through a public interoperable service.",
    load: loadCtd
  },
  {
    id: "bgc",
    sensor: "BGC",
    provider: "NOAA AOML BGC-Argo",
    protocol: "ERDDAP tabledap",
    endpoint: "https://cwcgom.aoml.noaa.gov/erddap/tabledap/DATA_5c67_4238_ecal",
    description: "Pressure-resolved BGC-Argo temperature, salinity, oxygen, chlorophyll and nitrate.",
    load: loadBgc
  }
];

export async function loadObservationNetwork(): Promise<Array<{
  plugin: ObservationPlugin;
  profile: ObservationProfile | null;
  error: string;
}>> {
  const settled = await Promise.allSettled(OBSERVATION_PLUGINS.map((plugin) => plugin.load()));
  return settled.map((result, index) => ({
    plugin: OBSERVATION_PLUGINS[index],
    profile: result.status === "fulfilled" ? result.value : null,
    error: result.status === "rejected"
      ? (result.reason instanceof Error ? result.reason.message : String(result.reason))
      : ""
  }));
}
