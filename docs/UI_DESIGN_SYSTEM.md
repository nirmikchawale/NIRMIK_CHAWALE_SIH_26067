# OceanTwin 3D — UI Design System

## Purpose

This design system implements the finalisation plan and the 250-feature UI/product backlog without changing the validated scientific method. The UI is local-first, readable at judge distance, responsive, and intentionally conservative.

## Architecture

- `oceantwin/ui/tokens.py` — versioned semantic design tokens.
- `oceantwin/ui/theme.py` — Streamlit/CSS shell, spacing, cards, typography, states and responsive rules.
- `oceantwin/ui/plotly_theme.py` — presentation-only Plotly normalization.
- `oceantwin/ui/components.py` — reusable header, badges, metrics, section headers, helpers, errors, limitations and roadmap components.
- `.streamlit/config.toml` — native Streamlit dark theme.

## Semantic colours

| Meaning | Token |
|---|---|
| Copernicus model | cyan |
| Argo observation | amber |
| Positive Model − Observation | coral |
| Negative Model − Observation | blue |
| Offline/local ready | teal |
| Limitations | gold |
| Errors only | red |

Colour never changes the underlying scientific values.

## Typography

Only offline-safe system fonts are used. No remote font request is required. Titles, chart labels, metadata and helper text use separate type scales.

## Spacing and cards

A 4 px base spacing scale is used. Standard, nested and selected card treatments are defined in the theme. Excessive glow, gradients and decorative hero whitespace are deliberately avoided.

## Responsive targets

The shell is designed for:

- 1366 × 768 judging laptop
- 1920 × 1080 desktop
- tablet/narrow windows
- single-column phone fallback

## Error and loading rules

Judge-facing errors are friendly and do not expose Python tracebacks or absolute paths. Developer diagnostics are disabled by default and can be enabled only with:

```text
OCEANTWIN_DEV_DIAGNOSTICS=1
```

## Scientific guardrail

The UI may rearrange, label, colour or explain evidence. It must not change QC treatment, nearest-valid-cell collocation, linear vertical interpolation, Model − Observation bias, raw files, or processed evidence.
