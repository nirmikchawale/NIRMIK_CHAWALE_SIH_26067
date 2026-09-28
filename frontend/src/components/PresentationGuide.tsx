import { useEffect, useState } from "react";

import "./JudgeClarity.css";

const STEPS = [
  {
    title: "1. Establish the ocean question",
    question: "What is happening in this ocean region right now?",
    proof: "Open the verified GLORYS temperature field in geographic 3D and point out the real study region, source, coordinates and active variable.",
    line: "We begin with the numerical ocean state itself before making any analytical claim."
  },
  {
    title: "2. Go below the surface",
    question: "Does that surface pattern continue through depth?",
    proof: "Change depth, enter Water Column 3D, and demonstrate genuine depth coordinates plus one required control such as opacity, color range or isosurface.",
    line: "OceanTwin is not a flat map: the same field can be interrogated through the water column."
  },
  {
    title: "3. Add the time dimension",
    question: "How does the field change with time?",
    proof: "Switch to the INCOIS multi-time physical source and step through genuine timestamps or start playback. State that the GLORYS comparison baseline itself remains single-time.",
    line: "The time axis is genuine source time, not duplicated frames."
  },
  {
    title: "4. Bring in a real instrument",
    question: "What did an in-situ sensor actually observe?",
    proof: "Open a verified Glider, CTD or BGC profile and point out position, UTC time, depth, measured variable, source and QC/provenance.",
    line: "The observation is independently inspectable evidence, not a decorative marker."
  },
  {
    title: "5. Compare model and observation",
    question: "How closely does the model agree with the measured profile?",
    proof: "Open the Argo diagnostic comparison and show collocation, vertical interpolation, Model − Observation bias, MAE/RMSE and the depth-dependent mismatch.",
    line: "We quantify agreement and disagreement instead of simply placing model and observation side by side."
  },
  {
    title: "6. Finish with trust and extensibility",
    question: "Can a scientist trust, reproduce and extend what they just saw?",
    proof: "Open Sources & QC, then show provenance, limitations, ingestion, source/plugin architecture and standards pathways.",
    line: "Every visual claim should trace back to a source, method and limitation."
  }
];

export function PresentationGuide({ onStep, onClose }: { onStep: (step: number) => void; onClose: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const current = STEPS[step];

  return (
    <section className="presentation-guide" aria-label="Presentation guide">
      <div className="presentation-guide-copy">
        <span className="eyebrow">Judge journey · {step + 1} / {STEPS.length}</span>
        <h2>{current.title}</h2>
        <p className="presentation-guide-question"><strong>Judge question:</strong> {current.question}</p>
        <p><strong>Show:</strong> {current.proof}</p>
        <p className="presentation-guide-line"><strong>One-line explanation:</strong> {current.line}</p>
      </div>
      <div className="guide-actions">
        <button type="button" onClick={() => onStep(step)}>Show this evidence</button>
        <button
          type="button"
          disabled={step === 0}
          onClick={() => {
            const next = step - 1;
            setStep(next);
            onStep(next);
          }}
        >
          Back
        </button>
        <button
          type="button"
          disabled={step === STEPS.length - 1}
          onClick={() => {
            const next = step + 1;
            setStep(next);
            onStep(next);
          }}
        >
          Next →
        </button>
        <button type="button" aria-label="Close presentation guide" onClick={onClose}>Close</button>
      </div>
    </section>
  );
}
