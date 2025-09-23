import { useStore } from '../state/store'

export default function ViewControls() {
  const vis = useStore((s) => s.visibility)
  const toggle = useStore((s) => s.toggleVisibility)

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 8, color: '#e5e5e5', fontWeight: 600 }}>View Controls</div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span id="vc-te">Show TE</span>
          <input aria-labelledby="vc-te" role="switch" aria-checked={vis.TE} type="checkbox" checked={vis.TE} onChange={() => toggle('TE')} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span id="vc-icm">Show ICM</span>
          <input aria-labelledby="vc-icm" role="switch" aria-checked={vis.ICM} type="checkbox" checked={vis.ICM} onChange={() => toggle('ICM')} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span id="vc-und">Show Undetermined</span>
          <input aria-labelledby="vc-und" role="switch" aria-checked={vis.undetermined} type="checkbox" checked={vis.undetermined} onChange={() => toggle('undetermined')} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span id="vc-zona">Show Zona</span>
          <input aria-labelledby="vc-zona" role="switch" aria-checked={vis.zona} type="checkbox" checked={vis.zona} onChange={() => toggle('zona')} />
        </label>
      </div>
    </div>
  )
}
