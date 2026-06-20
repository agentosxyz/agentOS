'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { PHASE } from '@/lib/phases'
import { AgentState } from '@/lib/clips'
import AgentModel from './AgentModel'
import ThoughtCloud from './ThoughtCloud'
import Staircase, { stairPoint, STAIR_TOP, STAIR_BOTTOM } from './Staircase'
import DeskRig, { SEAT_POS } from './DeskRig'

interface AgentSceneProps {
  phase: number
  phaseProgress: number
}

/** Map the scroll phase to an animation state for the character. */
function stateForPhase(phase: number, p: number): AgentState {
  switch (phase) {
    case PHASE.intro:
      return 'stand_idle'
    case PHASE.morph:
      // After the box reveal the agent stands and THINKS (BTC signal cloud),
      // then takes its first steps near the end of the phase.
      return p > 0.7 ? 'walk' : 'thinking'
    case PHASE.data:
      return 'walk'
    case PHASE.shadows:
      return 'sit_down'
    case PHASE.fusion:
      return 'typing'
    case PHASE.cta:
    default:
      return 'sit_idle'
  }
}

/** 0→1 progress along the WHOLE journey: down the stairs, then across the floor
 *  to the far desk. The agent thinks at the top first (morph), takes its first
 *  steps at the end of morph, then walks the rest through the data phase. */
function walkProgress(phase: number, p: number): number {
  if (phase < PHASE.morph) return 0
  if (phase === PHASE.morph) return Math.max(0, (p - 0.7) / 0.3) * 0.08 // first steps
  if (phase === PHASE.data) return 0.08 + p * 0.92
  return 1
}

// The journey is split: the first STAIR_FRAC of the walk descends the stairs,
// the remainder is a straight floor walk out to the (far) desk.
const STAIR_FRAC = 0.5

/** World-space point along the full journey at progress w (0=top, 1=at desk). */
function journeyPoint(w: number, out: THREE.Vector3): THREE.Vector3 {
  if (w <= STAIR_FRAC) {
    return stairPoint(w / STAIR_FRAC, out) // on the stairs
  }
  // on the floor: lerp from the bottom of the stairs to the seat
  const f = (w - STAIR_FRAC) / (1 - STAIR_FRAC)
  return out.lerpVectors(STAIR_BOTTOM, SEAT_POS, f)
}

/** How "formed" the thinking cloud is (0→1) for the current scroll position. */
function thoughtShow(phase: number, p: number): number {
  if (phase !== PHASE.morph) return 0
  // fade in after reveal (0.3), hold, fade out as walking begins (0.7)
  if (p < 0.3) return Math.max(0, (p - 0.15) / 0.15)
  if (p > 0.7) return Math.max(0, 1 - (p - 0.7) / 0.15)
  return 1
}

export default function AgentScene({ phase, phaseProgress }: AgentSceneProps) {
  const { camera } = useThree()
  const agentRef = useRef<THREE.Group>(null)
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const camTarget = useMemo(() => new THREE.Vector3(), [])

  const state = stateForPhase(phase, phaseProgress)
  const seated = phase >= PHASE.shadows
  const screenGlow = phase === PHASE.fusion ? 1 : phase > PHASE.fusion ? 0.5 : 0
  const cloud = thoughtShow(phase, phaseProgress)

  useFrame(() => {
    const g = agentRef.current
    if (!g) return

    if (seated) {
      // Snap to the chair seat, facing the desk (+Z).
      g.position.lerp(SEAT_POS, 0.15)
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, 0, 0.12)
    } else {
      // Walk the full journey: down the stairs, then across the floor to the
      // far desk. Character faces down-slope / forward (toward -Z/desk).
      const w = walkProgress(phase, phaseProgress)
      journeyPoint(w, tmp)
      g.position.lerp(tmp, 0.2)
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.PI, 0.1)
    }

    // Cinematic camera: pull in and lower as the agent reaches the desk.
    const focus = seated ? SEAT_POS : g.position
    camTarget.set(focus.x + 2.6, focus.y + 1.6, focus.z + 3.4)
    camera.position.lerp(camTarget, 0.05)
    camera.lookAt(focus.x, focus.y + 1.0, focus.z)
  })

  return (
    <>
      {/* ── DARK CINEMATIC STUDIO LIGHTING ── */}
      <color attach="background" args={['#04050a']} />
      <fog attach="fog" args={['#04050a', 8, 22]} />
      <ambientLight intensity={0.12} />
      {/* key spotlight */}
      <spotLight
        position={[4, 8, 4]}
        angle={0.5}
        penumbra={0.8}
        intensity={120}
        color="#fff4e0"
        distance={30}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
      />
      {/* acid rim from behind */}
      <spotLight position={[-5, 5, -5]} angle={0.7} penumbra={1} intensity={50} color="#c8ff00" distance={25} />
      {/* cool fill */}
      <pointLight position={[-3, 2, 4]} intensity={8} color="#1a4fff" distance={14} />
      {/* Studio IBL — gives the metallic gold character something bright to
          reflect so it actually reads. "night" was near-black, so the metal
          surface reflected darkness and the character rendered invisible. */}
      <Environment preset="studio" />

      <Staircase />
      <DeskRig screenGlow={screenGlow} />

      <group ref={agentRef} position={[STAIR_TOP.x, STAIR_TOP.y, STAIR_TOP.z]} scale={1.0}>
        <AgentModel state={state} />
        {/* Follow light so the agent is always lit, even up in the dark stairs */}
        <pointLight position={[0, 2.4, 1.2]} intensity={6} color="#ffd98a" distance={6} />
        <pointLight position={[0.6, 1.2, 0.8]} intensity={3} color="#c8ff00" distance={5} />
        {/* BTC signal "thinking" cloud above the head — morph phase only */}
        <ThoughtCloud show={cloud} />
      </group>

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -1]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#06070c" metalness={0.4} roughness={0.7} />
      </mesh>
    </>
  )
}
