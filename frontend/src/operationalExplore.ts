import type {
  Catalog,
  FieldResponse,
  IncoisChlorophyllSnapshot,
  IncoisOperationalSnapshot,
  VolumeResponse
} from "./types";

export type ExploreSourceMode = "glorys" | "incois" | "chlorophyll";

type ScalarVariable = "thetao" | "so";

function sourceKey(variable: ScalarVariable): "temperature" | "salinity" {
  return variable === "thetao" ? "temperature" : "salinity";
}

function modelUnits(snapshot: IncoisOperationalSnapshot, variable: ScalarVariable): string {
  return snapshot.variables[sourceKey(variable)].units;
}

export function buildIncoisExploreCatalog(snapshot: IncoisOperationalSnapshot): Catalog {
  const lonMin = Math.min(...snapshot.coverage.longitudes);
  const lonMax = Math.max(...snapshot.coverage.longitudes);
  const latMin = Math.min(...snapshot.coverage.latitudes);
  const latMax = Math.max(...snapshot.coverage.latitudes);
  const firstTime = snapshot.coverage.times[0] ?? "Unavailable";
  const lastTime = snapshot.coverage.times.at(-1) ?? firstTime;

  return {
    dataset: {
      label: snapshot.source.title,
      product: "INCOIS operational analysis snapshot",
      dataset_id: snapshot.source.dataset_id,
      doi: "",
      source: snapshot.source.query_url,
      title: snapshot.source.title,
      region: `${lonMin.toFixed(1)}–${lonMax.toFixed(1)}°E · ${latMin.toFixed(1)}–${latMax.toFixed(1)}°N`,
      demo_date: firstTime === lastTime ? firstTime : `${firstTime} → ${lastTime}`,
      freshness_class: "build-verified operational snapshot",
      runtime_mode: snapshot.source.runtime_policy
    },
    coordinates: {
      longitude: snapshot.coverage.longitudes,
      latitude: snapshot.coverage.latitudes,
      depth: snapshot.coverage.depths_m,
      depth_units: "m",
      depth_positive: "down",
      time: snapshot.coverage.times
    },
    variables: [
      {
        id: "thetao",
        label: "Temperature",
        kind: "scalar",
        units: snapshot.variables.temperature.units,
        standard_name: "sea_water_temperature",
        minimum: snapshot.variables.temperature.minimum,
        maximum: snapshot.variables.temperature.maximum
      },
      {
        id: "so",
        label: "Salinity",
        kind: "scalar",
        units: snapshot.variables.salinity.units,
        standard_name: "sea_water_salinity",
        minimum: snapshot.variables.salinity.minimum,
        maximum: snapshot.variables.salinity.maximum
      }
    ],
    capabilities: {
      scalar_3d: true,
      depth_slice: true,
      current_vectors: false,
      time_steps: snapshot.integrity.genuine_time_count,
      time_animation: snapshot.integrity.genuine_time_count > 1,
      argo_profiles: false,
      offline_scientific_data: true,
      streamlit_fallback: false
    },
    scientific_disclaimer:
      "Build-verified INCOIS analysis snapshot. Timestamps and source values are genuine and unchanged. " +
      "This operational source is separate from the GLORYS–Argo diagnostic comparison baseline."
  };
}

export function buildIncoisField(
  snapshot: IncoisOperationalSnapshot,
  variable: ScalarVariable,
  timeIndex: number,
  depthIndex: number
): FieldResponse {
  const time = snapshot.coverage.times[timeIndex];
  const depth = snapshot.coverage.depths_m[depthIndex];
  if (!time || depth == null) {
    throw new Error("INCOIS field index is outside the verified snapshot.");
  }

  const key = sourceKey(variable);
  const valueMap = new Map<string, number>();
  for (const row of snapshot.records) {
    if (row.time !== time || Math.abs(row.depth_m - depth) > 1e-9) continue;
    valueMap.set(`${row.latitude}|${row.longitude}`, row[key]);
  }

  const values = snapshot.coverage.latitudes.map((latitude) =>
    snapshot.coverage.longitudes.map((longitude) => {
      const value = valueMap.get(`${latitude}|${longitude}`);
      return value != null && Number.isFinite(value) ? value : null;
    })
  );

  return {
    variable,
    label: variable === "thetao" ? "Temperature" : "Salinity",
    units: modelUnits(snapshot, variable),
    time_index: timeIndex,
    time,
    depth_index: depthIndex,
    depth_m: depth,
    latitude: snapshot.coverage.latitudes,
    longitude: snapshot.coverage.longitudes,
    values,
    minimum: snapshot.variables[key].minimum,
    maximum: snapshot.variables[key].maximum,
    provenance: {
      product: snapshot.source.title,
      dataset_id: snapshot.source.dataset_id,
      freshness_class: "build-verified operational snapshot",
      runtime_mode: snapshot.source.runtime_policy
    }
  };
}

