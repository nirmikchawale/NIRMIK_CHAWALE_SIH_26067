export type InteropProtocol = "REST" | "OPeNDAP" | "WMS" | "WCS" | "CF" | "ISO 19115";

export interface ServiceEndpoint {
  protocol: InteropProtocol;
  label: string;
  url: string;
  source: string;
  live: boolean;
  note: string;
}

export interface IncoisDatasetService {
  datasetID: string;
  griddap: string;
  wms: string;
  wcs: string;
  iso19115: string;
  fgdc: string;
  infoUrl: string;
}

export interface InteropProbe {
  dataset: IncoisDatasetService | null;
  services: ServiceEndpoint[];
  status: "ready" | "partial" | "error";
  checkedUtc: string;
  error: string;
}

const ALL_DATASETS =
  "https://erddap.incois.gov.in/erddap/tabledap/allDatasets.json?datasetID,griddap,wms,wcs,iso19115,fgdc,infoUrl";

export const INCOIS_PRODUCTS = [
  {
    id: "incois_argo_mnt_VAM",
    title: "ARGO Monthly Variational Analysis",
    role: "3D temperature and salinity · 24 depths · genuine multi-time",
    variables: ["TEMP", "SAL", "TERR", "SERR"],
    operationalClass: "Ocean objective analysis",
    coverage: "Indian Ocean · 30.5–119.5°E · 29.5°S–29.5°N"
  },
  {
    id: "incois_valueadded_products_datasets",
    title: "INCOIS Value Added Products",
    role: "Geostrophic U/V, MLD, ILD, D20/D26, heat content and dynamic height",
    variables: ["GEO_U", "GEO_V", "MLD", "ILD", "D20", "D26", "HTCNT", "DYN_HT"],
    operationalClass: "Derived physical-ocean products",
    coverage: "Indian Ocean · 30.5–119.5°E · 29.5°S–29.5°N"
  },
  {
    id: "IRS_chlorophyll_datasets",
    title: "IRS P4 OCM Chlorophyll",
    role: "Satellite ocean-colour chlorophyll layer for BGC context",
    variables: ["chlorophyll"],
    operationalClass: "Satellite ocean colour",
    coverage: "Indian Ocean satellite product"
  }
] as const;

function timeoutSignal(milliseconds = 10000): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), milliseconds);
  return { signal: controller.signal, cancel: () => window.clearTimeout(timer) };
}

async function fetchJson(url: string): Promise<any> {
  const timeout = timeoutSignal();
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      mode: "cors",
      cache: "no-store",
      signal: timeout.signal
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    timeout.cancel();
  }
}

function rowsFromTable(payload: any): Array<Record<string, unknown>> {
  const names: string[] = payload?.table?.columnNames ?? [];
  const rows: unknown[][] = payload?.table?.rows ?? [];
  return rows.map((row) => {
    const record: Record<string, unknown> = {};
    names.forEach((name, index) => {
      record[name] = row[index];
    });
    return record;
  });
}

function serviceFromRow(record: Record<string, unknown>): IncoisDatasetService {
  const text = (key: string) => {
    const value = record[key];
    return typeof value === "string" ? value : "";
  };
  return {
    datasetID: text("datasetID"),
    griddap: text("griddap"),
    wms: text("wms"),
    wcs: text("wcs"),
    iso19115: text("iso19115"),
    fgdc: text("fgdc"),
    infoUrl: text("infoUrl")
  };
}

export async function discoverIncoisDataset(datasetID: string): Promise<IncoisDatasetService> {
  const payload = await fetchJson(ALL_DATASETS);
  const row = rowsFromTable(payload).find((item) => item.datasetID === datasetID);
  if (!row) throw new Error(`INCOIS allDatasets did not advertise ${datasetID}.`);
  return serviceFromRow(row);
}

export async function probeIncoisInterop(datasetID = "incois_argo_mnt_VAM"): Promise<InteropProbe> {
  const checkedUtc = new Date().toISOString();
  try {
    const dataset = await discoverIncoisDataset(datasetID);
    const services: ServiceEndpoint[] = [
      {
        protocol: "REST",
        label: "OceanTwin canonical REST API",
        url: "/api/catalog",
        source: "OceanTwin FastAPI",
        live: true,
        note: "Read-only catalog/field/volume/currents/profile/telemetry/anomaly/provenance contract."
      },
      {
        protocol: "OPeNDAP",
        label: "INCOIS ERDDAP griddap",
        url: dataset.griddap || "https://erddap.incois.gov.in/erddap/griddap/incois_argo_mnt_VAM",
        source: "INCOIS",
        live: Boolean(dataset.griddap),
        note: "Hyperslab subset access used directly by OceanTwin INCOIS Live."
      },
      {
        protocol: "WMS",
        label: "INCOIS OGC Web Map Service",
        url: dataset.wms || "https://erddap.incois.gov.in/erddap/wms/incois_argo_mnt_VAM/request?",
        source: "INCOIS",
        live: Boolean(dataset.wms),
        note: "OGC map portrayal service discovered from INCOIS allDatasets."
      },
      {
        protocol: "WCS",
        label: "INCOIS OGC Web Coverage Service",
        url: dataset.wcs,
        source: "INCOIS",
        live: Boolean(dataset.wcs),
        note: dataset.wcs
          ? "Coverage-service endpoint discovered live from INCOIS allDatasets."
          : "This ERDDAP dataset did not advertise WCS; OceanTwin surfaces the absence instead of fabricating an endpoint."
      },
      {
        protocol: "CF",
        label: "CF conventions",
        url: dataset.griddap ? dataset.griddap.replace("/griddap/", "/info/") + "/index.html" : "",
        source: "INCOIS metadata",
        live: Boolean(dataset.griddap),
        note: "INCOIS VAM declares CF-1.6 / COARDS / ACDD metadata; Data Lab validates CF-style coordinates, depth and time."
      },
      {
        protocol: "ISO 19115",
        label: "ISO 19115 geographic metadata",
        url: dataset.iso19115,
        source: "INCOIS ERDDAP",
        live: Boolean(dataset.iso19115),
        note: "Standards metadata URL discovered from the active INCOIS catalogue."
      }
    ];
    const advertised = services.filter((service) => service.live).length;
    return {
      dataset,
      services,
      status: advertised === services.length ? "ready" : "partial",
      checkedUtc,
      error: ""
    };
  } catch (reason) {
    return {
      dataset: null,
      services: [],
      status: "error",
      checkedUtc,
      error: reason instanceof Error ? reason.message : String(reason)
    };
  }
}

export async function fetchIncoisCapabilities(url: string): Promise<string> {
  const target = url.includes("?")
    ? `${url}${url.endsWith("?") ? "" : "&"}service=WMS&request=GetCapabilities&version=1.3.0`
    : `${url}?service=WMS&request=GetCapabilities&version=1.3.0`;
  const timeout = timeoutSignal(12000);
  try {
    const response = await fetch(target, { mode: "cors", cache: "no-store", signal: timeout.signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const text = await response.text();
    if (!/WMS_Capabilities|WMT_MS_Capabilities/i.test(text)) {
      throw new Error("Endpoint did not return a WMS capabilities document.");
    }
    return text;
  } finally {
    timeout.cancel();
  }
}
