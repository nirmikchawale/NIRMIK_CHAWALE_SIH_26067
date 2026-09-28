import { useEffect, useState } from "react";

const STEPS = [
  { title: "Start with the numerical ocean field", body: "Open the verified GLORYS temperature field in geographic 3D. Establish the Indian Ocean study window, model source and real coordinates before discussing analytics." },
  { title: "Go beneath the surface", body: "Change depth, enter Water Column 3D and show genuine depth coordinates. Briefly demonstrate one required rendering control such as opacity, color range or isosurface." },
  { title: "Show genuine ocean time", body: "Switch to the INCOIS multi-time physical source. Move through real timestamps or start playback and state explicitly that the GLORYS comparison baseline itself remains single-time." },
  { title: "Inspect a verified Argo float", body: "Return to the geographic Explorer and let the tour focus the selected Argo observation. Read the anchored coordinates, UTC time, matched-level evidence and signed Model − Observation bias before opening the detailed profile." },
  { title: "Compare model and observation", body: "Open the Argo diagnostic comparison. Explain collocation, vertical matching, Model − Observation bias, MAE/RMSE and why this is diagnostic rather than independent validation." },
  { title: "Finish with trust and scale", body: "Open sources, QC and provenance. Explain that bounded verified windows prove the architecture; scheduled acquisition, cache services and additional adapters are the path to continuous operations." }
]

export function PresentationGuide({ onStep, onClose }: { onStep: (step: number) => void; onClose: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);
  return <section className="presentation-guide" aria-label="Presentation guide" data-guide-step={step}>
    <div><span className="eyebrow">Demo guide · {step + 1} / {STEPS.length}</span><h2>{STEPS[step].title}</h2><p>{STEPS[step].body}</p></div>
    <div className="guide-actions"><button type="button" onClick={() => onStep(step)}>Show this step</button><button type="button" disabled={step === 0} onClick={() => { setStep(step - 1); onStep(step - 1); }}>Back</button><button type="button" disabled={step === STEPS.length - 1} onClick={() => { setStep(step + 1); onStep(step + 1); }}>Next →</button><button type="button" aria-label="Close presentation guide" onClick={onClose}>Close</button></div>
  </section>;
}
