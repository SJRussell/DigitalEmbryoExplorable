import './App.css'
import { useEffect, useState } from 'react'
import { useStore } from './state/store'
import { Suspense, lazy } from 'react'

// Lazy load components for code splitting
const Timeline = lazy(() => import('./components/Timeline'))
const EmbryoCanvas = lazy(() => import('./components/EmbryoCanvas'))
const GenePanel = lazy(() => import('./components/GenePanel'))
const PerturbationPanel = lazy(() => import('./components/PerturbationPanel'))
const AboutModal = lazy(() => import('./components/AboutModal'))
const LayerControlsOverlay = lazy(() => import('./components/LayerControlsOverlay'))
const RiskAssessment = lazy(() => import('./components/RiskAssessment'))

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
    <div style={{ minHeight: '100vh', background: '#0a0e27', color: '#e5e7eb' }}>
      <header style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
        background: 'rgba(10, 14, 39, 0.8)',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{
              fontWeight: 600,
              fontSize: '18px',
              color: '#f8fafc',
              marginBottom: '2px'
            }}>
              Digital Embryo Platform
            </div>
            <div style={{
              fontSize: 12,
              color: 'rgba(0, 212, 255, 0.7)',
              fontFamily: 'ui-monospace, Monaco, "Cascadia Code", "Segoe UI Mono", Consolas, monospace'
            }}>
              Interactive Development Observatory • MVP v1.0
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              aria-label="Reset timeline and view"
              title="Reset (R)"
              onClick={() => reset()}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'rgba(0, 212, 255, 0.1)',
                color: '#00d4ff',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)'
              }}
            >
              Reset
            </button>
            <button
              aria-label="About this demo"
              title="About"
              onClick={() => setAboutOpen(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'rgba(55, 65, 81, 0.4)',
                color: '#e5e7eb',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(75, 85, 99, 0.4)'
                e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.7)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(55, 65, 81, 0.4)'
                e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)'
              }}
            >
              About
            </button>
          </div>
        </div>
      </header>
      {active.length > 0 && (
        <div aria-live="polite" style={{
          background: 'linear-gradient(90deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 149, 0, 0.1) 100%)',
          color: '#ff9500',
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: '500',
          borderBottom: '1px solid rgba(255, 149, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Perturbation Laboratory Active • In-silico simulation for research demonstration only
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: 'calc(100vh - 70px)' }}>
        <div style={{ borderBottom: '1px solid rgba(0, 212, 255, 0.1)' }}>
          <Suspense fallback={
            <div style={{ padding: 16, color: 'rgba(0, 212, 255, 0.6)', fontSize: 13 }}>
              Loading temporal control system…
            </div>
          }>
            <Timeline />
          </Suspense>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: 0 }}>
          <div style={{
            padding: '20px',
            background: 'rgba(10, 14, 39, 0.3)',
            position: 'relative'
          }}>
            <div style={{
              marginBottom: 12,
              color: 'rgba(0, 212, 255, 0.8)',
              fontSize: 13,
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Embryo Observatory • {stage?.id || 'Loading...'}
            </div>
            <div style={{
              height: 'calc(100vh - 190px)',
              border: '1px solid rgba(0, 212, 255, 0.15)',
              borderRadius: '8px',
              overflow: 'hidden',
              background: 'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.03) 0%, rgba(10, 14, 39, 0.8) 70%)',
              position: 'relative'
            }}>
              <Suspense fallback={
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'rgba(0, 212, 255, 0.6)',
                  fontSize: 14
                }}>
                  Loading 3D embryo visualization…
                </div>
              }>
                <EmbryoCanvas />
                <LayerControlsOverlay />
              </Suspense>
            </div>
            <div style={{
              marginTop: 10,
              fontSize: 11,
              color: 'rgba(148, 163, 184, 0.75)',
              letterSpacing: '0.02em'
            }}>
              Embryo images for demonstration only - v2.0 to include true embryo image model.
            </div>
          </div>
          <aside style={{
            borderLeft: '1px solid rgba(0, 212, 255, 0.1)',
            background: 'rgba(10, 14, 39, 0.6)',
            backdropFilter: 'blur(4px)',
            overflowY: 'auto',
            maxHeight: '100vh'
          }}>
            <Suspense fallback={
              <div style={{ padding: 16, color: 'rgba(0, 212, 255, 0.6)', fontSize: 13 }}>
                Loading analysis panels…
              </div>
            }>
              <RiskAssessment />
              <GenePanel />
              <PerturbationPanel />
            </Suspense>
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
