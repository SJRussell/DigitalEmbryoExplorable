import { useMemo } from 'react'
import { useStore } from '../state/store'

function Sparkline({ series }: { series: number[] }) {
  const w = 80
  const h = 14
  if (!series.length) return null
  const xs = series.map((_, i) => (i / Math.max(1, series.length - 1)) * (w - 2) + 1)
  const ys = series.map((v) => (1 - v) * (h - 4) + 2)
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <path d={d} stroke="#22d3ee" strokeWidth={1.5} fill="none" />
    </svg>
  )
}

function Bar({ label, value, series }: { label: string; value: number; series: number[] }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e5e5e5', alignItems: 'center' }}>
        <span>{label}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Sparkline series={series} />
          <span style={{ color: '#a3a3a3', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
        </span>
      </div>
      <div style={{ background: '#1f2937', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: '#22d3ee', height: 8 }} />
      </div>
    </div>
  )
}

export function GenePanel() {
  const stage = useStore((s) => s.stages[s.currentStageIndex] ?? null)
  const setLineage = useStore((s) => s.setSelectedLineage)
  const selected = useStore((s) => s.selectedLineage)
  const expressions = useStore((s) => s.expressions)
  const stages = useStore((s) => s.stages)

  const expr = useMemo(() => {
    if (!stage) return [] as typeof expressions
    return expressions.filter(
      (e) => e.stage === stage.id && (!selected || e.lineage === selected),
    )
  }, [expressions, stage, selected])

  const lineageOptions = useMemo(() => {
    return stage?.lineages ? Object.keys(stage.lineages) : ['undetermined']
  }, [stage?.lineages])

  // build timeseries per gene for current lineage across stages
  const seriesByGene = useMemo(() => {
    const order = stages.map((s) => s.id)
    const out: Record<string, number[]> = {}
    if (!selected) return out
    const filtered = expressions.filter((e) => e.lineage === selected)
    const byStage = new Map(filtered.map((e) => [e.stage, e.genes]))
    const genes = new Set<string>()
    filtered.forEach((e) => Object.keys(e.genes).forEach((g) => genes.add(g)))
    genes.forEach((g) => {
      const arr: number[] = []
      for (const sId of order) {
        const gmap = byStage.get(sId)
        arr.push(gmap && g in gmap ? gmap[g] : NaN)
      }
      // compress NaNs out for a compact sparkline while preserving order
      out[g] = arr.filter((v) => !Number.isNaN(v))
    })
    return out
  }, [expressions, selected, stages])

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 8, color: '#e5e5e5', fontWeight: 600 }}>Lineage Markers</div>
      <div style={{ marginBottom: 6, fontSize: 12, color: '#9ca3af' }}>
        Selected: {selected ?? '—'}
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ color: '#a3a3a3', fontSize: 12 }}>Lineage</label>
        <select
          value={selected ?? lineageOptions[0]}
          onChange={(e) => setLineage(e.target.value)}
          style={{ width: '100%', padding: 8, background: '#111827', color: '#e5e5e5', borderRadius: 8, border: '1px solid #374151' }}
        >
          {lineageOptions.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        {expr.length ? (
          Object.entries(expr[0].genes).map(([g, v]) => (
            <Bar key={g} label={g} value={v} series={seriesByGene[g] ?? []} />
          ))
        ) : (
          <div style={{ color: '#9ca3af' }}>No expression data for this selection.</div>
        )}
      </div>
    </div>
  )
}

export default GenePanel
