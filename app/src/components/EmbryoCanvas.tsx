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
    const s0 = stages[i0]
    const s1 = stages[i1]

    // Interpolate total cell count
    let count = Math.max(1, Math.round(lerp(s0.cellCount, s1.cellCount, alpha)))

    // Simple illustrative perturbation effects
    if (active.includes('AURKA_inhibit') && (s0.day <= 2 || s1.day <= 2)) {
      count = Math.min(count, 4)
    }
    if (active.includes('glycolysis_impair')) {
      const f = perts?.glycolysis_impair?.effects?.divisionRateFactor ?? 0.8
      count = Math.max(1, Math.round(count * f))
    }

    // Lineage ratios interpolation (default to undetermined)
    const te0 = s0.lineages?.TE ?? 0
    const te1 = s1.lineages?.TE ?? 0
    const icm0 = s0.lineages?.ICM ?? 0
    const icm1 = s1.lineages?.ICM ?? 0
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
    const avgDay = lerp(s0.day, s1.day, alpha)
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
      for (const p of tePositions) cells.push({ position: p, lineage: 'TE' })
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
      cells.push({ position: pos, lineage: 'ICM' })
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
          cells.push({ position: p.clone().add(inward), lineage: 'undetermined' })
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
          cells.push({ position: pos, lineage: 'undetermined' })
        }
      } else {
        const undet = fibonacciSpherePoints(undCount, embryoRadius - scl * 0.25)
        for (const p of undet) cells.push({ position: p, lineage: 'undetermined' })
      }
    }

    // Early-stage shaping: ensure cells fill the zona for 1–4 cells
    if (count <= 4) {
      const R = embryoRadius
      cells.length = 0
      if (count === 1) {
        const r = R * 0.98
        cells.push({ position: new THREE.Vector3(0, 0, 0), lineage: 'undetermined', scale: [r * 1.02, r, r * 1.02] })
        scl = r
      } else if (count === 2) {
        const r = R * 0.5 * 0.99
        const d = R - r
        cells.push({ position: new THREE.Vector3(0, d, 0), lineage: 'undetermined', scale: [r * 1.05, r * 1.15, r * 1.05] })
        cells.push({ position: new THREE.Vector3(0, -d, 0), lineage: 'undetermined', scale: [r * 1.05, r * 1.15, r * 1.05] })
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
          cells.push({ position: pos, lineage: 'undetermined', scale: [r * 1.06, r, r * 1.06] })
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
          cells.push({ position: pos, lineage: 'undetermined', quaternion: q, scale: [r * 1.04, r * 1.15, r * 1.04] })
        }
        scl = r
      }
    }

    // Lightweight relaxation for overlap and wall constraint
    const iterations = active.includes('AURKA_inhibit') ? 2 : avgDay < 4 ? 6 : 3
    const maxR = embryoRadius - scl * 0.02
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
            <meshPhongMaterial
              color={'#34d399'}
              transparent
              opacity={0.78}
              shininess={30}
              specular={'#e6f0ff'}
              side={THREE.DoubleSide}
              depthWrite={true}
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
            <meshPhongMaterial
              color={'#f59e0b'}
              transparent
              opacity={0.78}
              shininess={30}
              specular={'#e6f0ff'}
              side={THREE.DoubleSide}
              depthWrite={true}
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
            <meshPhongMaterial
              color={'#93c5fd'}
              transparent
              opacity={0.78}
              shininess={30}
              specular={'#e6f0ff'}
              side={THREE.DoubleSide}
              depthWrite={true}
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
      </group>
      <OrbitControls enablePan={false} />
    </Canvas>
  )
}

export default EmbryoCanvas
