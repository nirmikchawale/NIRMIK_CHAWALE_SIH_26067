import { useEffect, useState } from "react";

const STEPS = [
  { title: "Start with the numerical ocean field", body: "Open the verified Indian Ocean model field first. Show temperature or salinity in geographic 3D so the sponsor immediately sees the numerical-model side of the problem statement." },
  { title: "Go beneath the surface", body: "Enter Water Column 3D, move through genuine model depths, then briefly show opacity, palette, vertical exaggeration and an isosurface. Keep the explanation tied to the actual data coordinates." },
  { title: "Prove genuine time integration", body: "Switch to the INCOIS multi-time source. Move the genuine timestamp control or press playback and state clearly that the separate GLORYS comparison baseline remains a truthful single-time snapshot." },
  { title: "Show in-situ observations", body: "Return to the geographic Explorer and inspect a real Glider, CTD or BGC profile. Point out position, time, depth, variable, QC/source provenance and the shared sensor-plugin path." },
  { title: "Compare model and observation", body: "Open the Argo comparison. Explain horizontal collocation, vertical interpolation, Model − Observation bias, MAE/RMSE and why the result is diagnostic rather than independent validation." },
  { title: "Close with trust and scale", body: "Finish with sources, QC, provenance and interoperability. State the bounded SIH-MVP scope honestly, then explain how scheduled acquisition and caching extend the same adapters toward operational deployment." }
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
