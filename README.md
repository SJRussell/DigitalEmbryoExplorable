# Digital Embryo Interactive Explorable (MVP v1.0)

An interactive, self‑contained web app that visualizes early human embryo development (zygote → blastocyst). Users can scrub through developmental stages, inspect lineages and gene expression, and toggle simple in‑silico perturbations to see plausible outcomes.

This POC demonstrates core concepts from the larger Digital Embryo Platform vision, focusing on the essential interactive visualization and perturbation capabilities that will form the foundation of the full three-panel research interface.

Non‑goals for the MVP: no user uploads, no backend/database, no analytics; this is a teaching and vision‑casting tool.

## Quick Start

- Prereqs: Node.js 18+ and npm
- Dev server:
  1) `cd app`
  2) `npm install`
  3) `npm run dev`
  4) Open `http://localhost:5173`

- Build + Preview:
  1) `cd app`
  2) `npm run build`
  3) `npm run preview`
  4) Open the printed local URL

- Access from other devices or WSL: append `--host 0.0.0.0` to the dev/preview commands, e.g. `npm run dev -- --host 0.0.0.0` and open the LAN URL shown in the terminal.

## Project Structure

- `app/`: React + TypeScript + Vite SPA
- `app/public/data/`: Static JSON for stages, expression, perturbations
- `docs/DEVELOPMENT.md`: Development notes and progress by version

## Core Features

### 3D Embryo Observatory (Center Panel Concept)
- **Morphological View**: 3D embryo visualization with distinct stages: Zygote, Cleavage (2/4/8/16‑cell), Morula, Blastocyst (ICM/TE/Blastocoel)
- **Interactive Controls**: Click to select cells, hover for molecular profiles, drag to rotate, scroll to zoom
- **Smart Coloring**: By lineage (TE/ICM/undetermined) with semi-translucent cells and specular highlights
- **Lineage Visualization**: Color-coded cell fate indicators

### Temporal Control (Timeline Concept)
- Timeline scrubber with play/pause functionality for stage progression
- Smooth interpolation between stages (sub‑step slider) for continuous transitions
- **Event Annotations**: Key developmental milestones marked on timeline

### Analysis Suite (Right Panel Concept)
- **Molecular Profile Display**: Gene expression panel showing key markers (OCT4, CDX2, GATA3, etc.)
- **Risk Assessment**: Visual indicators for developmental success probability
- **Interactive Tooltips**: Hover for instant molecular profile previews

### Perturbation Laboratory (Modal Concept)
- **In‑silico Simulation**: Toggle perturbations (AURKA inhibition, glycolysis impairment)
- **Before/After Visualization**: See predicted outcomes with confidence indicators
- **Molecular Signatures**: Expression changes from perturbations

## Current State (MVP visuals)

- Zona pellucida: thin, translucent shell enclosing the embryo.
- Cells: semi‑translucent with soft specular highlights and lineage colors
  - Undetermined: light blue, TE: light teal, ICM: amber
- Cleavage realism: zygote fills zona; 2–4 cells are slightly ovoid and packed; 5–8 cells fill the zona surface with inward jitter; morula densifies toward center.
- Blastocyst morphology: TE forms a shell; ICM clusters to one pole; an internal cavity (blastocoel) is kept clear via constraints.
- Short relaxation step maintains cell–cell contact and respects the zona/cavity.
- Expression coverage: zygote, 2‑cell, 4‑cell, 8‑cell, morula, blastocyst (TE/ICM).

## Data & Content

All content is static and bundled with the app as JSON.

- Primary reference: Petropoulos et al., 2016 (Cell)
- Perturbation example: Wang et al., 2024 (Nature Cell Biology)
- Example files: `app/public/data/stages.json`, `app/public/data/expression.json`, `app/public/data/perturbations.json`

Example schemas (illustrative):

