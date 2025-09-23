import { useMemo } from 'react'
import { useStore } from '../state/store'

function Sparkline({ series, color = '#00d4ff' }: { series: number[]; color?: string }) {
  const w = 80
  const h = 16
  if (!series.length) return null
  const xs = series.map((_, i) => (i / Math.max(1, series.length - 1)) * (w - 4) + 2)
  const ys = series.map((v) => (1 - v) * (h - 6) + 3)
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')

  // Create gradient for sparkline
  const gradient = `url(#grad-${color.replace('#', '')})`

  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.2 }} />
        </linearGradient>
      </defs>
      <path
        d={`${d} L${xs[xs.length - 1]},${h - 2} L${xs[0]},${h - 2} Z`}
        fill={gradient}
        opacity={0.3}
      />
      <path d={d} stroke={color} strokeWidth={1.5} fill="none" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="1.5" fill={color} opacity={0.8} />
      ))}
    </svg>
  )
}

function Bar({ label, value, series, color = '#00d4ff' }: {
  label: string
  value: number
  series: number[]
  color?: string
}) {
  const pct = Math.round(value * 100)
  const intensity = value > 0.7 ? 'high' : value > 0.4 ? 'medium' : 'low'

  return (
    <div style={{
      marginBottom: 10,
      padding: '8px 10px',
      background: 'rgba(55, 65, 81, 0.15)',
      borderRadius: '6px',
      border: '1px solid rgba(75, 85, 99, 0.2)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{
            color: '#e5e7eb',
            fontSize: '13px',
            fontWeight: '500'
          }}>
            {label}
          </span>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '3px',
            background: color,
            opacity: intensity === 'high' ? 1 : intensity === 'medium' ? 0.6 : 0.3
          }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkline series={series} color={color} />
          <span style={{
            color: color,
            fontSize: '12px',
            fontWeight: '600',
            minWidth: '32px',
            textAlign: 'right',
            fontFamily: 'ui-monospace, Monaco, "Cascadia Code", "Segoe UI Mono", Consolas, monospace'
          }}>
            {pct}%
          </span>
        </div>
      </div>
      <div style={{
        background: 'rgba(31, 41, 55, 0.6)',
        borderRadius: '4px',
        overflow: 'hidden',
        height: '6px'
      }}>
        <div style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}dd 0%, ${color} 100%)`,
          height: '100%',
          transition: 'width 0.3s ease'
        }} />
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

  // Gene-specific colors for better visualization
  const geneColors: Record<string, string> = {
    'GATA3': '#00ff88', // Success green for TE marker
    'CDX2': '#00ff88',  // Success green for TE marker
    'KRT18': '#00ff88', // Success green for TE marker
    'EPCAM': '#00ff88', // Success green for TE marker
    'OCT4': '#ff9500',  // Amber for ICM marker
    'NANOG': '#ff9500', // Amber for ICM marker
    'SOX2': '#ff9500',  // Amber for ICM marker
    'POU5F1': '#ff9500' // Amber for ICM marker
  }

  return (
    <div style={{
      padding: '16px',
      borderBottom: '1px solid rgba(0, 212, 255, 0.1)'
    }}>
      <div style={{
        marginBottom: 12,
        color: 'rgba(0, 212, 255, 0.8)',
        fontWeight: 600,
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
          <path d="M12 2l1 2h8l-2 2v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V6l-2-2h8l1-2z"/>
        </svg>
        Molecular Profile
      </div>

      <div style={{
        marginBottom: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <label style={{
          color: 'rgba(156, 163, 175, 0.8)',
          fontSize: '11px',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Selected Lineage
        </label>
        <select
          value={selected ?? lineageOptions[0]}
          onChange={(e) => setLineage(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'rgba(31, 41, 55, 0.6)',
            color: '#e5e7eb',
            borderRadius: '6px',
            border: '1px solid rgba(75, 85, 99, 0.4)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {lineageOptions.map((l) => (
            <option key={l} value={l} style={{ background: '#1f2937' }}>
              {l.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div style={{
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{
          color: 'rgba(156, 163, 175, 0.8)',
          fontSize: '11px',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Expression Dynamics
        </div>
        {selected && (
          <div style={{
            background: `${geneColors[Object.keys(expr[0]?.genes || {})[0]] || '#00d4ff'}33`,
            color: geneColors[Object.keys(expr[0]?.genes || {})[0]] || '#00d4ff',
            padding: '1px 6px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: '600',
            border: `1px solid ${geneColors[Object.keys(expr[0]?.genes || {})[0]] || '#00d4ff'}66`
          }}>
            {selected.toUpperCase()}
          </div>
        )}
      </div>

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {expr.length ? (
          Object.entries(expr[0].genes).map(([g, v]) => (
            <Bar
              key={g}
              label={g}
              value={v}
              series={seriesByGene[g] ?? []}
              color={geneColors[g] || '#00d4ff'}
            />
          ))
        ) : (
          <div style={{
            color: 'rgba(156, 163, 175, 0.6)',
            fontSize: '13px',
            textAlign: 'center',
            padding: '20px 10px',
            background: 'rgba(55, 65, 81, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(75, 85, 99, 0.2)'
          }}>
            No molecular data available for this selection
          </div>
        )}
      </div>
    </div>
  )
}

export default GenePanel
