'use client'

import { useEffect, useRef, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { AgentState, CLIP_INDEX, ONCE_STATES, FADE } from '@/lib/clips'

useGLTF.preload('/agent_os.glb')

interface AgentModelProps {
  /** Current state machine state — changing it crossfades to the new clip. */
  state: AgentState
  /** Target standing height in world units (default 1.8 ≈ human). */
  targetHeight?: number
}

interface Fit {
  scale: number
  pos: [number, number, number]
}

/**
 * Loads agent_os.glb, exposes its Mixamo clips through useAnimations, and runs
 * a small crossfade state machine. The visual representation of Agent OS.
 *
 * The GLB ships with an Armature scale of 0.01, so the whole rig is ≈0.02 units
 * tall. We auto-fit it to `targetHeight` and rest its feet on y=0.
 *
 * IMPORTANT: we measure the SKELETON (bone world positions) but we apply the
 * fit transform to a WRAPPER GROUP — never to the loaded scene's own
 * scale/position. Mutating the SkinnedMesh's transform after load corrupts its
 * bind matrices and collapses the mesh into a tiny dark blob (which is exactly
 * what was happening: the character was there but rendered as a dark square).
 */
export default function AgentModel({ state, targetHeight = 1.8 }: AgentModelProps) {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('/agent_os.glb')
  const { actions, names } = useAnimations(animations, group)
  const current = useRef<AgentState | null>(null)

  const [fit, setFit] = useState<Fit>({ scale: 1, pos: [0, 0, 0] })

  // Material + one-time fit measurement.
  useEffect(() => {
    // Self-lit GOLD: high emissive so the agent is visible regardless of the
    // (very dark) scene lighting, low metalness so it shows diffuse colour
    // instead of only reflecting the environment. DoubleSide guards against the
    // AI-generated mesh's inconsistent winding.
    const gold = new THREE.MeshStandardMaterial({
      color: '#e9b22a',
      metalness: 0.3,
      roughness: 0.4,
      emissive: new THREE.Color('#caa01f'),
      emissiveIntensity: 0.85,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide,
    })
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh
        m.material = gold
        m.castShadow = true
        m.receiveShadow = true
        m.frustumCulled = false
      }
    })

    // Reset any transform a previous (mutating) version of this code may have
    // baked into the cached scene — useGLTF reuses one scene instance, so a
    // leftover ×91 scale would otherwise compound with the wrapper below.
    scene.scale.setScalar(1)
    scene.position.set(0, 0, 0)
    scene.rotation.set(0, 0, 0)

    // Measure bone world positions at the scene's natural (unmodified) state.
    scene.updateWorldMatrix(true, true)
    const box = new THREE.Box3()
    const p = new THREE.Vector3()
    let bones = 0
    scene.traverse((o) => {
      if ((o as THREE.Bone).isBone) {
        o.getWorldPosition(p)
        box.expandByPoint(p)
        bones++
      }
    })
    if (bones === 0) box.setFromObject(scene)

    const size = new THREE.Vector3()
    box.getSize(size)
    const center = new THREE.Vector3()
    box.getCenter(center)

    if (size.y > 1e-6) {
      const k = targetHeight / size.y
      // Centre X/Z over the origin and drop the lowest bone to y≈0 (feet down).
      setFit({
        scale: k,
        pos: [-center.x * k, -box.min.y * k, -center.z * k],
      })
    }
  }, [scene, targetHeight])

  // Crossfade whenever the requested state changes.
  useEffect(() => {
    if (current.current === state) return

    const nextName = names[CLIP_INDEX[state]]
    const next = nextName ? actions[nextName] : undefined
    if (!next) return

    const prevName = current.current != null ? names[CLIP_INDEX[current.current]] : undefined
    const prev = prevName ? actions[prevName] : undefined

    const once = ONCE_STATES.has(state)
    next
      .reset()
      .setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity)
    next.clampWhenFinished = once
    next.enabled = true
    next.setEffectiveWeight(1)
    next.fadeIn(FADE).play()

    if (prev && prev !== next) prev.fadeOut(FADE)

    current.current = state
  }, [state, actions, names])

  // Outer group = animation mixer root. Inner group carries the auto-fit
  // transform so the loaded scene's own matrices stay untouched (skinning safe).
  return (
    <group ref={group}>
      <group scale={fit.scale} position={fit.pos}>
        <primitive object={scene} />
      </group>
    </group>
  )
}
