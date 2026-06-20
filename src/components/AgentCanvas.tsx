'use client'

import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import AgentScene from './AgentScene'

interface AgentCanvasProps {
  phase: number
  phaseProgress: number
}

// ── DEV: cycle every clip by index to confirm the mapping in src/lib/clips.ts ──
function ClipInspector() {
  const { scene, animations } = useGLTF('/agent_os.glb')
  const { actions, names } = useAnimations(animations, undefined)
  const [i, setI] = useState(0)

  useEffect(() => {
    const name = names[i]
    const a = name ? actions[name] : undefined
    a?.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.2).play()
    return () => { a?.fadeOut(0.2) }
  }, [i, actions, names])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((v) => (v + 1) % names.length)
      if (e.key === 'ArrowLeft') setI((v) => (v - 1 + names.length) % names.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [names.length])

  return (
    <>
      <ambientLight intensity={0.6} />
      <spotLight position={[5, 8, 5]} intensity={80} castShadow />
      <Environment preset="night" />
      <primitive object={scene} />
      <OrbitControls />
      {/* index shown via document title — simplest overlay-free readout */}
      <DevTitle i={i} total={names.length} name={names[i]} />
    </>
  )
}

function DevTitle({ i, total, name }: { i: number; total: number; name?: string }) {
  useEffect(() => {
    document.title = `CLIP [${i}/${total - 1}] ${name ?? ''} — ←/→ to cycle`
  }, [i, total, name])
  return null
}

export default function AgentCanvas({ phase, phaseProgress }: AgentCanvasProps) {
  const [inspect, setInspect] = useState(false)
  useEffect(() => {
    setInspect(window.location.hash === '#inspect')
  }, [])

  return (
    <Canvas
      shadows
      // Capped DPR + power preference keep GPU memory down so the WebGL context
      // doesn't get lost (two canvases + studio HDRs + a 126k-vert mesh add up).
      dpr={[1, 1.5]}
      camera={{ position: [3, 2.5, 6], fov: 38 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        {inspect ? <ClipInspector /> : <AgentScene phase={phase} phaseProgress={phaseProgress} />}
      </Suspense>
    </Canvas>
  )
}
