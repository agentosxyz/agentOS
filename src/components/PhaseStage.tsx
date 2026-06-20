'use client'

import dynamic from 'next/dynamic'
import { PHASES, PHASE } from '@/lib/phases'

// Two stacked WebGL scenes (client-only):
//  • HeroCanvas  — the floating box that zigzags, snaps to center, and bursts
//                  in a blue "shining reveal". Plays on TOP during intro+morph.
//  • AgentCanvas — the GLB character on the staircase. Sits UNDERNEATH the
//                  whole time; the reveal fades the box out to uncover it.
const HeroCanvas = dynamic(() => import('@/components/HeroCanvas'), { ssr: false })
const AgentCanvas = dynamic(() => import('@/components/AgentCanvas'), { ssr: false })

interface PhaseStageProps {
  phase: number
  phaseProgress: number
}

// ────────────────────────────────────────────────────────────────────────────
//  THE 3D STAGE
//
//  intro  → box flies around, big name shows. Character stands at top of stairs
//           (hidden beneath the box).
//  morph  → box snaps to center and BURSTS (shining reveal). As it bursts, the
//           box layer fades out, uncovering the character already standing there.
//  data   → character walks down the full staircase to the desk.
//  shadows→ sits into the gaming chair (back-of-PC view, agent facing it).
//  fusion → heavy typing, live terminal feed.
//  cta    → relaxed sit-idle, Get Started pops up.
// ────────────────────────────────────────────────────────────────────────────

export default function PhaseStage({ phase, phaseProgress }: PhaseStageProps) {
  // The box owns phases 0 (intro) and 1 (morph). Map them to its 0→1 explode value.
  const heroProgress =
    phase === PHASE.intro ? phaseProgress * 0.15 // box mostly idle while title shows
    : phase === PHASE.morph ? 0.15 + phaseProgress * 0.85 // box snaps + bursts
    : 1

  // Box layer stays solid through the burst, then fades out over the last 40%
  // of the morph — that fade IS the reveal of the character beneath.
  const heroVisible = phase <= PHASE.morph
  const heroOpacity =
    phase < PHASE.morph ? 1
    : phase === PHASE.morph ? Math.max(0, 1 - Math.max(0, phaseProgress - 0.6) / 0.4)
    : 0

  // The staircase scene must NOT show on the first page. It stays fully hidden
  // through the intro, then fades IN as the box bursts (morph past ~50%), so the
  // reveal uncovers it. First page = pure black + name + flying box.
  const agentVisible = phase >= PHASE.morph
  const agentOpacity =
    phase < PHASE.morph ? 0
    : phase === PHASE.morph ? Math.min(1, Math.max(0, (phaseProgress - 0.25) / 0.25))
    : 1

  return (
    <div className="absolute inset-0 z-10">
      {/* Solid black backdrop so the intro never reveals the scene behind the box. */}
      <div className="absolute inset-0 bg-black" />

      {/* Base layer: the GLB character + staircase + desk. Hidden during intro,
          fades in on the burst. Only mounted once it's needed. */}
      {agentVisible && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: agentOpacity }}
        >
          <AgentCanvas phase={phase} phaseProgress={phaseProgress} />
        </div>
      )}

      {/* Overlay: the floating box / shining reveal, fades out to uncover it. */}
      {heroVisible && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{ opacity: heroOpacity }}
        >
          <HeroCanvas scrollProgress={heroProgress} />
        </div>
      )}

      {/* tiny phase read-out (temporary) */}
      <div className="pointer-events-none absolute bottom-4 left-4 font-mono text-[9px] uppercase tracking-[0.3em] text-acid/30">
        {PHASES[phase]?.id} · {(phaseProgress * 100).toFixed(0)}%
      </div>
    </div>
  )
}