export function buildIncoisVolume(
  snapshot: IncoisOperationalSnapshot,
  variable: ScalarVariable,
  timeIndex: number
): VolumeResponse {
  const time = snapshot.coverage.times[timeIndex];
  if (!time) {
    throw new Error("INCOIS volume time index is outside the verified snapshot.");
  }
  const key = sourceKey(variable);
  const points: Array<[number, number, number, number]> = [];
  for (const row of snapshot.records) {
    if (row.time !== time) continue;
    const value = row[key];
    if (!Number.isFinite(value)) continue;
    points.push([row.longitude, row.latitude, row.depth_m, value]);
  }
  return {
    variable,
    label: variable === "thetao" ? "Temperature" : "Salinity",
    units: modelUnits(snapshot, variable),
    time_index: timeIndex,
    time,
    points,
    minimum: snapshot.variables[key].minimum,
    maximum: snapshot.variables[key].maximum,
    depth_positive: "down",
    rendering_note:
      "Genuine INCOIS source values at their verified depths. Browser vertical exaggeration changes display geometry only."
  };
}


export function buildIncoisChlorophyllCatalog(snapshot: IncoisChlorophyllSnapshot): Catalog {
  const lonMin = Math.min(...snapshot.coverage.longitudes);
  const lonMax = Math.max(...snapshot.coverage.longitudes);
  const latMin = Math.min(...snapshot.coverage.latitudes);
  const latMax = Math.max(...snapshot.coverage.latitudes);
  const firstTime = snapshot.coverage.times[0] ?? "Unavailable";
  const lastTime = snapshot.coverage.times.at(-1) ?? firstTime;

  return {
    dataset: {
      label: snapshot.source.title,
      product: "INCOIS satellite ocean-colour chlorophyll",
      dataset_id: snapshot.source.dataset_id,
      doi: "",
      source: snapshot.source.query_url,
      title: snapshot.source.title,
      region: `${lonMin.toFixed(1)}–${lonMax.toFixed(1)}°E · ${latMin.toFixed(1)}–${latMax.toFixed(1)}°N`,
      demo_date: firstTime === lastTime ? firstTime : `${firstTime} → ${lastTime}`,
      freshness_class: "historical satellite ocean-colour snapshot",
      runtime_mode: snapshot.source.runtime_policy
    },
    coordinates: {
      longitude: snapshot.coverage.longitudes,
      latitude: snapshot.coverage.latitudes,
      depth: [0],
      depth_units: "surface-only",
      depth_positive: "not_applicable",
      time: snapshot.coverage.times
    },
    variables: [
      {
        id: "chlorophyll",
        label: "Chlorophyll-a",
        kind: "scalar",
        units: snapshot.variable.units,
        standard_name: snapshot.variable.standard_name,
        minimum: snapshot.variable.minimum,
        maximum: snapshot.variable.maximum
      }
    ],
    capabilities: {
      scalar_3d: false,
      depth_slice: false,
      current_vectors: false,
      time_steps: snapshot.integrity.genuine_time_count,
      time_animation: snapshot.integrity.genuine_time_count > 1,
      argo_profiles: false,
      offline_scientific_data: true,
      streamlit_fallback: false,
      surface_only: true,
      biogeochemical_field: true
    },
    scientific_disclaimer:
      "Historical INCOIS satellite ocean-colour surface field. Source values and timestamps are genuine and unchanged. " +
      "No depth axis or water-column structure is inferred from this surface product."
  };
}

export function buildIncoisChlorophyllField(
  snapshot: IncoisChlorophyllSnapshot,
  timeIndex: number
): FieldResponse {
  const time = snapshot.coverage.times[timeIndex];
  if (!time) {
    throw new Error("INCOIS chlorophyll time index is outside the verified snapshot.");
  }

  const valueMap = new Map<string, number>();
  for (const row of snapshot.records) {
    if (row.time !== time) continue;
    valueMap.set(`${row.latitude}|${row.longitude}`, row.chlorophyll_mg_m3);
  }

  const values = snapshot.coverage.latitudes.map((latitude) =>
    snapshot.coverage.longitudes.map((longitude) => {
      const value = valueMap.get(`${latitude}|${longitude}`);
      return value != null && Number.isFinite(value) ? value : null;
    })
  );

  return {
    variable: "chlorophyll",
    label: "Chlorophyll-a (surface)",
    units: snapshot.variable.units,
    time_index: timeIndex,
    time,
    depth_index: 0,
    depth_m: 0,
    latitude: snapshot.coverage.latitudes,
    longitude: snapshot.coverage.longitudes,
    values,
    minimum: snapshot.variable.minimum,
    maximum: snapshot.variable.maximum,
    provenance: {
      product: snapshot.source.title,
      dataset_id: snapshot.source.dataset_id,
      freshness_class: "historical satellite ocean-colour snapshot",
      runtime_mode: snapshot.source.runtime_policy
    }
  };
}
