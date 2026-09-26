import type { PageId } from "../navigation";
import { PAGE_ITEMS } from "../navigation";

interface Props {
  page: PageId;
  focusMode: boolean;
  onNavigate: (page: PageId) => void;
  onToggleFocus: () => void;
  onOpenSources: () => void;
}

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
        <div className="rail-title">PAGES</div>
        {PAGE_ITEMS.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? "active" : ""}
            onClick={() => onNavigate(item.id)}
            title={item.description}
            aria-label={item.label}
          >
            <strong>{item.short}</strong>
            <span>{item.label}</span>
          </button>
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
        <button onClick={() => onNavigate("data-lab")} title="Open additional dataset workspace" aria-label="Open Data Lab">
          <strong>+</strong>
          <span>Add data</span>
        </button>
        <button onClick={() => onNavigate("about")} title="Open scientific methods and system information" aria-label="Science & System">
          <strong>?</strong>
          <span>Science</span>
        </button>
      </aside>
    </>
  );
}
