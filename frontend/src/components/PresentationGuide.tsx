import { useEffect, useState } from "react";

const STEPS = [
  { title: "Locate the evidence", body: "Start with the verified Indian Ocean study window. Show the model footprint and Argo observations in geographic context." },
  { title: "Explore beneath the surface", body: "Rotate the water column, change the depth, then open View settings to explain opacity, color scale and vertical exaggeration." },
  { title: "Compare model and observation", body: "Read the temperature profiles and signed residuals together. Explain matching, error metrics and the diagnostic limitation." },
  { title: "Show the scientific trail", body: "Finish with data sources, quality controls and provenance. Explain what is verified today and what requires additional evidence." }
];

export function PresentationGuide({ onStep, onClose }: { onStep: (step: number) => void; onClose: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);
  return <section className="presentation-guide" aria-label="Presentation guide">
    <div><span className="eyebrow">Demo guide · {step + 1} / {STEPS.length}</span><h2>{STEPS[step].title}</h2><p>{STEPS[step].body}</p></div>
    <div className="guide-actions"><button type="button" onClick={() => onStep(step)}>Show this step</button><button type="button" disabled={step === 0} onClick={() => { setStep(step - 1); onStep(step - 1); }}>Back</button><button type="button" disabled={step === STEPS.length - 1} onClick={() => { setStep(step + 1); onStep(step + 1); }}>Next →</button><button type="button" aria-label="Close presentation guide" onClick={onClose}>Close</button></div>
  </section>;
}