```json
// stages.json
[
  { "id": "zygote", "day": 0, "cellCount": 1, "lineages": { "undetermined": 1.0 } },
  { "id": "blastocyst", "day": 5, "cellCount": 120, "lineages": { "TE": 0.75, "ICM": 0.25 } }
]

// expression.json
{
  "stage": "blastocyst",
  "lineage": "TE",
  "genes": { "GATA3": 0.9, "CDX2": 0.8, "OCT4": 0.1 }
}

// perturbations.json
{
  "AURKA_inhibit": {
    "description": "Models spindle and microtubule defects",
    "effects": { "cleavageArrestProb": 0.4, "compactionDelayFactor": 1.5 }
  }
}
```

## Technical Stack

- Frontend: React + TypeScript (Vite)
- 3D: Three.js via `@react-three/fiber` + `@react-three/drei`
- State: Zustand
- Styles: Tailwind CSS

## Performance Targets

- Initial load < 2 MB gzipped
- Smooth 60 FPS on mid‑range laptops

## UI Architecture

### Layout Philosophy
Simplified single-panel layout demonstrating core concepts from the full three-panel research interface:

- **Primary Viewport**: 3D canvas as the central focus (concept: Center Panel "Embryo Observatory")
- **Temporal Control**: Timeline slider with labeled stages and playback controls (concept: Bottom Panel timeline)
- **Analysis Display**: Information panel with molecular profiles and perturbation controls (concept: Right Panel analysis suite)
- **Interactive Elements**: Hover tooltips (<60 ms), click selection, smooth camera controls
- **Modal Interfaces**: About dialog and perturbation settings (concept: floating modal laboratory)
- **Status Indicators**: Notification banner for active perturbations ("Simulation Mode…")

### Design Language
- **Color System**:
  - Background: Deep space (`#0a0e27`) reflecting the full platform aesthetic
  - Success indicators: Bright green for healthy development
  - Risk indicators: Amber/red for perturbations and developmental concerns
  - Data overlays: Scientific palette for expression visualization
- **Progressive Disclosure**: Essential information visible, detailed data on demand 

## Development Roadmap

See `docs/DEVELOPMENT.md` for detailed progress across v0.1–v0.4.

- v0.1 Core Viewer (mostly complete): base 3D viewer, timeline, selection, dark theme, smooth interpolation
- v0.2 Data & Perturbations (in progress): gene panel JSON, toggles; expand stage coverage and perturbation effects
- v0.3 Polish: refined animations, compaction curve, camera presets, mini‑charts in gene panel
- v0.4 Final: performance + accessibility pass, URL share state, copy polish

## Planned Improvements

### Platform Alignment Features
Features that align with the full Digital Embryo Platform vision:

- **Enhanced Risk Assessment**: Visual indicators for developmental success probability (concept: Risk Assessment Dashboard)
- **Predictive Visualization**: Semi-transparent overlays showing probable future states (concept: Predictive Ghosting)
- **Temporal Annotations**: More detailed developmental milestones and molecular events on timeline
- **Expression Dynamics**: Trend sparklines showing gene expression changes over time
- **Perturbation Confidence**: Statistical reliability indicators for simulation outcomes

### Current Technical Improvements
- Camera presets and easing per stage (closer in cleavage, wider at blastocyst) — Implemented
- More realistic compaction curve and packing (tunable relaxation)
- Blastocoel visual surface (thin inner fluid sheet) and adjustable cavity size — Implemented
- Stronger perturbation visuals (AURKA: fragmentation/irregular packing; glycolysis: slower growth, smaller cavity) — Partially implemented
- Broader expression data and optional trend sparkline in the gene panel
- Error boundary + keyboard controls and ARIA labels — Implemented (keyboard: Space/←/→/R)

## New in this iteration

- Stage-based camera presets with smooth easing.
- Blastocoel inner surface rendered as a thin fluid sheet.
- Perturbation visuals: AURKA introduces mild size variability and irregular packing; Glycolysis impairment slows growth and reduces cavity size.
- Keyboard shortcuts: Space to play/pause, ←/→ to scrub, R to reset. Buttons and slider include ARIA labels.
