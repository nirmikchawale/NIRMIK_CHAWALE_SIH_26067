import type { PageId } from "../navigation";
import { PAGE_ITEMS } from "../navigation";

interface Props {
  page: PageId;
  focusMode: boolean;
  onNavigate: (page: PageId) => void;
  onToggleFocus: () => void;
  onOpenSources: () => void;
}

const NAV_GROUPS: Array<{ label: string; pages: PageId[] }> = [
  { label: "EXPLORE", pages: ["explore"] },
  { label: "ANALYSIS", pages: ["telemetry", "compare", "anomaly"] },
  { label: "EVIDENCE", pages: ["data-lab", "about"] }
];

export function AppNavigation({
  page,
  focusMode,
  onNavigate,
  onToggleFocus,
  onOpenSources
}: Props) {
  return (
    <>
      <nav className="feature-rail feature-rail-left" aria-label="OceanTwin pages" aria-hidden={focusMode}>
        <div className="rail-title">WORKSPACE</div>
        {NAV_GROUPS.map((group) => (
          <div className="rail-group" key={group.label}>
            <div className="rail-group-label">{group.label}</div>
            {group.pages.map((pageId) => {
              const item = PAGE_ITEMS.find((candidate) => candidate.id === pageId);
              if (!item) return null;
              return (
                <button
                  key={item.id}
                  className={page === item.id ? "active" : ""}
                  onClick={() => onNavigate(item.id)}
                  title={item.description}
                  aria-label={item.label}
                  aria-current={page === item.id ? "page" : undefined}
                >
                  <strong>{item.short}</strong>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <aside className="feature-rail feature-rail-right" aria-label="OceanTwin actions" aria-hidden={focusMode}>
        <div className="rail-title">ACTIONS</div>
        <button
          onClick={onToggleFocus}
          disabled={page !== "explore"}
          title={page === "explore" ? "Toggle an immersive 3D view" : "Focus 3D is available on the Explorer page"}
          aria-label={focusMode ? "Show panels" : "Focus 3D"}
        >
          <strong>{focusMode ? "UI" : "FOCUS"}</strong>
          <span>{focusMode ? "Show panels" : "Focus 3D"}</span>
        </button>
        <button onClick={onOpenSources} title="Open scientific sources, QC and provenance" aria-label="Sources & QC">
          <strong>QC</strong>
          <span>Sources & QC</span>
        </button>
      </aside>
    </>
  );
}
