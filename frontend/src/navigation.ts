export type PageId = "explore" | "telemetry" | "compare" | "anomaly" | "data-lab" | "about";

export const PAGE_ITEMS: Array<{
  id: PageId;
  short: string;
  label: string;
  description: string;
}> = [
  { id: "explore", short: "3D", label: "Explore Ocean", description: "Start with the real 3D field, then move through depth, time and observations" },
  { id: "telemetry", short: "TIME", label: "Depth & Time", description: "Read how the selected ocean field changes through depth and genuine timestamps" },
  { id: "compare", short: "OBS", label: "Model vs Observation", description: "Test what the model shows against matched in-situ Argo evidence" },
  { id: "anomaly", short: "FLAG", label: "Explain Flags", description: "Inspect exactly why a spatial or model-observation residual is statistically unusual" },
  { id: "data-lab", short: "DATA", label: "Ingest Data", description: "Bring compatible NetCDF or tabular observations into the Explorer with validation" },
  { id: "about", short: "TRUST", label: "Trust & Architecture", description: "Verify sources, QC, methods, limitations, standards and system design" }
];

export function routeFromHash(hash: string): PageId {
  const route = hash.replace(/^#\/?/, "").split(/[?&]/)[0];
  return PAGE_ITEMS.some((item) => item.id === route) ? (route as PageId) : "explore";
}
