'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'

// Floating fragment that flies outward on explosion
function Fragment({ startPos, endPos, startRot, progress }: {
  startPos: THREE.Vector3
  endPos: THREE.Vector3
  startRot: THREE.Euler
  progress: number
}) {
  const eased = progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2

  const pos = startPos.clone().lerp(endPos, eased)
  const opacity = Math.max(0, 1 - eased * 1.4)

  return (
    <mesh position={[pos.x, pos.y, pos.z]} rotation={[startRot.x + eased * 2, startRot.y + eased * 3, startRot.z + eased]}>
      <boxGeometry args={[
        0.08 + Math.random() * 0.18,
        0.08 + Math.random() * 0.18,
        0.02 + Math.random() * 0.06
      ]} />
      <meshStandardMaterial
        color="#1a8fff"
        metalness={0.9}
        roughness={0.1}
        transparent
        opacity={opacity}
        emissive="#004488"
        emissiveIntensity={0.8}
      />
    </mesh>
  )
}

function GlowBox({ explodeProgress }: { explodeProgress: number }) {
  const boxRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (boxRef.current) {
      boxRef.current.rotation.y = t * 0.25
      boxRef.current.rotation.x = Math.sin(t * 0.4) * 0.08
      boxRef.current.scale.setScalar(1 - explodeProgress * 0.8)
      const boxMat = boxRef.current.material as THREE.MeshStandardMaterial
      boxMat.opacity = Math.max(0, 1 - explodeProgress * 2)
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar((1 - explodeProgress) * (1 + Math.sin(t * 2) * 0.05))
      glowRef.current.rotation.y = t * 0.3
    }
  })

  return (
    <group>
      <mesh ref={glowRef}>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshBasicMaterial color="#0044ff" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
      <mesh ref={boxRef} castShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color="#0a1a2a"
          metalness={0.95}
          roughness={0.05}
          transparent
          opacity={1}
          wireframe={false}
          emissive="#001133"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Edge glow lines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.5, 1.5, 1.5)]} />
        <lineBasicMaterial color="#3af" transparent opacity={Math.max(0, 1 - explodeProgress * 3)} />
      </lineSegments>
    </group>
  )
}

function Fragments({ progress }: { progress: number }) {
  const fragments = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const angle = (i / 40) * Math.PI * 2
      const radius = 0.6 + Math.random() * 0.6
      const startPos = new THREE.Vector3(
        Math.cos(angle) * radius * 0.3,
        (Math.random() - 0.5) * 1.2,
        Math.sin(angle) * radius * 0.3
      )
      const endPos = new THREE.Vector3(
        Math.cos(angle) * (2 + Math.random() * 4),
        -2 + Math.random() * 4,
        Math.sin(angle) * (2 + Math.random() * 4)
      )
      return {
        startPos,
        endPos,
        startRot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      }
    })
  }, [])

  if (progress <= 0) return null

  return (
    <>
      {fragments.map((f, i) => (
        <Fragment key={i} {...f} progress={progress} />
      ))}
    </>
  )
}

function HeroScene({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree()
  const mannequinOpacity = Math.max(0, (scrollProgress - 0.15) / 0.5)

  // DVD-style bounce for the box while still in the intro (scrollProgress < 0.15).
  const boxGroupRef = useRef<THREE.Group>(null)
  const bounce = useRef({ x: 0.9, y: 0.4, vx: 0.021, vy: 0.015 })

  useFrame(() => {
    // Camera slowly pulls back as mannequin appears
    camera.position.z = 5 + scrollProgress * 1.5
    camera.position.y = scrollProgress * 0.5

    // Box flies around, then eases back to center as the morph begins.
    const freedom = Math.max(0, 1 - scrollProgress / 0.15) // 1 → 0 over intro
    const b = bounce.current
    const BX = 2.4
    const BY = 1.45
    b.x += b.vx
    b.y += b.vy
    if (b.x > BX || b.x < -BX) b.vx *= -1
    if (b.y > BY || b.y < -BY) b.vy *= -1
    if (boxGroupRef.current) {
      boxGroupRef.current.position.x = b.x * freedom
      boxGroupRef.current.position.y = b.y * freedom
      // Small while floating (freedom→1), grows to full as it centers, then
      // the explode shrink takes over.
      const introScale = 0.32 + 0.68 * (1 - freedom)
      boxGroupRef.current.scale.setScalar(introScale * (1 - scrollProgress * 0.4))
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 3]} intensity={1.5} color="#fff8e0" castShadow />
      <directionalLight position={[-3, 3, -2]} intensity={0.6} color="#c8ff00" />
      <pointLight position={[0, 3, 2]} intensity={2} color="#d4a017" distance={8} />
      <pointLight position={[0, -2, 3]} intensity={0.8} color="#1a4fff" distance={6} />

      {/* No Environment HDR here — the box is self-lit (emissive + edge glow)
          and the explicit lights above are enough. Dropping the second studio
          cubemap keeps a lid on GPU memory so the context stops getting lost. */}

      {/* The box — zigzags around small, snaps to center, then explodes.
          Position + scale are driven each frame in HeroScene's useFrame. */}
      <group ref={boxGroupRef}>
        <GlowBox explodeProgress={scrollProgress} />
        <Fragments progress={scrollProgress} />
      </group>

      {/* NOTE: the old procedural mannequin was removed — the box now bursts
          and fades to uncover the real GLB character rendered beneath this
          layer (see PhaseStage). The burst IS the reveal. */}

      {/* Subtle floating data sparkles — kept faint so the intro stays clean. */}
      <Sparkles
        count={40}
        size={1.2}
        scale={8}
        color="#00aaff"
        opacity={0.25}
        speed={0.3}
      />
    </>
  )
}

export default function HeroCanvas({ scrollProgress }: { scrollProgress: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 5], fov: 42 }}
      style={{ position: 'absolute', inset: 0 }}
      // No shadows here (no ground to receive them) and capped DPR — this canvas
      // runs alongside the agent canvas, and two full WebGL contexts with
      // shadows + HDRs were exhausting GPU memory and losing the context.
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <HeroScene scrollProgress={scrollProgress} />
    </Canvas>
  )
}
