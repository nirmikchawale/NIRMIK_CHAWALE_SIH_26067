import { NetCDFReader } from "netcdfjs";

export const USER_OBSERVATION_SESSION_KEY = "oceantwin-user-observation-records-v1";

export interface UserObservationRecord {
  longitude: number;
  latitude: number;
  depth_m: number;
  timestamp: string;
  variable: string;
  value: number;
  units: string;
  source: string;
  platform_id?: string;
  qc_flag?: string;
  dataset_id?: string;
}

interface NcAttribute {
  name: string;
  value: unknown;
}

interface NcVariable {
  name: string;
  dimensions: number[];
  attributes: NcAttribute[];
  type?: string;
}

function flatten(values: unknown): unknown[] {
  if (!Array.isArray(values)) return [values];
  return values.flatMap((value) => flatten(value));
}

function attr(variable: NcVariable, name: string): unknown {
  return variable.attributes?.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value;
}

function globalAttr(reader: NetCDFReader, name: string): unknown {
  return reader.globalAttributes.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value;
}

function findVariable(reader: NetCDFReader, names: string[]): NcVariable | null {
  const lowered = names.map((name) => name.toLowerCase());
  return (reader.variables as NcVariable[]).find((variable) => lowered.includes(variable.name.toLowerCase())) ?? null;
}

function finiteNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function decodeTime(value: unknown, units: string): string {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (Number.isFinite(parsed.valueOf())) return parsed.toISOString();
  }
  const number = finiteNumber(value);
  if (number == null) throw new Error("NetCDF time coordinate contains a non-numeric value.");

  const match = units.match(/^\s*(seconds?|minutes?|hours?|days?)\s+since\s+(.+)$/i);
  if (!match) throw new Error(`NetCDF time units "${units}" are not a supported CF "<unit> since <origin>" definition.`);
  const origin = new Date(match[2].trim().replace(/ UTC$/i, "Z"));
  if (!Number.isFinite(origin.valueOf())) throw new Error(`NetCDF time origin "${match[2]}" is invalid.`);
  const factor =
    /^second/i.test(match[1]) ? 1000 :
    /^minute/i.test(match[1]) ? 60_000 :
    /^hour/i.test(match[1]) ? 3_600_000 :
    86_400_000;
  return new Date(origin.valueOf() + number * factor).toISOString();
}

function unravel(flatIndex: number, shape: number[]): number[] {
  const coordinates = new Array(shape.length).fill(0);
  let rest = flatIndex;
  for (let index = shape.length - 1; index >= 0; index -= 1) {
    const size = Math.max(1, shape[index]);
    coordinates[index] = rest % size;
    rest = Math.floor(rest / size);
  }
  return coordinates;
}

function coordinateValue(
  reader: NetCDFReader,
  coordinate: NcVariable,
  dataVariable: NcVariable,
  dataIndices: number[]
): unknown {
  const values = flatten(reader.getDataVariable(coordinate.name));
  if (values.length === 1) return values[0];
  if (coordinate.dimensions.length !== 1) {
    throw new Error(`NetCDF coordinate "${coordinate.name}" must be one-dimensional for browser ingestion.`);
  }
  const dimensionId = coordinate.dimensions[0];
  const dataDimensionPosition = dataVariable.dimensions.indexOf(dimensionId);
  if (dataDimensionPosition < 0) {
    throw new Error(`NetCDF variable "${dataVariable.name}" is not indexed by coordinate "${coordinate.name}".`);
  }
  return values[dataIndices[dataDimensionPosition]];
}

function unitsOf(variable: NcVariable): string {
  const value = attr(variable, "units");
  return value == null ? "" : String(value);
}

export function saveUserObservations(records: UserObservationRecord[]): void {
  const payload = {
    schema: "oceantwin-user-observations-v1",
    saved_utc: new Date().toISOString(),
    records: records.slice(0, 100_000)
  };
  sessionStorage.setItem(USER_OBSERVATION_SESSION_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("oceantwin:user-observations-updated"));
}

export function loadUserObservations(): UserObservationRecord[] {
  const raw = sessionStorage.getItem(USER_OBSERVATION_SESSION_KEY);
  if (!raw) return [];
  try {
    const payload = JSON.parse(raw) as { records?: UserObservationRecord[] };
    return Array.isArray(payload.records) ? payload.records : [];
  } catch {
    return [];
  }
}

