import { useStore } from '../state/store'

export function PerturbationPanel() {
  const perts = useStore((s) => s.perturbations)
  const active = useStore((s) => s.activePerturbations)
  const toggle = useStore((s) => s.togglePerturbation)

  const entries = Object.entries(perts)

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 8, color: '#e5e5e5', fontWeight: 600 }}>Perturbation Sandbox</div>
      {entries.length === 0 && <div style={{ color: '#9ca3af' }}>Loading…</div>}
      {entries.map(([key, p]) => (
        <div key={key} style={{ marginBottom: 12, padding: 10, border: '1px solid #374151', borderRadius: 8, background: '#0b0b0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: '#e5e5e5', fontWeight: 500 }}>{p.label}</div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#e5e5e5' }}>
              <input type="checkbox" checked={active.includes(key)} onChange={() => toggle(key)} />
              <span style={{ fontSize: 12, color: '#a3a3a3' }}>{active.includes(key) ? 'On' : 'Off'}</span>
            </label>
          </div>
          <div style={{ marginTop: 6, color: '#a3a3a3', fontSize: 13 }}>{p.description}</div>
        </div>
      ))}
    </div>
  )
}

export default PerturbationPanel

