import { useEffect } from 'react'
import { useStore } from '../state/store'

export function Timeline() {
  const stages = useStore((s) => s.stages)
  const t = useStore((s) => s.stageT)
  const setT = useStore((s) => s.setStageT)
  const loadData = useStore((s) => s.loadData)
  const stage = useStore((s) => s.stages[s.currentStageIndex] ?? null)
  const loading = useStore((s) => s.loading)
  const playing = useStore((s) => s.playing)
  const play = useStore((s) => s.play)
  const pause = useStore((s) => s.pause)
  const speed = useStore((s) => s.playSpeedMs)

  useEffect(() => {
    if (stages.length || loading) return
    void loadData()
  }, [stages.length, loading, loadData])

  useEffect(() => {
    if (!playing) return
    // Advance in 10 sub-steps per stage for smooth interpolation
    const step = 0.1
    const id = setInterval(() => {
      const max = Math.max(0, stages.length - 1)
      const next = Math.min(t + step, max)
      setT(next)
      if (next >= max) pause()
    }, speed / 10)
    return () => clearInterval(id)
  }, [playing, t, stages.length, speed, setT, pause])

  if (!stages.length) return <div style={{ padding: 8, color: '#e5e5e5' }}>Loading stages…</div>

  return (
    <div style={{ padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e5e5e5' }}>
        <span style={{ fontWeight: 600 }}>Stage: {stage?.id}</span>
        <span>Day {stage?.day}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '6px 0' }}>
        <button
          onClick={() => (playing ? pause() : play())}
          aria-pressed={playing}
          aria-label={playing ? 'Pause timeline (Space)' : 'Play timeline (Space)'}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
          style={{ padding: '6px 10px', borderRadius: 8, background: '#111827', color: '#e5e5e5', border: '1px solid #374151' }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, stages.length - 1)}
        step={0.01}
        value={t}
        onChange={(e) => setT(Number(e.target.value))}
        aria-label="Development timeline"
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a3a3a3' }}>
        {stages.map((s) => (
          <span key={s.id}>{s.day}</span>
        ))}
      </div>
    </div>
  )
}

export default Timeline
