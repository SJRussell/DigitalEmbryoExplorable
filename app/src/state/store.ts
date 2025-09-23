import { create } from 'zustand'

export type Stage = {
  id: string
  day: number
  cellCount: number
  lineages?: Record<string, number>
}

export type Expression = {
  stage: string
  lineage: string
  genes: Record<string, number>
}

export type Perturbation = {
  label: string
  description: string
  effects: Record<string, number>
}

type StoreState = {
  stages: Stage[]
  expressions: Expression[]
  perturbations: Record<string, Perturbation>
  currentStageIndex: number
  stageT: number
  activePerturbations: string[]
  selectedLineage: string | null
  visibility: { TE: boolean; ICM: boolean; undetermined: boolean; zona: boolean }
  playing: boolean
  playSpeedMs: number
  loading: boolean
  error: string | null
  // actions
  loadData: () => Promise<void>
  setStageIndex: (i: number) => void
  setStageT: (t: number) => void
  togglePerturbation: (key: string) => void
  setSelectedLineage: (l: string | null) => void
  toggleVisibility: (k: keyof StoreState['visibility']) => void
  play: () => void
  pause: () => void
  reset: () => void
}

export const useStore = create<StoreState>((set, get) => ({
  stages: [],
  expressions: [],
  perturbations: {},
  currentStageIndex: 0,
  stageT: 0,
  activePerturbations: [],
  selectedLineage: null,
  visibility: { TE: true, ICM: true, undetermined: true, zona: true },
  playing: false,
  playSpeedMs: 1200,
  loading: false,
  error: null,
  loadData: async () => {
    try {
      set({ loading: true, error: null })
      const [stagesRes, exprRes, pertRes] = await Promise.all([
        fetch('/data/stages.json'),
        fetch('/data/expression.json'),
        fetch('/data/perturbations.json'),
      ])
      if (!stagesRes.ok || !exprRes.ok || !pertRes.ok) throw new Error('Failed to load data')
      const [stages, expressions, perturbations] = await Promise.all([
        stagesRes.json(),
        exprRes.json(),
        pertRes.json(),
      ])
      set({ stages, expressions, perturbations, loading: false, error: null })
      // default lineage
      const firstStage = (stages as Stage[])[0]
      const firstLineage = firstStage?.lineages ? Object.keys(firstStage.lineages)[0] : null
      set({ selectedLineage: firstLineage })
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'Unknown error' })
    }
  },
  setStageIndex: (i: number) => {
    const stages = get().stages
    const stage = stages[i]
    const lineage = stage?.lineages ? Object.keys(stage.lineages)[0] : 'undetermined'
    set({ currentStageIndex: i, stageT: i, selectedLineage: lineage })
  },
  setStageT: (t: number) => {
    const { stages, currentStageIndex } = get()
    const max = Math.max(0, stages.length - 1)
    const clamped = Math.min(max, Math.max(0, t))
    const nextIdx = Math.round(clamped)
    if (nextIdx !== currentStageIndex) {
      const stage = stages[nextIdx]
      const lineage = stage?.lineages ? Object.keys(stage.lineages)[0] : 'undetermined'
      set({ currentStageIndex: nextIdx, selectedLineage: lineage, stageT: clamped })
    } else {
      set({ stageT: clamped })
    }
  },
  togglePerturbation: (key: string) => {
    const active = new Set(get().activePerturbations)
    if (active.has(key)) active.delete(key)
    else active.add(key)
    set({ activePerturbations: Array.from(active) })
  },
  setSelectedLineage: (l: string | null) => set({ selectedLineage: l }),
  toggleVisibility: (k) => {
    const v = { ...get().visibility }
    v[k] = !v[k]
    set({ visibility: v })
  },
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  reset: () => {
    const stages = get().stages
    const firstStage = stages[0]
    const firstLineage = firstStage?.lineages ? Object.keys(firstStage.lineages)[0] : null
    set({
      currentStageIndex: 0,
      stageT: 0,
      activePerturbations: [],
      selectedLineage: firstLineage,
      visibility: { TE: true, ICM: true, undetermined: true, zona: true },
    })
  },
}))
