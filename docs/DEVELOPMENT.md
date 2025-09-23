# Digital Embryo Explorable — Development Stages

This document tracks the planned stages (v0.1–v0.4), current progress, and next tasks. It complements the high-level spec in `README.md`.

## Status Overview

- v0.1 Core Viewer — Mostly complete
- v0.2 Data & Perturbations — In progress
- v0.3 Polish & Refinement — Planned
- v0.4 Final Pass — Planned

## v0.1 Core Viewer

- [x] 3D viewer with instanced spheres
- [x] Timeline slider and play/pause
- [x] Smooth stage interpolation (fractional slider)
- [x] Hover/select lineage via click
- [x] Dark theme + layout scaffold
- [x] Early cleavage shaping (zygote→2→3/4 packed cluster)
- [x] Zona pellucida (translucent shell)
- [x] Short relaxation for contact + constraints (zona/cavity)
- [ ] Camera presets per stage

Notes:
- Blastocyst: TE shell, ICM compact cluster at a pole, interior cavity kept empty
- Expression shown for zygote, 2/4/8/16, blastocyst(TE/ICM)

## v0.2 Data & Perturbation Logic

- [x] Gene expression panel fed by JSON
- [x] Perturbation toggles and banner
- [x] Reset button to initial state
- [x] Stronger perturbation visuals (AURKA adds size variability + irregular packing; glycolysis slows growth and reduces cavity)
- [x] Expand expression coverage and refine copy in About modal

## v0.3 Polish & Refinement

- [ ] Compaction curve polishing and packing stability
- [ ] Blastocoel inner surface visualization (disabled for clarity; cavity simulated only)
- [ ] Camera control presets (removed per UX feedback; OrbitControls only)
- [ ] Mini-charts (sparklines/heatmaps) in gene panel
- [x] Mini-charts (sparklines) in gene panel
- [ ] Replace inline styles with Tailwind

## v0.4 Final Pass

- [ ] Performance pass (lazy loading, code-splitting, instancing budgets)
- [ ] Accessibility pass (ARIA, keyboard nav, focus management)
- [x] Shareable state via URL params (t, lineage, visibility, perts)
- [ ] Finalize copy and tooltips

## Developer Notes

- Stack: React + TypeScript + Vite; three.js via react-three-fiber; Zustand for state.
- Data: `app/public/data/*` JSON files for stages, expression, and perturbations.
- Running locally:
  - Dev: `cd app && npm install && npm run dev`
  - Build + preview: `cd app && npm run build && npm run preview`
  - LAN/WSL: append `-- --host 0.0.0.0` to `dev`/`preview`

### Keyboard shortcuts

- Space: Play/Pause
- Left/Right Arrow: Scrub timeline by small step
- R: Reset
