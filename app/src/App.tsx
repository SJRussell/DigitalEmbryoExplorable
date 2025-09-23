import './App.css'
import { useEffect, useState } from 'react'
import { useStore } from './state/store'
import Timeline from './components/Timeline'
import EmbryoCanvas from './components/EmbryoCanvas'
import GenePanel from './components/GenePanel'
import PerturbationPanel from './components/PerturbationPanel'
import { Suspense, lazy } from 'react'
const AboutModal = lazy(() => import('./components/AboutModal'))
import ViewControls from './components/ViewControls'

function App() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const active = useStore((s) => s.activePerturbations)
  const stage = useStore((s) => s.stages[s.currentStageIndex] ?? null)
  const reset = useStore((s) => s.reset)
  const playing = useStore((s) => s.playing)
  const play = useStore((s) => s.play)
  const pause = useStore((s) => s.pause)
  const t = useStore((s) => s.stageT)
  const setT = useStore((s) => s.setStageT)
  const vis = useStore((s) => s.visibility)
  const perts = useStore((s) => s.activePerturbations)

  // Keyboard controls for quick navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'select' || tag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) return
      if (e.code === 'Space') {
        e.preventDefault()
        playing ? pause() : play()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        setT(t + 0.1)
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        setT(t - 0.1)
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault()
        reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, pause, play, setT, t, reset])

  // Shareable URL state: read on load and update on change
  useEffect(() => {
    // read once after initial mount
    const params = new URLSearchParams(window.location.search)
    const tParam = parseFloat(params.get('t') || '')
    if (!Number.isNaN(tParam)) setT(tParam)
    const lin = params.get('lin')
    if (lin) useStore.setState({ selectedLineage: lin })
    const vp = params.get('vis')
    if (vp) {
      useStore.setState({
        visibility: {
          TE: vp.includes('T'),
          ICM: vp.includes('I'),
          undetermined: vp.includes('U'),
          zona: vp.includes('Z'),
        },
      })
    }
    const ap = params.get('perts')
    if (ap) useStore.setState({ activePerturbations: ap.split(',').filter(Boolean) })
  }, [setT])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('t', String(Math.round(t * 100) / 100))
    if (useStore.getState().selectedLineage) params.set('lin', useStore.getState().selectedLineage!)
    const vflags = `${vis.TE ? 'T' : ''}${vis.ICM ? 'I' : ''}${vis.undetermined ? 'U' : ''}${vis.zona ? 'Z' : ''}`
    params.set('vis', vflags)
    if (perts.length) params.set('perts', perts.join(','))
    const url = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', url)
  }, [t, vis.TE, vis.ICM, vis.undetermined, vis.zona, perts])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5' }}>
      <header style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700 }}>Digital Embryo Explorable (MVP)</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>React • TypeScript • three.js</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button aria-label="Reset timeline and view" title="Reset (R)" onClick={() => reset()} style={{ padding: '6px 10px', borderRadius: 8, background: '#111827', color: '#e5e5e5', border: '1px solid #374151' }}>Reset</button>
            <button aria-label="About this demo" title="About" onClick={() => setAboutOpen(true)} style={{ padding: '6px 10px', borderRadius: 8, background: '#111827', color: '#e5e5e5', border: '1px solid #374151' }}>About</button>
          </div>
        </div>
      </header>
      {active.length > 0 && (
        <div aria-live="polite" style={{ background: '#0f766e', color: 'white', padding: '6px 16px', fontSize: 14 }}>
          Simulation Mode: For research demonstration only. Not for clinical use.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: 'calc(100vh - 70px)' }}>
        <div style={{ borderBottom: '1px solid #1f2937' }}>
          <Timeline />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 0 }}>
          <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 8, color: '#a3a3a3', fontSize: 12 }}>3D Embryo Visualization — {stage?.id}</div>
            <div style={{ height: 'calc(100vh - 170px)' }}>
              <EmbryoCanvas />
            </div>
          </div>
          <aside style={{ borderLeft: '1px solid #1f2937' }}>
            <ViewControls />
            <GenePanel />
            <PerturbationPanel />
          </aside>
        </div>
      </div>
      <Suspense fallback={null}>
        <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      </Suspense>
    </div>
  )
}

export default App
