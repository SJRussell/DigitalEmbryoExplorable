# Digital Embryo Explorable — Development Stages

This document tracks the planned stages (v0.1–v0.4), current progress, and next tasks. Development is guided by concepts from the full Digital Embryo Platform design specification while maintaining focus on POC deliverables. It complements the high-level spec in `README.md`.

## Status Overview

- v0.1 Core Viewer — Mostly complete
- v0.2 Data & Perturbations — In progress
- v0.3 Polish & Refinement — Planned
- v0.4 Final Pass — Planned

## v0.1 Core Viewer (Embryo Observatory Foundation)

**Platform Concept**: Center Panel "Embryo Observatory" - Primary viewport with 3D morphological view

- [x] **3D Morphological View**: Instanced spheres with WebGL rendering
- [x] **Interactive Controls**: Timeline slider, play/pause, drag to rotate, scroll to zoom
- [x] **Smart Coloring**: Lineage-based coloring (TE/ICM/undetermined)
- [x] **Cell Selection**: Hover/select lineage via click with visual feedback
- [x] **Design Language**: Dark theme (`#0a0e27` background) + modern scientific aesthetic
- [x] **Developmental Stages**: Smooth interpolation between zygote→cleavage→morula→blastocyst
- [x] **Zona Pellucida**: Translucent shell constraint system
- [x] **Physics Simulation**: Contact constraints and cavity maintenance
- [x] **Camera Presets**: Stage-appropriate viewpoints with smooth easing

**Implementation Notes**:
- Blastocyst morphology: TE shell formation, ICM polar clustering, interior cavity maintenance
- Expression coverage: All major stages with lineage-specific markers
- Performance: 60fps target achieved on mid-range hardware

## v0.2 Data & Perturbation Logic (Analysis Suite + Perturbation Laboratory)

**Platform Concepts**:
- Right Panel "Analysis Suite" - Molecular profiles and risk assessment
- Modal "Perturbation Laboratory" - In-silico simulation interface

### Analysis Suite Implementation
- [x] **Molecular Profile Display**: Gene expression panel with JSON data integration
- [x] **Expression Coverage**: Key markers (OCT4, CDX2, GATA3, etc.) across all stages
- [x] **Interactive Tooltips**: Cell hover for instant molecular previews
- [x] **Status Indicators**: Visual feedback for selected lineages

### Perturbation Laboratory Implementation
- [x] **Simulation Controls**: Toggle switches for AURKA inhibition and glycolysis impairment
- [x] **Before/After Visualization**: Morphological changes from perturbations
- [x] **Molecular Signatures**: Expression changes reflected in gene panel
- [x] **System State**: Reset functionality and simulation mode indicators
- [x] **Visual Effects**: AURKA (size variability + irregular packing), Glycolysis (growth reduction + cavity size)

### Enhanced Features
- [x] Comprehensive expression data with stage-specific profiles
- [x] About modal with citations and scientific context
- [x] Notification system for active perturbations

## v0.3 Polish & Refinement (Platform Alignment Features)

**Platform Concepts**: Enhanced visualization features aligned with full research interface

### Temporal Control Enhancement (Bottom Panel Timeline Concept)
- [ ] **Event Annotations**: Detailed developmental milestones on timeline
- [ ] **Morphokinetic Integration**: Key transition markers with scientific context

### Analysis Suite Enhancements
- [x] **Expression Dynamics**: Mini-charts (sparklines) showing temporal trends
- [ ] **Risk Assessment Indicators**: Visual probability metrics for developmental success
- [ ] **Predictive Visualization**: Semi-transparent overlays for probable future states (concept: Predictive Ghosting)

### Technical Polish
- [ ] **Physics Refinement**: Compaction curve polishing and packing stability
- [ ] **Blastocoel Visualization**: Inner surface rendering (optional, cavity simulation primary)
- [ ] **Style System**: Replace inline styles with Tailwind CSS consistency
- [ ] **Performance Optimization**: Rendering efficiency improvements

## v0.4 Final Pass (Production Readiness)

**Platform Alignment**: Production-quality features for research deployment

### Performance & Scalability
- [ ] **Optimization Pass**: Lazy loading, code-splitting, instancing budgets for larger datasets
- [ ] **Memory Management**: Efficient handling of expression data and simulation states
- [ ] **Loading States**: Progressive data loading with user feedback

### User Experience & Accessibility
- [ ] **Accessibility Compliance**: ARIA labels, keyboard navigation, focus management
- [ ] **Responsive Design**: Cross-device compatibility for research environments
- [ ] **Error Handling**: Graceful degradation and user error feedback

### Research Integration Features
- [x] **Shareable State**: URL parameters for session persistence (timeline, lineage, perturbations)
- [ ] **Export Capabilities**: High-resolution image export for publications
- [ ] **Documentation**: Comprehensive tooltips and contextual help
- [ ] **Scientific Validation**: Citation integration and methodology transparency

### Platform Foundation
- [ ] **Code Architecture**: Modular structure ready for three-panel expansion
- [ ] **Data Schema**: Standardized format compatible with full platform vision
- [ ] **Extension Points**: Plugin architecture for additional perturbations and visualizations

## Developer Notes

### Technical Architecture
**Platform Foundation**: Modular design prepared for three-panel research interface expansion

- **Frontend Stack**: React + TypeScript + Vite (matches full platform specification)
- **3D Rendering**: Three.js via react-three-fiber + drei (WebGL optimization for large datasets)
- **State Management**: Zustand (lightweight, scalable for complex research workflows)
- **Styling**: Tailwind CSS + design system aligned with platform aesthetic
- **Data Layer**: Static JSON schema compatible with full platform data architecture

### Development Environment
- **Local Development**: `cd app && npm install && npm run dev`
- **Production Build**: `cd app && npm run build && npm run preview`
- **Network Access**: Append `-- --host 0.0.0.0` for LAN/WSL deployment
- **Data Management**: `app/public/data/*` JSON files (stages, expression, perturbations)

### User Interface Controls
**Aligned with full platform interaction paradigms**:

- **Space**: Play/Pause temporal progression
- **Left/Right Arrow**: Precise timeline scrubbing
- **R**: Reset to initial state
- **Mouse**: Orbit controls, cell selection, hover interactions

### Platform Integration Readiness
- **Component Architecture**: Modular design for panel system integration
- **Data Schema**: Compatible with multi-dataset research workflows
- **Performance Targets**: 60fps rendering, <2s load times (matches platform requirements)
- **Export Capabilities**: Publication-ready visualization output
