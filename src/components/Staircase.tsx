'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

export const STEP_COUNT = 8
export const STEP_RISE = 0.42 // height per step
export const STEP_RUN = 0.62 // depth per step
export const STEP_WIDTH = 3.2

/** Top-of-stairs and bottom-of-stairs world positions for the walk path. */
export const STAIR_TOP = new THREE.Vector3(0, STEP_COUNT * STEP_RISE, STEP_COUNT * STEP_RUN)
export const STAIR_BOTTOM = new THREE.Vector3(0, 0, 0)

/** Point on the staircase path at parametric t (0 = top, 1 = bottom). */
export function stairPoint(t: number, out = new THREE.Vector3()) {
  const c = Math.min(1, Math.max(0, t))
  return out.lerpVectors(STAIR_TOP, STAIR_BOTTOM, c)
}

const STEP_MAT = {
  color: '#0c0e12',
  metalness: 0.7,
  roughness: 0.35,
}

/**
 * A full multi-step staircase descending toward the desk, built from
 * primitives (the GLB contains only the character). The agent walks down it.
 */
export default function Staircase() {
  const steps = useMemo(() => Array.from({ length: STEP_COUNT }, (_, i) => i), [])

  return (
    <group>
      {steps.map((i) => {
        const y = i * STEP_RISE + STEP_RISE / 2
        const z = i * STEP_RUN + STEP_RUN / 2
        return (
          <group key={i}>
            {/* tread */}
            <mesh position={[0, y, z]} castShadow receiveShadow>
              <boxGeometry args={[STEP_WIDTH, STEP_RISE, STEP_RUN]} />
              <meshStandardMaterial {...STEP_MAT} />
            </mesh>
            {/* acid nosing strip — subtle edge light */}
            <mesh position={[0, y + STEP_RISE / 2 - 0.012, z + STEP_RUN / 2 - 0.01]}>
              <boxGeometry args={[STEP_WIDTH, 0.02, 0.03]} />
              <meshStandardMaterial color="#c8ff00" emissive="#c8ff00" emissiveIntensity={1.4} toneMapped={false} />
            </mesh>
          </group>
        )
      })}

      {/* side rails */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * (STEP_WIDTH / 2 + 0.05), STEP_COUNT * STEP_RISE * 0.5, STEP_COUNT * STEP_RUN * 0.5]}
          rotation={[Math.atan2(STEP_RISE, STEP_RUN), 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.08, 0.1, STEP_COUNT * STEP_RUN * 1.45]} />
          <meshStandardMaterial color="#14171d" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* top landing */}
      <mesh position={[0, STEP_COUNT * STEP_RISE, STEP_COUNT * STEP_RUN + 1]} receiveShadow castShadow>
        <boxGeometry args={[STEP_WIDTH, STEP_RISE, 2]} />
        <meshStandardMaterial {...STEP_MAT} />
      </mesh>
    </group>
  )
}
