import { useMemo } from 'react'
import { useStore } from '../state/store'

export function RiskAssessment() {
  const stage = useStore((s) => s.stages[s.currentStageIndex] ?? null)
  const activePerturbations = useStore((s) => s.activePerturbations)
  const stageT = useStore((s) => s.stageT)

  // Calculate risk metrics based on stage and perturbations
  const riskMetrics = useMemo(() => {
    if (!stage) return null

    // Base developmental success probability by stage
    const baseSuccessRates = {
      'zygote': 0.95,
      '2-cell': 0.92,
      '4-cell': 0.88,
      '8-cell': 0.82,
      '16-cell': 0.78,
      'morula': 0.75,
      'blastocyst': 0.70
    }

    let successProb = baseSuccessRates[stage.id as keyof typeof baseSuccessRates] || 0.5
    let riskFactors = []

    // Apply perturbation effects
    if (activePerturbations.includes('AURKA_inhibit')) {
      successProb *= 0.4  // 60% reduction
      riskFactors.push({
        name: 'Spindle Disruption',
        impact: 35,
        color: '#ff3366'
      })
    }

    if (activePerturbations.includes('glycolysis_impair')) {
      successProb *= 0.6  // 40% reduction
      riskFactors.push({
        name: 'Metabolic Dysfunction',
        impact: 25,
        color: '#ff9500'
      })
    }

    // Late stage risks
    if (stage.day >= 4) {
      riskFactors.push({
        name: 'Implantation Competence',
        impact: 15,
        color: '#fbbf24'
      })
    }

    const arrestRisk = 1 - successProb
    const manifestDistance = Math.abs(stageT - Math.floor(stageT)) * 20 // Simplified metric

    return {
      successProb: Math.max(0.1, Math.min(0.98, successProb)),
      arrestRisk,
      manifestDistance,
      riskFactors
    }
  }, [stage, activePerturbations, stageT])

  if (!riskMetrics) return null

  const RiskGauge = ({ value, label, color, unit = '%' }: {
    value: number
    label: string
    color: string
    unit?: string
  }) => {
    const percentage = unit === '%' ? value * 100 : value
    const displayValue = unit === '%' ? Math.round(percentage) : Math.round(value * 10) / 10

    return (
      <div style={{
        background: 'rgba(55, 65, 81, 0.15)',
        borderRadius: '8px',
        padding: '10px',
        border: '1px solid rgba(75, 85, 99, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px'
        }}>
          <span style={{
            color: '#e5e7eb',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {label}
          </span>
          <span style={{
            color: color,
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'ui-monospace, Monaco, "Cascadia Code", "Segoe UI Mono", Consolas, monospace'
          }}>
            {displayValue}{unit}
          </span>
        </div>
        <div style={{
          background: 'rgba(31, 41, 55, 0.6)',
          borderRadius: '3px',
          overflow: 'hidden',
          height: '4px'
        }}>
          <div style={{
            width: `${Math.min(100, percentage)}%`,
            background: `linear-gradient(90deg, ${color}dd 0%, ${color} 100%)`,
            height: '100%',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>
    )
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
          <path d="M12 1L9 9l-8 3 8 3 3 8 3-8 8-3-8-3-3-8z"/>
        </svg>
        Risk Assessment
      </div>

      <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
        <RiskGauge
          value={riskMetrics.successProb}
          label="Development Success"
          color="#00ff88"
        />
        <RiskGauge
          value={riskMetrics.arrestRisk}
          label="Arrest Risk"
          color="#ff3366"
        />
        <RiskGauge
          value={riskMetrics.manifestDistance / 20}
          label="Trajectory Confidence"
          color="#00d4ff"
        />
      </div>

      {riskMetrics.riskFactors.length > 0 && (
        <div>
          <div style={{
            color: 'rgba(156, 163, 175, 0.8)',
            fontSize: '11px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            Risk Factors
          </div>
          <div style={{ display: 'grid', gap: '4px' }}>
            {riskMetrics.riskFactors.map((factor, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: `${factor.color}15`,
                borderRadius: '4px',
                border: `1px solid ${factor.color}30`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: factor.color
                  }} />
                  <span style={{
                    color: '#e5e7eb',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {factor.name}
                  </span>
                </div>
                <span style={{
                  color: factor.color,
                  fontSize: '11px',
                  fontWeight: '600',
                  fontFamily: 'ui-monospace, Monaco, "Cascadia Code", "Segoe UI Mono", Consolas, monospace'
                }}>
                  {factor.impact}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePerturbations.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: 'rgba(255, 51, 102, 0.08)',
          borderRadius: '6px',
          border: '1px solid rgba(255, 51, 102, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff3366" opacity="0.8">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          <div style={{
            color: '#ff3366',
            fontSize: '11px',
            fontWeight: '500'
          }}>
            Perturbation effects detected • Predictions reflect modified conditions
          </div>
        </div>
      )}
    </div>
  )
}

export default RiskAssessment