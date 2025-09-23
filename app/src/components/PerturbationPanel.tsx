import { useStore } from '../state/store'

export function PerturbationPanel() {
  const perts = useStore((s) => s.perturbations)
  const active = useStore((s) => s.activePerturbations)
  const toggle = useStore((s) => s.togglePerturbation)

  const entries = Object.entries(perts)

  const PerturbationToggle = ({ id, perturbation, isActive }: {
    id: string
    perturbation: any
    isActive: boolean
  }) => (
    <div style={{
      marginBottom: 12,
      padding: '12px',
      background: isActive ? 'rgba(255, 149, 0, 0.08)' : 'rgba(55, 65, 81, 0.15)',
      borderRadius: '8px',
      border: `1px solid ${isActive ? 'rgba(255, 149, 0, 0.25)' : 'rgba(75, 85, 99, 0.2)'}`,
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            color: isActive ? '#ff9500' : '#e5e7eb',
            fontWeight: 600,
            fontSize: '13px'
          }}>
            {perturbation.label}
          </div>
          {isActive && (
            <div style={{
              background: 'rgba(255, 149, 0, 0.2)',
              color: '#ff9500',
              padding: '1px 6px',
              borderRadius: '8px',
              fontSize: '10px',
              fontWeight: '600',
              border: '1px solid rgba(255, 149, 0, 0.3)',
              textTransform: 'uppercase'
            }}>
              Active
            </div>
          )}
        </div>
        <div
          onClick={() => toggle(id)}
          style={{
            width: '44px',
            height: '22px',
            borderRadius: '11px',
            background: isActive ? 'rgba(255, 149, 0, 0.3)' : 'rgba(75, 85, 99, 0.3)',
            border: `1px solid ${isActive ? 'rgba(255, 149, 0, 0.5)' : 'rgba(75, 85, 99, 0.5)'}`,
            position: 'relative',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '9px',
            background: isActive ? '#ff9500' : 'rgba(156, 163, 175, 0.8)',
            position: 'absolute',
            top: '1px',
            left: isActive ? '23px' : '1px',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)'
          }} />
        </div>
      </div>
      <div style={{
        color: isActive ? 'rgba(255, 149, 0, 0.8)' : 'rgba(156, 163, 175, 0.8)',
        fontSize: '12px',
        lineHeight: 1.4
      }}>
        {perturbation.description}
      </div>
      {isActive && (
        <div style={{
          marginTop: '8px',
          padding: '6px 8px',
          background: 'rgba(255, 149, 0, 0.1)',
          borderRadius: '4px',
          border: '1px solid rgba(255, 149, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff9500">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span style={{
            color: '#ff9500',
            fontSize: '11px',
            fontWeight: '500'
          }}>
            Simulation running
          </span>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ padding: '16px' }}>
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
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
        </svg>
        Perturbation Laboratory
      </div>

      {entries.length === 0 ? (
        <div style={{
          color: 'rgba(156, 163, 175, 0.6)',
          fontSize: '13px',
          textAlign: 'center',
          padding: '20px 10px',
          background: 'rgba(55, 65, 81, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(75, 85, 99, 0.2)'
        }}>
          Loading simulation protocols…
        </div>
      ) : (
        <div>
          {entries.map(([key, p]) => (
            <PerturbationToggle
              key={key}
              id={key}
              perturbation={p}
              isActive={active.includes(key)}
            />
          ))}
          {active.length > 0 && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: 'rgba(255, 149, 0, 0.05)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 149, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255, 149, 0, 0.7)">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <div style={{
                color: 'rgba(255, 149, 0, 0.8)',
                fontSize: '11px',
                lineHeight: 1.4
              }}>
                <div style={{ fontWeight: '600' }}>Simulation Active</div>
                <div>Predicted developmental outcomes shown in Observatory</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PerturbationPanel

