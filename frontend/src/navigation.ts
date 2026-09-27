export type PageId = "explore" | "observations" | "telemetry" | "compare" | "anomaly" | "data-lab" | "about";

export const PAGE_ITEMS: Array<{
  id: PageId;
  short: string;
  label: string;
  description: string;
}> = [
  { id: "explore", short: "3D", label: "3D Explorer", description: "Selectable Cesium globe and scientific water-column 3D" },
  { id: "observations", short: "NET", label: "Observation Network", description: "Argo, Glider, CTD and BGC profile adapters with source-native positions" },
  { id: "telemetry", short: "TEL", label: "Telemetry", description: "Depth, time and ocean telemetry visual analytics" },
  { id: "compare", short: "OBS", label: "Model vs Observation", description: "Argo comparison, bias and anomaly evidence" },
  { id: "anomaly", short: "FLAG", label: "Anomaly Screening", description: "Explainable spatial extremes and Argo residual outliers" },
  { id: "data-lab", short: "DATA", label: "Data Lab", description: "Local CSV/JSON schema, quality and provenance validation" },
  { id: "about", short: "INFO", label: "Science & System", description: "Sources, methods, limits and architecture" }
];

export function routeFromHash(hash: string): PageId {
  const route = hash.replace(/^#\/?/, "").split(/[?&]/)[0];
  return PAGE_ITEMS.some((item) => item.id === route) ? (route as PageId) : "explore";
}
