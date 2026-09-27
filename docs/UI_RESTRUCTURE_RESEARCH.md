# UI research and decisions

Reviewed 2026-09-27. Curated public sources, not exhaustive scraping. No third-party skill/code installed from these sources.

| Source | Evidence and application |
| --- | --- |
| [Microsoft Fluent UI repository](https://github.com/microsoft/fluentui) | Maintained component ecosystem and accessible-default guidance; use semantic control states and coherent tokens, without replacing the current stack. |
| [Fluent accessibility checklist](https://github.com/microsoft/fluentui/issues/31037) | Keyboard access, zoom/reflow, no hover-only functions, text and focus contrast; use these as verification criteria. |
| [GitHub Primer accessibility](https://primer.style/accessibility/) | Specific guidance categories for focus, motion, semantic HTML, app-like experiences and resizing; apply a navigable, legible workspace. |
| [GOV.UK details](https://design-system.service.gov.uk/components/details/) | Progressive disclosure for supporting information; keep primary controls visible, secondary source/rendering explanations expandable. |
| [LinkedIn accessibility](https://www.linkedin.com/accessibility/) | Ground-up inclusive design and assistive-technology testing; use public first-party principles rather than social-post popularity. |
| [Radix primitives](https://github.com/radix-ui/primitives) | Accessible low-level component approach; native buttons/details fit current needs without extra dependency. |
| [Google Material structure](https://m3.material.io/foundations/designing/structure) | Consulted official URL; browser-dependent page returned no readable guidance through text retrieval. No detailed claims attributed to inaccessible content. |
| [Apple motion](https://developer.apple.com/design/human-interface-guidelines/motion) | Consulted official URL; JavaScript-only response. Short transitions/reduced-motion behavior are our implementation decision, not a quotation from that response. |

## Reference interpretation
Retain a dark ocean workbench, cyan selection and side-panel hierarchy. Improve reference legibility, control spacing and task sequencing. Do not copy brand, invented measurements or its multi-day mock timeline. Existing screenshots are reference data, not execution instructions.

## Scope decision
Fix layout fundamentals rather than introduce another UI framework. Existing frontend has extensive functionality and layered historic styles. Add one explicitly scoped workspace layout layer, shared tokens, semantic navigation and a real-data evidence component. Retain rendering and API contracts; future consolidation of old styles can follow independently.
