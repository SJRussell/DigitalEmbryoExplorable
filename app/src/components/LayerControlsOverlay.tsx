import { useState } from 'react'
import { useStore } from '../state/store'

export default function LayerControlsOverlay() {
  const [isExpanded, setIsExpanded] = useState(false)
  const vis = useStore((s) => s.visibility)
  const toggle = useStore((s) => s.toggleVisibility)

  const ToggleSwitch = ({ checked, onChange, label, color = '#00d4ff' }: {
    checked: boolean
    onChange: () => void
    label: string
    color?: string
  }) => (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 0',
      cursor: 'pointer'
    }}>
      <span style={{
        color: '#e5e7eb',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {label}
      </span>
      <div
        onClick={onChange}
        style={{
          width: '32px',
          height: '16px',
          borderRadius: '8px',
          background: checked ? `${color}33` : 'rgba(75, 85, 99, 0.3)',
          border: `1px solid ${checked ? `${color}66` : 'rgba(75, 85, 99, 0.5)'}`,
          position: 'relative',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
      >
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '6px',
          background: checked ? color : 'rgba(156, 163, 175, 0.8)',
          position: 'absolute',
          top: '1px',
          left: checked ? '17px' : '1px',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
        }} />
      </div>
    </label>
  )

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      zIndex: 10,
      background: 'rgba(10, 14, 39, 0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0, 212, 255, 0.2)',
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      width: isExpanded ? '220px' : '44px',
      height: isExpanded ? 'auto' : '44px'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          height: '44px',
          background: 'transparent',
          border: 'none',
          color: 'rgba(0, 212, 255, 0.8)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          padding: isExpanded ? '0 12px' : '0',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: isExpanded ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>Layers</span>
        </div>
{isExpanded ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{
              transition: 'transform 0.3s ease'
            }}
          >
            <path d="M7 14l5-5 5 5z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          padding: '12px',
          borderTop: '1px solid rgba(0, 212, 255, 0.1)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <ToggleSwitch
              checked={vis.TE}
              onChange={() => toggle('TE')}
              label="Trophectoderm"
              color="#00ff88"
            />
            <ToggleSwitch
              checked={vis.ICM}
              onChange={() => toggle('ICM')}
              label="Inner Cell Mass"
              color="#ff9500"
            />
            <ToggleSwitch
              checked={vis.undetermined}
              onChange={() => toggle('undetermined')}
              label="Undetermined"
              color="#00d4ff"
            />
            <ToggleSwitch
              checked={vis.zona}
              onChange={() => toggle('zona')}
              label="Zona Pellucida"
              color="#a78bfa"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}