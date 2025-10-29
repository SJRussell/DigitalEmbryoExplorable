import { useEffect, useState } from 'react'
import { useStore } from '../state/store'

type DevelopmentalEvent = {
  name: string
  description: string
  time: number
  category: 'cell_cycle' | 'molecular' | 'morphology' | 'lineage' | 'developmental'
  significance: 'high' | 'medium' | 'low'
}

type StageEvents = {
  stage: string
  day: number
  events: DevelopmentalEvent[]
}

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

  const [developmentalEvents, setDevelopmentalEvents] = useState<StageEvents[]>([])
  const [hoveredEvent, setHoveredEvent] = useState<{event: DevelopmentalEvent, position: {x: number, y: number}} | null>(null)

  useEffect(() => {
    if (stages.length || loading) return
    void loadData()
  }, [stages.length, loading, loadData])

  // Load developmental events data
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/data/developmental_events.json')
        const events = await response.json() as StageEvents[]
        setDevelopmentalEvents(events)
      } catch (error) {
        console.warn('Could not load developmental events:', error)
      }
    }
    loadEvents()
  }, [])

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

  if (!stages.length) return (
    <div style={{ padding: 16, color: 'rgba(0, 212, 255, 0.6)', fontSize: 13 }}>
      Loading temporal control system…
    </div>
  )

  return (
    <div style={{ padding: '16px 20px', background: 'rgba(10, 14, 39, 0.4)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            color: '#f8fafc',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15V7l6 5-6 5z"/>
            </svg>
            Temporal Control
          </div>
          <div style={{
            background: 'rgba(0, 212, 255, 0.1)',
            color: '#00d4ff',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            border: '1px solid rgba(0, 212, 255, 0.2)'
          }}>
            {stage?.id.toUpperCase()}
          </div>
        </div>
        <div style={{
          color: 'rgba(0, 212, 255, 0.7)',
          fontSize: '12px',
          fontFamily: 'ui-monospace, Monaco, "Cascadia Code", "Segoe UI Mono", Consolas, monospace'
        }}>
          E{stage?.day} • Development Day {stage?.day}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: '14px' }}>
        <button
          onClick={() => (playing ? pause() : play())}
          aria-pressed={playing}
          aria-label={playing ? 'Pause timeline (Space)' : 'Play timeline (Space)'}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '6px',
            background: playing ? 'rgba(255, 149, 0, 0.15)' : 'rgba(0, 212, 255, 0.1)',
            color: playing ? '#ff9500' : '#00d4ff',
            border: `1px solid ${playing ? 'rgba(255, 149, 0, 0.3)' : 'rgba(0, 212, 255, 0.3)'}`,
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (playing) {
              e.currentTarget.style.background = 'rgba(255, 149, 0, 0.25)'
              e.currentTarget.style.borderColor = 'rgba(255, 149, 0, 0.4)'
            } else {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (playing) {
              e.currentTarget.style.background = 'rgba(255, 149, 0, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(255, 149, 0, 0.3)'
            } else {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)'
            }
          }}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
          {playing ? 'Pause' : 'Play'}
        </button>
        <div style={{
          color: 'rgba(156, 163, 175, 0.8)',
          fontSize: '11px',
          fontFamily: 'ui-monospace, Monaco, "Cascadia Code", "Segoe UI Mono", Consolas, monospace'
        }}>
          Progress: {Math.round((t / (stages.length - 1)) * 100)}%
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <input
          type="range"
          min={0}
          max={Math.max(0, stages.length - 1)}
          step={0.01}
          value={t}
          onChange={(e) => setT(Number(e.target.value))}
          aria-label="Development timeline"
          style={{
            width: '100%',
            height: '6px',
            background: 'rgba(55, 65, 81, 0.4)',
            borderRadius: '3px',
            appearance: 'none',
            cursor: 'pointer'
          }}
        />

        {/* Stage markers */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none'
        }}>
          {stages.map((s, i) => (
            <div
              key={s.id}
              style={{
                width: '2px',
                height: '8px',
                background: i <= Math.floor(t) ? 'rgba(0, 212, 255, 0.6)' : 'rgba(75, 85, 99, 0.4)',
                borderRadius: '1px'
              }}
            />
          ))}
        </div>

        {/* Enhanced event markers */}
        {developmentalEvents.map((stageEvents, stageIndex) => {
          const stagePosition = (stageIndex / (stages.length - 1)) * 100;
          return stageEvents.events.map((event, eventIndex) => {
            const eventPosition = stagePosition + (event.time * (100 / (stages.length - 1)));
            const isActive = (stageIndex + event.time) <= t;
            const categoryColors = {
              cell_cycle: '#00ff88',
              molecular: '#ff9500',
              morphology: '#00d4ff',
              lineage: '#a78bfa',
              developmental: '#f59e0b'
            };

            return (
              <div
                key={`${stageIndex}-${eventIndex}`}
                style={{
                  position: 'absolute',
                  left: `${eventPosition}%`,
                  top: '20px',
                  transform: 'translateX(-50%)',
                  pointerEvents: 'auto',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredEvent({
                    event,
                    position: { x: rect.left + rect.width / 2, y: rect.top }
                  });
                }}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isActive ? categoryColors[event.category] : 'rgba(75, 85, 99, 0.4)',
                  border: `2px solid ${isActive ? categoryColors[event.category] : 'rgba(75, 85, 99, 0.6)'}`,
                  transition: 'all 0.2s ease',
                  opacity: event.significance === 'high' ? 1 : 0.7
                }} />
              </div>
            );
          });
        })}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
        color: 'rgba(156, 163, 175, 0.7)',
        fontFamily: 'ui-monospace, Monaco, "Cascadia Code", "Segoe UI Mono", Consolas, monospace'
      }}>
        {stages.map((s, i) => {
          const milestones = {
            'zygote': 'Fertilization',
            '2-cell': 'First Division',
            '4-cell': 'EGA Initiation',
            '8-cell': 'Compaction Begin',
            'morula': 'Compaction Complete',
            'blastocyst': 'Blastulation'
          }
          const milestone = milestones[s.id as keyof typeof milestones]

          return (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span>E{s.day}</span>
              {milestone && (
                <span style={{
                  fontSize: '8px',
                  color: i <= Math.floor(t) ? 'rgba(0, 212, 255, 0.6)' : 'rgba(156, 163, 175, 0.4)',
                  textAlign: 'center',
                  maxWidth: '40px',
                  lineHeight: 1.2
                }}>
                  {milestone}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Event categories legend */}
      {developmentalEvents.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: 'rgba(10, 14, 39, 0.3)',
          borderRadius: '4px',
          border: '1px solid rgba(0, 212, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '10px',
            color: 'rgba(0, 212, 255, 0.8)',
            fontWeight: '600',
            marginBottom: '6px'
          }}>
            Developmental Events
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            fontSize: '9px'
          }}>
            {[
              { category: 'cell_cycle', label: 'Cell Division', color: '#00ff88' },
              { category: 'molecular', label: 'Gene Expression', color: '#ff9500' },
              { category: 'morphology', label: 'Morphological', color: '#00d4ff' },
              { category: 'lineage', label: 'Lineage Specification', color: '#a78bfa' },
              { category: 'developmental', label: 'Developmental', color: '#f59e0b' }
            ].map(({ category, label, color }) => (
              <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: color
                }} />
                <span style={{ color: 'rgba(156, 163, 175, 0.8)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event tooltip */}
      {hoveredEvent && (
        <div style={{
          position: 'fixed',
          left: hoveredEvent.position.x,
          top: hoveredEvent.position.y - 60,
          transform: 'translateX(-50%)',
          background: 'rgba(10, 14, 39, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '11px',
          color: '#e5e7eb',
          zIndex: 1000,
          maxWidth: '200px',
          pointerEvents: 'none'
        }}>
          <div style={{
            fontWeight: '600',
            color: '#00d4ff',
            marginBottom: '4px'
          }}>
            {hoveredEvent.event.name}
          </div>
          <div style={{
            color: 'rgba(156, 163, 175, 0.9)',
            lineHeight: 1.3
          }}>
            {hoveredEvent.event.description}
          </div>
        </div>
      )}
    </div>
  )
}

export default Timeline
