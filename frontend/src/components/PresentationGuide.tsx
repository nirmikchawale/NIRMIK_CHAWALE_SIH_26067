import { useEffect, useState } from "react";

/**
 * Guided demo: one header control that walks the six SIH26067 demo steps.
 * Each step drives the real interface (see App.tsx `runGuideStep`), so there is
 * no separate presentation layout to maintain. Speaker notes stay hidden unless
 * the presenter opens them, keeping the judge-facing screen clean.
 */
export const GUIDE_STEPS = [
  {
    short: "Ocean field",
    title: "Start with the numerical ocean field",
    body: "Open the verified GLORYS temperature field in geographic 3D. Establish the Indian Ocean study window, model source and real coordinates before discussing analytics."
  },
  {
    short: "Water column",
    title: "Go beneath the surface",
    body: "Change depth, enter Water Column 3D and show genuine depth coordinates. Briefly demonstrate one required rendering control such as opacity, color range or isosurface."
  },
  {
    short: "Time",
    title: "Show genuine ocean time",
    body: "Switch to the INCOIS multi-time physical source. Move through real timestamps or start playback and state explicitly that the GLORYS comparison baseline itself remains single-time."
  },
  {
    short: "Instruments",
    title: "Inspect a real in-situ sensor",
    body: "Return to the geographic Explorer and open a Glider, CTD or BGC profile. Point out position, UTC time, depth, variable, QC/source provenance and the observed profile shape."
  },
  {
    short: "Compare",
    title: "Compare model and observation",
    body: "Open the Argo diagnostic comparison. Explain collocation, vertical matching, Model − Observation bias, MAE/RMSE and why this is diagnostic rather than independent validation."
  },
  {
    short: "Sources",
    title: "Finish with trust and scale",
    body: "Open sources, QC and provenance. Explain that bounded verified windows prove the architecture; scheduled acquisition, cache services and additional adapters are the path to continuous operations."
  }
] as const;

interface Props {
  step: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
}

export function PresentationGuide({ step, onStepChange, onClose }: Props) {
  const [notesOpen, setNotesOpen] = useState(false);
  const current = GUIDE_STEPS[step];
  const last = GUIDE_STEPS.length - 1;

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && step < last) onStepChange(step + 1);
      if (event.key === "ArrowLeft" && step > 0) onStepChange(step - 1);
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [onClose, onStepChange, step, last]);

  return (
    <section className="guided-demo-bar" aria-label="Guided demo">
      <div className="guided-demo-title">
        <span className="guided-demo-count">Step {step + 1} of {GUIDE_STEPS.length}</span>
        <strong>{current.title}</strong>
      </div>
      <ol className="guided-demo-progress" aria-label="Demo steps">
        {GUIDE_STEPS.map((item, index) => (
          <li key={item.short}>
            <button
              type="button"
              className={index === step ? "active" : index < step ? "done" : ""}
              aria-current={index === step ? "step" : undefined}
              aria-label={`Step ${index + 1}: ${item.title}`}
              title={item.title}
              onClick={() => onStepChange(index)}
            >
              <span aria-hidden="true" />
              <em>{item.short}</em>
            </button>
          </li>
        ))}
      </ol>
      <div className="guided-demo-actions">
        <button type="button" disabled={step === 0} onClick={() => onStepChange(step - 1)}>Back</button>
        <button type="button" className="primary" disabled={step === last} onClick={() => onStepChange(step + 1)}>Next</button>
        <button type="button" aria-expanded={notesOpen} onClick={() => setNotesOpen((open) => !open)}>Notes</button>
        <button type="button" aria-label="Exit guided demo" onClick={onClose}>Exit</button>
      </div>
      {notesOpen && (
        <div className="guided-demo-notes" role="note">
          <span className="eyebrow">Speaker notes</span>
          <p>{current.body}</p>
        </div>
      )}
    </section>
  );
}
