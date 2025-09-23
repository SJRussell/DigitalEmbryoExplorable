import { Canvas } from '@react-three/fiber'
import { OrbitControls, Instances, Instance } from '@react-three/drei'
import { useMemo } from 'react'
import { useStore } from '../state/store'
import * as THREE from 'three'

function fibonacciSpherePoints(n: number, radius = 1): THREE.Vector3[] {
  if (n <= 1) return [new THREE.Vector3(0, 0, 0)]
  const pts: THREE.Vector3[] = []
  const offset = 2 / n
  const increment = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = i * offset - 1 + offset / 2
    const r = Math.sqrt(1 - y * y)
    const phi = i * increment
    const x = Math.cos(phi) * r
    const z = Math.sin(phi) * r
    pts.push(new THREE.Vector3(x * radius, y * radius, z * radius))
  }
  return pts
}

type Cell = {
  position: THREE.Vector3
  lineage: 'TE' | 'ICM' | 'undetermined'
  scale?: [number, number, number]
  quaternion?: THREE.Quaternion
  nuclei?: { position: THREE.Vector3; size: number }[]
}

function prand(i: number) {
  // Deterministic pseudo-random in [0,1)
  const s = Math.sin(i * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export function EmbryoCanvas() {
  const stages = useStore((s) => s.stages)
  const t = useStore((s) => s.stageT)
  const active = useStore((s) => s.activePerturbations)
  const perts = useStore((s) => s.perturbations)
  const visibility = useStore((s) => s.visibility)
  const setSelectedLineage = useStore((s) => s.setSelectedLineage)

  const { cells, scale, embryoRadius } = useMemo(() => {
    if (!stages.length)
      return { cells: [] as Cell[], scale: 0.2, embryoRadius: 1.0 }
    const i0 = Math.floor(t)
    const i1 = Math.min(stages.length - 1, i0 + 1)
    const alpha = t - i0

    // Check for AURKA arrest - should arrest at 2-cell or 4-cell stage
    let maxStageForARRest = stages.length - 1
    if (active.includes('AURKA_inhibit')) {
      // Find index of 4-cell stage
      const fourCellIndex = stages.findIndex(s => s.cellCount >= 4)
      if (fourCellIndex >= 0) {
        maxStageForARRest = Math.min(fourCellIndex, stages.length - 1)
      }
    }

    // Clamp current stage to arrest point if needed
    const effectiveI0 = Math.min(i0, maxStageForARRest)
    const effectiveI1 = Math.min(i1, maxStageForARRest)
    const effectiveS0 = stages[effectiveI0]
    const effectiveS1 = stages[effectiveI1]

    // Division transition detection
    const isDividing = alpha > 0.2 && alpha < 0.8 && effectiveS0.cellCount !== effectiveS1.cellCount

    // Interpolate total cell count
    let count = Math.max(1, Math.round(lerp(effectiveS0.cellCount, effectiveS1.cellCount, alpha)))

    // Apply glycolysis effects (but not AURKA since that's handled by arrest)
    if (active.includes('glycolysis_impair')) {
      const f = perts?.glycolysis_impair?.effects?.divisionRateFactor ?? 0.7
      count = Math.max(1, Math.round(count * f))
    }

    // Lineage ratios interpolation (default to undetermined)
    const te0 = effectiveS0.lineages?.TE ?? 0
    const te1 = effectiveS1.lineages?.TE ?? 0
    const icm0 = effectiveS0.lineages?.ICM ?? 0
    const icm1 = effectiveS1.lineages?.ICM ?? 0
    const teRatio = lerp(te0, te1, alpha)
    const icmRatio = lerp(icm0, icm1, alpha)

    const teCount = Math.round(count * teRatio)
    const icmCount = Math.round(count * icmRatio)
    const undCount = Math.max(0, count - teCount - icmCount)

    // Cell scale: continuous across 4->5 so sizes don't jump
    let scl = 0.6 / Math.cbrt(count + 0.25)
    scl = Math.min(0.45, Math.max(0.18, scl))
    if (active.includes('glycolysis_impair')) scl *= 0.9

    const embryoRadius = 1.0
    const avgDay = lerp(effectiveS0.day, effectiveS1.day, alpha)
    const blast = smoothstep(4.0, 5.0, avgDay)
    // Maintain a cavity at blastocyst stage but don't render a fluid mesh
    let cavityR = embryoRadius * (0.18 + 0.47 * blast)
    if (active.includes('glycolysis_impair')) {
      const bf = perts?.glycolysis_impair?.effects?.blastocoelSizeFactor ?? 0.8
      cavityR *= bf
    }
    const cells: Cell[] = []

    // TE on a shell
    if (teCount > 0) {
      const tePositions = fibonacciSpherePoints(teCount, embryoRadius - scl * 0.1)
      for (const p of tePositions) {
        cells.push({
          position: p,
          lineage: 'TE',
          nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.08 * scl }]
        })
      }
    }

    // ICM: compact cluster near one pole (inside TE shell)
    const pole = new THREE.Vector3(0.25, 0.9, 0.2).normalize()
    // Choose a radius just outside the blastocoel surface but safely inside TE
    const icmRadial = Math.max(cavityR + 1.0 * scl, embryoRadius - 3.0 * scl)
    const icmCenter = pole.clone().multiplyScalar(icmRadial)
    const icmRadius = lerp(0.10, 0.14, blast) * embryoRadius
    for (let i = 0; i < icmCount; i++) {
      // Random point in a small sphere around icmCenter
      const rr = icmRadius * Math.cbrt(prand(i) * 0.999)
      const th = prand(i + 13) * Math.PI * 2
      const u = prand(i + 37) * 2 - 1
      const ph = Math.acos(u)
      const x = rr * Math.sin(ph) * Math.cos(th)
      const y = rr * Math.sin(ph) * Math.sin(th)
      const z = rr * Math.cos(ph)
      const pos = new THREE.Vector3(x, y, z).add(icmCenter)
      const len = pos.length()
      const maxICM = embryoRadius - scl * 1.6
      if (len > maxICM) pos.multiplyScalar(maxICM / (len + 1e-6))
      cells.push({
        position: pos,
        lineage: 'ICM',
        nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.09 * scl }]
      })
    }

    // Undetermined: before compaction, distribute to fill zona; after, on a shell
    if (undCount > 0) {
      if (avgDay < 3 && count > 4) {
        // Early cleavage (5–8 cells): arrange near zona surface with slight inward jitter
        const shell = fibonacciSpherePoints(undCount, embryoRadius - scl * 0.15)
        for (let i = 0; i < undCount; i++) {
          const p = shell[i]
          const jitter = (prand(i + 501) * 0.4 + 0.1) * scl
          const len = p.length() || 1
          const inward = p.clone().multiplyScalar(-jitter / len)
          cells.push({
            position: p.clone().add(inward),
            lineage: 'undetermined',
            nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.09 * scl }]
          })
        }
      } else if (avgDay < 4.2) {
        // Morula-like: dense volume packing inside zona (compaction)
        for (let i = 0; i < undCount; i++) {
          const r = 0.95 * Math.cbrt(prand(i + 101))
          const theta = prand(i + 211) * Math.PI * 2
          const u = prand(i + 307) * 2 - 1
          const phi = Math.acos(u)
          const x = r * Math.sin(phi) * Math.cos(theta)
          const y = r * Math.sin(phi) * Math.sin(theta)
          const z = r * Math.cos(phi)
          const pos = new THREE.Vector3(x, y, z).multiplyScalar(embryoRadius - scl * 0.2)
          cells.push({
            position: pos,
            lineage: 'undetermined',
            nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.08 * scl }]
          })
        }
      } else {
        const undet = fibonacciSpherePoints(undCount, embryoRadius - scl * 0.25)
        for (const p of undet) {
          cells.push({
            position: p,
            lineage: 'undetermined',
            nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.08 * scl }]
          })
        }
      }
    }

    // Early-stage shaping: ensure cells fill the zona for 1–4 cells
    if (count <= 4) {
      const R = embryoRadius
      cells.length = 0

      // Special handling for 1→2 cell transition
      if ((effectiveS0.cellCount === 1 && effectiveS1.cellCount === 2) ||
          (count === 1 && alpha > 0.1) ||
          (count === 2 && alpha < 0.9)) {

        // Enhanced division detection for 1→2 transition
        let divisionProgress = 0
        if (effectiveS0.cellCount === 1 && effectiveS1.cellCount === 2) {
          // We're definitely in 1→2 transition
          divisionProgress = alpha
        } else if (count === 1 && alpha > 0.1) {
          // Late in zygote stage, prepare for division
          divisionProgress = (alpha - 0.1) / 0.9
        } else if (count === 2 && alpha < 0.9) {
          // Early in 2-cell stage, complete division
          divisionProgress = 0.5 + (alpha * 0.5)
        }

        // Clamp division progress
        divisionProgress = Math.max(0, Math.min(1, divisionProgress))


        if (divisionProgress < 0.15) {
          // Very early: single cell, start nucleus division
          const nucleusSepar = 0.02 * R * 0.98 * (divisionProgress / 0.15)
          cells.push({
            position: new THREE.Vector3(0, 0, 0),
            lineage: 'undetermined',
            scale: [R * 0.98 * 1.02, R * 0.98 * (1.0 + divisionProgress * 0.1), R * 0.98 * 1.02],
            nuclei: divisionProgress > 0.05 ? [
              { position: new THREE.Vector3(0, nucleusSepar, 0), size: 0.13 * R * 0.98 },
              { position: new THREE.Vector3(0, -nucleusSepar, 0), size: 0.13 * R * 0.98 }
            ] : [{ position: new THREE.Vector3(0, 0, 0), size: 0.15 * R * 0.98 }]
          })
          scl = R * 0.98
        } else {
          // Division proper: two cells start overlapping, separate and shrink
          const separationProgress = (divisionProgress - 0.15) / 0.85

          // Separation distance: start at 0 (overlapping), end at proper spacing
          const maxSeparation = R * 0.55 // Final separation for 2-cell stage
          const separationDist = maxSeparation * Math.pow(separationProgress, 0.5)

          // Cell size: start large (overlapping), shrink to final size
          const startSize = 0.8  // Large enough to overlap significantly
          const endSize = 0.48   // Final size that fits in zona when separated
          const currentSize = lerp(startSize, endSize, Math.pow(separationProgress, 0.4))
          const r = R * currentSize

          // Two cells separating
          cells.push({
            position: new THREE.Vector3(0, separationDist, 0),
            lineage: 'undetermined',
            scale: [r * 1.05, r * 1.15, r * 1.05],
            nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.13 * r }]
          })
          cells.push({
            position: new THREE.Vector3(0, -separationDist, 0),
            lineage: 'undetermined',
            scale: [r * 1.05, r * 1.15, r * 1.05],
            nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.13 * r }]
          })
          scl = r
        }

        // Mark that we handled 1→2 division - skip normal positioning
        return { cells, scale: scl, embryoRadius }
      } else if (isDividing && effectiveS0.cellCount === 2 && effectiveS1.cellCount === 4) {
        // 2→4 cell division
        const divisionProgress = (alpha - 0.2) / 0.6
        const separationDist = 0.3 * R * divisionProgress
        const r = R * 0.45

        // First original cell divides
        cells.push({
          position: new THREE.Vector3(-separationDist, R * 0.3, 0),
          lineage: 'undetermined',
          scale: [r * 1.04, r * 1.15, r * 1.04],
          nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.12 * r }]
        })
        cells.push({
          position: new THREE.Vector3(separationDist, R * 0.3, 0),
          lineage: 'undetermined',
          scale: [r * 1.04, r * 1.15, r * 1.04],
          nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.12 * r }]
        })

        // Second original cell divides
        cells.push({
          position: new THREE.Vector3(-separationDist, -R * 0.3, 0),
          lineage: 'undetermined',
          scale: [r * 1.04, r * 1.15, r * 1.04],
          nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.12 * r }]
        })
        cells.push({
          position: new THREE.Vector3(separationDist, -R * 0.3, 0),
          lineage: 'undetermined',
          scale: [r * 1.04, r * 1.15, r * 1.04],
          nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.12 * r }]
        })
        scl = r
      } else {
        // Normal static cell positioning
        if (count === 1) {
          const r = R * 0.98

          // Add pronuclei and syngamy animation based on time within zygote stage
          const stageProgress = alpha // Progress within zygote stage
          let nuclei: { position: THREE.Vector3; size: number }[] = []

          if (stageProgress < 0.4) {
            // Two pronuclei - male and female
            const separation = 0.15 * r * (1 - stageProgress / 0.4) // They get closer over time
            nuclei = [
              { position: new THREE.Vector3(-separation, 0, 0), size: 0.12 * r },
              { position: new THREE.Vector3(separation, 0, 0), size: 0.12 * r }
            ]
          } else if (stageProgress < 0.6) {
            // Syngamy - pronuclei merging
            const mergeProgress = (stageProgress - 0.4) / 0.2
            const separation = 0.03 * r * (1 - mergeProgress)
            const nucleusSize = 0.12 * r * (1 + mergeProgress * 0.5) // Slightly larger during merge
            nuclei = [
              { position: new THREE.Vector3(-separation, 0, 0), size: nucleusSize },
              { position: new THREE.Vector3(separation, 0, 0), size: nucleusSize }
            ]
          } else {
            // Single nucleus after syngamy
            nuclei = [{ position: new THREE.Vector3(0, 0, 0), size: 0.15 * r }]
          }

          cells.push({
            position: new THREE.Vector3(0, 0, 0),
            lineage: 'undetermined',
            scale: [r * 1.02, r, r * 1.02],
            nuclei
          })
          scl = r
        } else if (count === 2) {
          // Regular 2-cell positioning (only for stable 2-cell stage)
          const r = R * 0.5 * 0.99
          const d = R - r
          // Add single nucleus to each cell
          const nuclei = [{ position: new THREE.Vector3(0, 0, 0), size: 0.13 * r }]
          cells.push({
            position: new THREE.Vector3(0, d, 0),
            lineage: 'undetermined',
            scale: [r * 1.05, r * 1.15, r * 1.05],
            nuclei
          })
          cells.push({
            position: new THREE.Vector3(0, -d, 0),
            lineage: 'undetermined',
            scale: [r * 1.05, r * 1.15, r * 1.05],
            nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.13 * r }]
          })
          scl = r
        } else if (count === 3) {
          const r = R * 0.56
          const a = R - r
          const dirs = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-0.5, 0, Math.sqrt(3) / 2),
            new THREE.Vector3(-0.5, 0, -Math.sqrt(3) / 2),
          ]
          for (const ddir of dirs) {
            const pos = ddir.clone().normalize().multiplyScalar(a * 0.98)
            cells.push({
              position: pos,
              lineage: 'undetermined',
              scale: [r * 1.06, r, r * 1.06],
              nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.12 * r }]
            })
          }
          scl = r
        } else if (count === 4) {
          const r = R * 0.45
          const a = (R - r) * 0.98
          const dirs = [
            new THREE.Vector3(1, 1, 1).normalize(),
            new THREE.Vector3(-1, 1, -1).normalize(),
            new THREE.Vector3(1, -1, -1).normalize(),
            new THREE.Vector3(-1, -1, 1).normalize(),
          ]
          for (const dir of dirs) {
            const pos = dir.clone().multiplyScalar(a)
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
            cells.push({
              position: pos,
              lineage: 'undetermined',
              quaternion: q,
              scale: [r * 1.04, r * 1.15, r * 1.04],
              nuclei: [{ position: new THREE.Vector3(0, 0, 0), size: 0.11 * r }]
            })
          }
          scl = r
        }
      }
    }


    // Lightweight relaxation for overlap and wall constraint + gentle movement
    const iterations = active.includes('AURKA_inhibit') ? 2 : avgDay < 4 ? 6 : 3
    const maxR = embryoRadius - scl * 0.02

    // Skip relaxation and movement for 1→2 division to preserve animation
    const isIn1to2Division = (effectiveS0.cellCount === 1 && effectiveS1.cellCount === 2) ||
                             (count === 1 && alpha > 0.1) ||
                             (count === 2 && alpha < 0.9)

    // Add gentle random movement to all cells (brownian-like motion)
    const time = Date.now() * 0.001 // Current time for animation
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      // Add movement to 2+ cells, but vary amplitude by stage
      if (count >= 2 && !isDividing && !isIn1to2Division) { // Don't add movement during division animations
        const freq = 0.3 + 0.4 * prand(i + 999) // Slightly different frequency per cell

        // Scale movement amplitude by stage - less for early stages, more for later
        let amplitudeScale = 1.0
        if (count === 2) amplitudeScale = 0.3      // Very gentle for 2-cell
        else if (count <= 4) amplitudeScale = 0.5  // Gentle for 4-cell
        else if (avgDay < 4) amplitudeScale = 0.7  // Moderate for morula
        else amplitudeScale = 1.0                  // Full for blastocyst

        const amplitude = scl * 0.025 * amplitudeScale * (0.5 + 0.5 * prand(i + 777))

        // Gentle sinusoidal movement in 3D
        const offset = new THREE.Vector3(
          Math.sin(time * freq + i * 1.7) * amplitude,
          Math.sin(time * freq * 1.3 + i * 2.1) * amplitude,
          Math.sin(time * freq * 0.9 + i * 1.3) * amplitude
        )
        cell.position.add(offset)
      }
    }

    // Skip relaxation during 1→2 division to preserve animation
    if (!isIn1to2Division) {
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < cells.length; i++) {
          for (let j = i + 1; j < cells.length; j++) {
          const a = cells[i].position
          const b = cells[j].position
          const delta = b.clone().sub(a)
          const dist = delta.length() + 1e-6
          const si = cells[i].scale
          const sj = cells[j].scale
          const ra = Array.isArray(si) ? (si[0] + si[1] + si[2]) / 3 : scl
          const rb = Array.isArray(sj) ? (sj[0] + sj[1] + sj[2]) / 3 : scl
          const minDist = (ra + rb) * 0.98
          if (dist < minDist) {
            const push = (minDist - dist) * 0.5
            const dir = delta.multiplyScalar(1 / dist)
            a.addScaledVector(dir, -push)
            b.addScaledVector(dir, push)
          }
        }
        // Wall constraint (outer zona)
        const p = cells[i].position
        const len = p.length()
        if (len > maxR) {
          p.multiplyScalar(maxR / (len + 1e-6))
        }
        // Keep TE near the zona at blastocyst
        if (blast > 0.2 && cells[i].lineage === 'TE') {
          const teMin = embryoRadius - 2.2 * scl
          if (len < teMin) p.multiplyScalar(teMin / (len + 1e-6))
        }
        // Keep blastocoel cavity empty once formed
        if (blast > 0.05) {
          const minLen = cavityR + scl * 0.9
          if (len < minLen) {
            p.multiplyScalar(minLen / (len + 1e-6))
          }
        }
        // Morula compaction: smoothly draw undetermined cells inward
        const comp = smoothstep(2.8, 4.0, avgDay)
        if (cells[i].lineage === 'undetermined' && comp > 0) {
          const inward = 1 - 0.02 * comp
          p.multiplyScalar(inward)
        }
        // Blastocyst: keep ICM cohesively clustered around its pole
        if (avgDay >= 4.6 && cells[i].lineage === 'ICM') {
          const attract = icmCenter.clone().sub(p).multiplyScalar(0.04)
          p.add(attract)
          // keep away from center slightly to avoid drifting inward
          const minShell = embryoRadius * 0.45
          if (p.length() < minShell) p.multiplyScalar(minShell / (p.length() + 1e-6))
        }
      }
    }
    } // Close the isIn1to2Division condition

    return { cells, scale: scl, embryoRadius }
  }, [stages, t, active, perts])

  return (
    <Canvas
      camera={{ position: [2.5, 2.5, 2.5], fov: 50 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', background: '#0b0b0b', borderRadius: 12 }}
    >
      <ambientLight intensity={0.75} />
      <hemisphereLight intensity={0.8} color={'#eaf2ff'} groundColor={'#3a3a3a'} />
      <directionalLight position={[5, 5, 5]} intensity={1.4} />
      <directionalLight position={[-5, -2, -3]} intensity={0.7} />
      <group>
        {/* Zona pellucida: thin translucent shell */}
        {visibility.zona && (
        <mesh>
          {/* Zona radius independent from cell size for consistency */}
          <sphereGeometry args={[embryoRadius + 0.25, 64, 64]} />
          <meshPhysicalMaterial
            transparent
            opacity={0.18}
            transmission={1}
            roughness={0.25}
            thickness={0.4}
            ior={1.36}
            clearcoat={1}
            clearcoatRoughness={0.35}
            color={'#a9c9ff'}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        )}
        {/* Separate instance groups per lineage to avoid per-instance color issues */}
        {/* TE */}
        {visibility.TE && (
          <Instances limit={256}>
            <sphereGeometry args={[1, 22, 22]} />
            <meshPhysicalMaterial
              color={'#34d399'}
              transparent
              opacity={0.65}
              roughness={0.3}
              metalness={0.1}
              transmission={0.15}
              thickness={0.8}
              ior={1.4}
              clearcoat={0.8}
              clearcoatRoughness={0.2}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
            {cells
              .filter((c) => c.lineage === 'TE')
              .map((c, i) => (
                <Instance
                  key={`te-${i}`}
                  position={[c.position.x, c.position.y, c.position.z]}
                  scale={
                    active.includes('AURKA_inhibit')
                      ? (() => {
                          const s: any = c.scale ?? (scale as any)
                          const f = 0.9 + 0.3 * prand(i + 901)
                          return Array.isArray(s) ? [s[0] * f, s[1] * f, s[2] * f] : (s as number) * f
                        })()
                      : (c.scale ?? scale)
                  }
                  quaternion={c.quaternion}
                  onClick={() => setSelectedLineage(c.lineage)}
                />
              ))}
          </Instances>
        )}
        {/* ICM */}
        {visibility.ICM && (
          <Instances limit={256}>
            <sphereGeometry args={[1, 22, 22]} />
            <meshPhysicalMaterial
              color={'#f59e0b'}
              transparent
              opacity={0.65}
              roughness={0.3}
              metalness={0.1}
              transmission={0.15}
              thickness={0.8}
              ior={1.4}
              clearcoat={0.8}
              clearcoatRoughness={0.2}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
            {cells
              .filter((c) => c.lineage === 'ICM')
              .map((c, i) => (
                <Instance
                  key={`icm-${i}`}
                  position={[c.position.x, c.position.y, c.position.z]}
                  scale={
                    active.includes('AURKA_inhibit')
                      ? (() => {
                          const s: any = c.scale ?? (scale as any)
                          const f = 0.9 + 0.3 * prand(i + 901)
                          return Array.isArray(s) ? [s[0] * f, s[1] * f, s[2] * f] : (s as number) * f
                        })()
                      : (c.scale ?? scale)
                  }
                  quaternion={c.quaternion}
                  onClick={() => setSelectedLineage(c.lineage)}
                />
              ))}
          </Instances>
        )}
        {/* Undetermined */}
        {visibility.undetermined && (
          <Instances limit={256}>
            <sphereGeometry args={[1, 22, 22]} />
            <meshPhysicalMaterial
              color={'#93c5fd'}
              transparent
              opacity={0.65}
              roughness={0.3}
              metalness={0.1}
              transmission={0.15}
              thickness={0.8}
              ior={1.4}
              clearcoat={0.8}
              clearcoatRoughness={0.2}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
            {cells
              .filter((c) => c.lineage === 'undetermined')
              .map((c, i) => (
                <Instance
                  key={`und-${i}`}
                  position={[c.position.x, c.position.y, c.position.z]}
                  scale={
                    active.includes('AURKA_inhibit')
                      ? (() => {
                          const s: any = c.scale ?? (scale as any)
                          const f = 0.9 + 0.3 * prand(i + 901)
                          return Array.isArray(s) ? [s[0] * f, s[1] * f, s[2] * f] : (s as number) * f
                        })()
                      : (c.scale ?? scale)
                  }
                  quaternion={c.quaternion}
                  onClick={() => setSelectedLineage(c.lineage)}
                />
              ))}
          </Instances>
        )}

        {/* Nuclei rendering */}
        <Instances limit={512}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshPhongMaterial
            color={'#c4b5fd'}
            transparent
            opacity={0.4}
            shininess={10}
            specular={'#e0e7ff'}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
          {cells.flatMap((cell, cellIndex) =>
            (cell.nuclei || []).map((nucleus, nucleusIndex) => (
              <Instance
                key={`nucleus-${cellIndex}-${nucleusIndex}`}
                position={[
                  cell.position.x + nucleus.position.x,
                  cell.position.y + nucleus.position.y,
                  cell.position.z + nucleus.position.z
                ]}
                scale={nucleus.size}
              />
            ))
          )}
        </Instances>
      </group>
      <OrbitControls enablePan={false} />
    </Canvas>
  )
}

export default EmbryoCanvas
