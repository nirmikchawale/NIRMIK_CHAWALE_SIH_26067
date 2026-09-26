export type PageId = "explore" | "telemetry" | "compare" | "data-lab" | "about";

export const PAGE_ITEMS: Array<{
  id: PageId;
  short: string;
  label: string;
  description: string;
}> = [
  { id: "explore", short: "3D", label: "3D Explorer", description: "Cesium ocean field and water-column exploration" },
  { id: "telemetry", short: "TEL", label: "Telemetry", description: "Depth, time and ocean telemetry visual analytics" },
  { id: "compare", short: "OBS", label: "Model vs Observation", description: "Argo comparison, bias and anomaly evidence" },
  { id: "data-lab", short: "DATA", label: "Data Lab", description: "Validate and analyse additional user datasets" },
  { id: "about", short: "INFO", label: "Science & System", description: "Sources, methods, limits and architecture" }
];

export function routeFromHash(hash: string): PageId {
  const route = hash.replace(/^#\/?/, "").split(/[?&]/)[0];
  return PAGE_ITEMS.some((item) => item.id === route) ? (route as PageId) : "explore";
}
