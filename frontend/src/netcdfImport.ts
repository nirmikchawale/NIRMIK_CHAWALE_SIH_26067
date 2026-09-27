import type { ImportedSensorType } from "./types";

export interface NetcdfVariableInspection {
  name: string;
  dimensions: string[];
  shape: number[];
  units: string | null;
  standard_name: string | null;
  axis: string | null;
  positive: string | null;
  importable_profile_variable: boolean;
}

export interface NetcdfBrowserInspection {
  filename: string;
  file_format: string;
  conventions: string;
  dimensions: Array<{ name: string; size: number }>;
  coordinates: {
    longitude: string | null;
    latitude: string | null;
    depth: string | null;
    time: string | null;
  };
  variables: NetcdfVariableInspection[];
  profile_shape: number[] | null;
  generated_profile_rows: number;
  cf_profile_ready: boolean;
  notes: string[];
}

export interface NetcdfBrowserImport {
  inspection: NetcdfBrowserInspection;
  records: Array<Record<string, unknown>>;
}

type VariableMeta = {
  name: string;
  dimensions?: string[];
  shape?: number[];
  units?: unknown;
  standard_name?: unknown;
  axis?: unknown;
  positive?: unknown;
  long_name?: unknown;
  _FillValue?: unknown;
  missing_value?: unknown;
  scale_factor?: unknown;
  add_offset?: unknown;
};

function scalarText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.length === 1 ? scalarText(value[0]) : value.map(scalarText).join(", ");
  if (ArrayBuffer.isView(value)) {
    const values = Array.from(value as unknown as ArrayLike<number | bigint>);
    return values.length === 1 ? String(values[0]) : values.join(", ");
  }
  return String(value).trim();
}

function scalarNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value) && value.length === 1) return scalarNumber(value[0]);
  if (ArrayBuffer.isView(value) && (value as unknown as ArrayLike<unknown>).length === 1) {
    return scalarNumber((value as unknown as ArrayLike<unknown>)[0]);
  }
  const parsed = Number(scalarText(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function numericArray(value: unknown): number[] {
  if (Array.isArray(value)) return value.map((item) => Number(item));
  if (ArrayBuffer.isView(value)) return Array.from(value as unknown as ArrayLike<number | bigint>, (item) => Number(item));
  return [];
}

function metadataText(meta: VariableMeta, key: keyof VariableMeta): string {
  return scalarText(meta[key]).toLowerCase();
}

function coordinateMeta(
  variables: VariableMeta[],
  aliases: string[],
  standardName: string,
  axis: string
): VariableMeta | null {
  const aliasSet = new Set(aliases.map((item) => item.toLowerCase()));
  return variables.find((item) => {
    const name = item.name.toLowerCase();
    return aliasSet.has(name) ||
      metadataText(item, "standard_name") === standardName ||
      metadataText(item, "axis") === axis.toLowerCase();
  }) ?? null;
}

function sameShape(left: number[] | undefined, right: number[] | null | undefined): boolean {
  if (!left || !right || left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function product(values: number[]): number {
  return values.reduce((result, value) => result * Math.max(1, value), 1);
}

function validCoordinate(value: number, minimum: number, maximum: number): number | null {
  return Number.isFinite(value) && value >= minimum && value <= maximum ? value : null;
}

function coordinateAtProfile(
  values: number[],
  profileIndex: number,
  profileCount: number,
  levelCount: number
): number | null {
  if (values.length === 1) return values[0];
  if (values.length === profileCount) return values[profileIndex] ?? null;
  if (values.length === profileCount * levelCount) return values[profileIndex * levelCount] ?? null;
  return null;
}

function decodeCfTime(value: number, units: string): string | null {
  const match = units.trim().match(/^(seconds?|minutes?|hours?|days?)\s+since\s+(.+)$/i);
  if (!match) return null;
  const unit = match[1].toLowerCase();
  const rawBase = match[2].trim();
  const isoBase = rawBase.includes("T") ? rawBase : rawBase.replace(" ", "T");
  const timezoneReady = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(isoBase) ? isoBase : isoBase + "Z";
  const baseMs = Date.parse(timezoneReady);
  if (!Number.isFinite(baseMs)) return null;
  const multiplier =
    unit.startsWith("second") ? 1000 :
      unit.startsWith("minute") ? 60_000 :
        unit.startsWith("hour") ? 3_600_000 :
          86_400_000;
  return new Date(baseMs + value * multiplier).toISOString();
}

function inferSensorType(text: string, variableNames: string[]): ImportedSensorType {
  const haystack = (text + " " + variableNames.join(" ")).toLowerCase();
  if (haystack.includes("glider")) return "glider";
  if (haystack.includes("argo") || haystack.includes("float")) return "argo";
  if (haystack.includes("ctd") || haystack.includes("xctd")) return "ctd";
  if (
    haystack.includes("bgc") ||
    haystack.includes("chlorophyll") ||
    haystack.includes("chla") ||
    haystack.includes("oxygen") ||
    haystack.includes("doxy") ||
    haystack.includes("nitrate")
  ) return "bgc";
  return "other";
}

function applyPacking(value: number, meta: VariableMeta): number | null {
  if (!Number.isFinite(value)) return null;
  const fill = scalarNumber(meta._FillValue);
  const missing = scalarNumber(meta.missing_value);
  if ((fill != null && value === fill) || (missing != null && value === missing)) return null;
  const scale = scalarNumber(meta.scale_factor) ?? 1;
  const offset = scalarNumber(meta.add_offset) ?? 0;
  const unpacked = value * scale + offset;
  return Number.isFinite(unpacked) ? unpacked : null;
}

export async function parseBrowserNetcdf(file: File): Promise<NetcdfBrowserImport> {
  const { NetCDF4 } = await import("@earthyscience/netcdf4-wasm");
  const wasmPath = new URL("./netcdf4-wasm.wasm", window.location.href).toString();
  const dataset = await NetCDF4.fromBlobLazy(file, { wasmPath });

  try {
    const metadataRaw = await dataset.getFullMetadata();
    const dimensionsRaw = await dataset.getDims();
    const globalAttributes = await dataset.getGlobalAttributes();

    const variables = metadataRaw as VariableMeta[];
    const dimensions = Object.entries(dimensionsRaw as Record<string, { size?: number }>).map(([name, item]) => ({
      name,
      size: Number(item?.size ?? 0)
    }));

    const longitudeMeta = coordinateMeta(variables, ["longitude", "lon", "x"], "longitude", "x");
    const latitudeMeta = coordinateMeta(variables, ["latitude", "lat", "y"], "latitude", "y");
    const depthMeta = coordinateMeta(variables, ["depth", "depth_m", "z", "lev", "level"], "depth", "z");
    const timeMeta = coordinateMeta(variables, ["time", "juld", "date_time"], "time", "t");

    const notes: string[] = [];
    const globals = globalAttributes as Record<string, unknown>;
    const conventions = scalarText(globals.Conventions ?? globals.conventions);

    if (!longitudeMeta) notes.push("Longitude coordinate was not identified from name/standard_name/axis metadata.");
    if (!latitudeMeta) notes.push("Latitude coordinate was not identified from name/standard_name/axis metadata.");
    if (!depthMeta) notes.push("Depth coordinate was not identified from name/standard_name/axis metadata.");
    if (!timeMeta) notes.push("Time coordinate was not identified from name/standard_name/axis metadata.");

    const coordinateNames = new Set(
      [longitudeMeta?.name, latitudeMeta?.name, depthMeta?.name, timeMeta?.name].filter(Boolean) as string[]
    );
    const depthShape = depthMeta?.shape ?? null;
    const levelCount = depthShape?.at(-1) ?? 0;
    const profileCount = depthShape && depthShape.length > 1 ? product(depthShape.slice(0, -1)) : 1;

    const candidateVariables = variables.filter((meta) =>
      !coordinateNames.has(meta.name) &&
      Boolean(meta.units) &&
      Boolean(depthShape) &&
      sameShape(meta.shape, depthShape)
    );

    const inspectedVariables: NetcdfVariableInspection[] = variables.map((meta) => ({
      name: meta.name,
      dimensions: meta.dimensions ?? [],
      shape: meta.shape ?? [],
      units: scalarText(meta.units) || null,
      standard_name: scalarText(meta.standard_name) || null,
      axis: scalarText(meta.axis) || null,
      positive: scalarText(meta.positive) || null,
      importable_profile_variable: candidateVariables.some((item) => item.name === meta.name)
    }));

    const records: Array<Record<string, unknown>> = [];
    const coordinatesReady =
      longitudeMeta && latitudeMeta && depthMeta && timeMeta && depthShape && levelCount > 0;

    if (coordinatesReady) {
      const longitudeRaw = await dataset.getVariableArray(longitudeMeta.name);
      const latitudeRaw = await dataset.getVariableArray(latitudeMeta.name);
      const depthRaw = await dataset.getVariableArray(depthMeta.name);
      const timeRaw = await dataset.getVariableArray(timeMeta.name);
      const longitudes = numericArray(longitudeRaw);
      const latitudes = numericArray(latitudeRaw);
      const depths = numericArray(depthRaw);
      const times = numericArray(timeRaw);
      const timeUnits = scalarText(timeMeta.units);
      const depthUnits = scalarText(depthMeta.units).toLowerCase();
      const depthPositive = scalarText(depthMeta.positive).toLowerCase();

      const depthIsMetres =
        depthUnits === "m" ||
        depthUnits.includes("meter") ||
        depthUnits.includes("metre") ||
        metadataText(depthMeta, "standard_name") === "depth";
      const depthPositiveOkay = !depthPositive || depthPositive === "down";

      if (!depthIsMetres) {
        notes.push("Depth units are not confirmed metres; the file is inspectable but profile rows are not imported.");
      }
      if (!depthPositiveOkay) {
        notes.push("Depth is not positive-down; the file is inspectable but profile rows are not imported.");
      }
      if (!timeUnits.toLowerCase().includes("since")) {
        notes.push("Time units are not a supported CF '<unit> since <epoch>' expression.");
      }

      if (depthIsMetres && depthPositiveOkay && timeUnits.toLowerCase().includes("since")) {
        const sourceText = [
          scalarText(globals.source),
          scalarText(globals.institution),
          file.name
        ].filter(Boolean).join(" · ");
        const datasetId =
          scalarText(globals.id) ||
          scalarText(globals.dataset_id) ||
          scalarText(globals.title) ||
          file.name;
        const platformBase =
          scalarText(globals.platform_id) ||
          scalarText(globals.platform) ||
          "local-file:" + file.name;
        const sensorType = inferSensorType(
          [
            scalarText(globals.featureType),
            scalarText(globals.title),
            scalarText(globals.source),
            file.name
          ].join(" "),
          candidateVariables.map((item) => item.name)
        );

        const dataByVariable = new Map<string, number[]>();
        for (const variable of candidateVariables) {
          const raw = await dataset.getVariableArray(variable.name);
          dataByVariable.set(variable.name, numericArray(raw));
        }

        for (let profileIndex = 0; profileIndex < profileCount; profileIndex += 1) {
          const longitude = validCoordinate(
            coordinateAtProfile(longitudes, profileIndex, profileCount, levelCount) ?? Number.NaN,
            -180,
            180
          );
          const latitude = validCoordinate(
            coordinateAtProfile(latitudes, profileIndex, profileCount, levelCount) ?? Number.NaN,
            -90,
            90
          );
          const timeValue = coordinateAtProfile(times, profileIndex, profileCount, levelCount);
          const timestamp = timeValue == null ? null : decodeCfTime(timeValue, timeUnits);
          if (longitude == null || latitude == null || !timestamp) continue;

          for (let levelIndex = 0; levelIndex < levelCount; levelIndex += 1) {
            const flatIndex = profileIndex * levelCount + levelIndex;
            const depth = applyPacking(depths[flatIndex] ?? Number.NaN, depthMeta);
            if (depth == null || depth < 0 || depth > 12_000) continue;

            for (const variable of candidateVariables) {
              const values = dataByVariable.get(variable.name) ?? [];
              const value = applyPacking(values[flatIndex] ?? Number.NaN, variable);
              if (value == null) continue;
              records.push({
                longitude,
                latitude,
                depth_m: depth,
                timestamp,
                variable: scalarText(variable.standard_name) || variable.name,
                value,
                units: scalarText(variable.units),
                source: sourceText || "Local NetCDF · " + file.name,
                platform_id: profileCount > 1
                  ? platformBase + " · profile " + (profileIndex + 1)
                  : platformBase,
                sensor_type: sensorType,
                dataset_id: datasetId
              });
            }
          }
        }
      }
    }

    if (candidateVariables.length === 0 && depthMeta) {
      notes.push("No data variable shares the detected depth-profile shape with units metadata; the file is inspected but not converted into an observation layer.");
    }
    if (records.length === 0 && candidateVariables.length > 0) {
      notes.push("Profile-shaped variables were found, but canonical lon/lat/depth/time metadata was insufficient for safe 3D import.");
    }

    return {
      inspection: {
        filename: file.name,
        file_format: dataset.file_format || "NetCDF",
        conventions,
        dimensions,
        coordinates: {
          longitude: longitudeMeta?.name ?? null,
          latitude: latitudeMeta?.name ?? null,
          depth: depthMeta?.name ?? null,
          time: timeMeta?.name ?? null
        },
        variables: inspectedVariables,
        profile_shape: depthShape,
        generated_profile_rows: records.length,
        cf_profile_ready: records.length > 0,
        notes
      },
      records
    };
  } finally {
    await dataset.close();
  }
}
