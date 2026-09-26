import type { PageId } from "../navigation";

interface Props {
  page: Exclude<PageId, "explore">;
}

const CONTENT: Record<Exclude<PageId, "explore">, {
  eyebrow: string;
  title: string;
  description: string;
  cards: Array<{ title: string; text: string; state: string }>;
}> = {
  telemetry: {
    eyebrow: "OCEAN ANALYTICS",
    title: "Telemetry workspace",
    description: "A dedicated page for depth-aware telemetry and genuine time-series views. It will never invent extra timestamps when the selected source has only one verified time step.",
    cards: [
      { title: "Depth telemetry", text: "Water-column structure, depth slices and derived depth statistics.", state: "NEXT MODULE" },
      { title: "Time series", text: "Enabled only for sources containing multiple genuine timestamps.", state: "SCIENTIFIC LOCK" },
      { title: "Ocean variables", text: "Temperature, salinity and horizontal current telemetry with units and provenance.", state: "VERIFIED INPUTS" }
    ]
  },
  compare: {
    eyebrow: "EVIDENCE",
    title: "Model vs observation",
    description: "A separate evidence page for Argo-model collocation, profile diagnostics, bias-by-depth and scientifically defensible anomaly flags.",
    cards: [
      { title: "Profile comparison", text: "Model and observation curves with matched-depth evidence.", state: "EXISTING CORE" },
      { title: "Bias diagnostics", text: "Model − Observation by depth with MAE, RMSE and collocation distance.", state: "EXISTING CORE" },
      { title: "Anomaly evidence", text: "Will use explicit rules/statistics with thresholds and limitations, never an unexplained black-box label.", state: "PLANNED" }
    ]
  },
  "data-lab": {
    eyebrow: "USER DATA",
    title: "Additional dataset lab",
    description: "A guarded ingestion workspace for user-supplied ocean data. Files must pass schema, coordinates, units, timestamps and provenance checks before analysis.",
    cards: [
      { title: "Upload", text: "Accept supported tabular/scientific files through a controlled validation flow.", state: "PLANNED" },
      { title: "Validate", text: "Check coordinates, depth convention, variables, units, timestamps and missingness.", state: "REQUIRED" },
      { title: "Analyse", text: "Only validated datasets become eligible for telemetry and comparison views.", state: "FAIL-SAFE" }
    ]
  },
  about: {
    eyebrow: "SCIENCE & SYSTEM",
    title: "How OceanTwin works",
    description: "A dedicated explanation page for data sources, architecture, methods, QC, limitations and reproducibility.",
    cards: [
      { title: "Scientific sources", text: "Copernicus GLORYS12V1 reanalysis and verified Argo comparison evidence.", state: "PROVENANCE" },
      { title: "Architecture", text: "React + Cesium judge-facing application backed by the validated Python scientific core.", state: "TRACEABLE" },
      { title: "Limitations", text: "One genuine bundled model timestamp; diagnostic comparison is not independent validation.", state: "EXPLICIT" }
    ]
  }
};

export function FeaturePlaceholder({ page }: Props) {
  const content = CONTENT[page];
  return (
    <main className="feature-page" data-page={page}>
      <section className="feature-page-hero">
        <div className="section-kicker">{content.eyebrow}</div>
        <h2>{content.title}</h2>
        <p>{content.description}</p>
      </section>
      <section className="feature-page-grid">
        {content.cards.map((card) => (
          <article key={card.title} className="feature-page-card">
            <span>{card.state}</span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>
      <div className="feature-page-note">
        This page is part of the new multi-page shell. Its scientific feature is implemented and released independently before this placeholder is removed.
      </div>
    </main>
  );
}
