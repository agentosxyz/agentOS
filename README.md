# Agent.OS — 3D Cinematic Landing Page

Full Next.js 14 project with React Three Fiber, proper gold chrome 3D mannequin, scroll-driven hero animation.

## Stack
- Next.js 14 (App Router)
- React Three Fiber + Drei
- Three.js
- GSAP (optional, scroll handled natively)
- Bebas Neue + DM Mono (Google Fonts)

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What's Inside

| File | Description |
|------|-------------|
| `components/Mannequin.tsx` | Gold chrome procedural mannequin built from Three.js primitives |
| `components/HeroCanvas.tsx` | Hero scene — glowing box that explodes to reveal mannequin on scroll |
| `components/SceneCanvases.tsx` | 4 scene canvases: Perception, Decision, Execution, Risk |
| `app/page.tsx` | Main page with scroll tracking + all scenes |
| `app/globals.css` | Full design system (black + #c8ff00 acid green) |

## Scenes

1. **Hero** — Dark void. Glowing 3D box glides/rotates. On scroll: box shatters into fragments, gold mannequin assembles.
2. **Perception** — Mannequin standing with radar rings above head. Live candle chart floating right.
3. **Decision** — Mannequin seated at desk. Bitget-style screen. Thought cloud materializes upper right.
4. **Execution** — Head + hands above gaming chair backrest. Three trading screens glowing. Center screen pulses on "ORDER FILLED".
5. **Risk + Exit** — Orbital rig with metric nodes (SL, TP, Entry, MaxDD, Sharpe) spinning around gold sphere.

## Colors
- Background: `#000`
- Accent: `#c8ff00` (acid green)  
- Gold: `#c8920a`, `#d4a017`, `#f5c842`
- Danger: `#ff3c3c`
- Safe: `#3cff88`

## Fonts
- Display: Bebas Neue
- Data/Mono: DM Mono
