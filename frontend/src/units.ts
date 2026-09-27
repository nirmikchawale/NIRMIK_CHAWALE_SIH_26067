// Display-only unit labels for judge-facing UI text.
// Scientific payloads, CSV/JSON exports and Data Lab provenance keep the raw
// CF unit strings; this only changes how a unit is printed next to a value.
const CF_DISPLAY_UNITS: Record<string, string> = {
  degrees_c: "°C",
  degree_c: "°C",
  degc: "°C",
  celsius: "°C",
  "1e-3": "PSU",
  psu: "PSU",
  "m s-1": "m/s",
  "m/s": "m/s",
  "mg m-3": "mg/m³",
  "mg/m3": "mg/m³",
  "mg/m^3": "mg/m³",
  m: "m"
};

export function displayUnits(units: string | null | undefined): string {
  if (!units) return "";
  const trimmed = units.trim();
  return CF_DISPLAY_UNITS[trimmed.toLowerCase()] ?? trimmed;
}