export function clearUserObservations(): void {
  sessionStorage.removeItem(USER_OBSERVATION_SESSION_KEY);
  window.dispatchEvent(new CustomEvent("oceantwin:user-observations-updated"));
}

export function parseNetcdfClassic(
  buffer: ArrayBuffer,
  filename: string,
  maxRecords = 100_000
): { records: UserObservationRecord[]; conventions: string; version: string; variables: string[] } {
  const reader = new NetCDFReader(buffer);
  const variables = reader.variables as NcVariable[];
  const longitude = findVariable(reader, ["longitude", "lon"]);
  const latitude = findVariable(reader, ["latitude", "lat"]);
  const depth = findVariable(reader, ["depth", "depth_m", "z", "lev"]);
  const time = findVariable(reader, ["time"]);

  if (!longitude || !latitude || !depth || !time) {
    throw new Error("NetCDF ingestion requires CF-style longitude, latitude, depth and time coordinate variables.");
  }
  const depthUnits = unitsOf(depth).toLowerCase();
  if (!/(^|\s)(m|meter|meters|metre|metres)(\s|$)/i.test(depthUnits)) {
    throw new Error(`NetCDF depth coordinate must be metres for fail-closed ingestion; found "${unitsOf(depth) || "unspecified"}".`);
  }
  const positive = String(attr(depth, "positive") ?? "down").toLowerCase();
  if (positive !== "down") {
    throw new Error(`NetCDF depth coordinate must declare positive="down"; found "${positive}".`);
  }
  const timeUnits = unitsOf(time);
  if (!timeUnits) throw new Error("NetCDF time coordinate is missing CF units.");

  const coordinateNames = new Set([longitude.name, latitude.name, depth.name, time.name].map((name) => name.toLowerCase()));
  const numericVariables = variables.filter((variable) => {
    if (coordinateNames.has(variable.name.toLowerCase())) return false;
    const units = unitsOf(variable);
    if (!units) return false;
    return variable.dimensions.includes(depth.dimensions[0]);
  });
  if (!numericVariables.length) {
    throw new Error("NetCDF file contains no depth-resolved data variable with explicit units.");
  }

  const source = String(
    globalAttr(reader, "institution") ??
    globalAttr(reader, "source") ??
    globalAttr(reader, "title") ??
    filename
  );
  const datasetId = String(globalAttr(reader, "id") ?? filename.replace(/\.[^.]+$/, ""));
  const records: UserObservationRecord[] = [];

  for (const variable of numericVariables) {
    const data = flatten(reader.getDataVariable(variable.name));
    const shape = variable.dimensions.map((dimensionId) => reader.dimensions[dimensionId]?.size ?? 1);
    const expected = shape.reduce((product, size) => product * Math.max(size, 1), 1);
    if (data.length !== expected) continue;

    const fillValues = [attr(variable, "_FillValue"), attr(variable, "missing_value")]
      .map(finiteNumber)
      .filter((value): value is number => value != null);
    const variableUnits = unitsOf(variable);
    const standardName = String(attr(variable, "standard_name") ?? variable.name);

    for (let flatIndex = 0; flatIndex < data.length; flatIndex += 1) {
      const value = finiteNumber(data[flatIndex]);
      if (value == null || fillValues.some((fill) => Math.abs(value - fill) < 1e-12)) continue;
      const indices = unravel(flatIndex, shape);
      const lon = finiteNumber(coordinateValue(reader, longitude, variable, indices));
      const lat = finiteNumber(coordinateValue(reader, latitude, variable, indices));
      const depthValue = finiteNumber(coordinateValue(reader, depth, variable, indices));
      const timeValue = coordinateValue(reader, time, variable, indices);
      if (lon == null || lat == null || depthValue == null) continue;

      records.push({
        longitude: lon,
        latitude: lat,
        depth_m: depthValue,
        timestamp: decodeTime(timeValue, timeUnits),
        variable: standardName,
        value,
        units: variableUnits,
        source,
        dataset_id: datasetId
      });
      if (records.length > maxRecords) {
        throw new Error(`NetCDF expands to more than ${maxRecords.toLocaleString()} measurement records; subset the file before browser ingestion.`);
      }
    }
  }

  if (!records.length) throw new Error("NetCDF file produced no finite CF-compatible ocean measurement records.");
  return {
    records,
    conventions: String(globalAttr(reader, "Conventions") ?? "not declared"),
    version: reader.version,
    variables: [...new Set(records.map((record) => record.variable))]
  };
}
