'use client'

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'

// Lifecycle (Spec §4.4 / §7.4):
//   idle       — no Deploy yet; sidebar configurable; 3D agent sits idle
//   active     — Deploy pressed; mock feeds running; 3D agent typing
//   paused     — pause perception; feeds halt; 3D back to idle; PNL frozen
//   terminated — kill switch; feeds stop permanently; 3D frozen "dead" frame
export type AgentLifecycle = 'idle' | 'active' | 'paused' | 'terminated'

interface DashboardState {
  // Lifecycle
  lifecycle: AgentLifecycle
  // Configuration (Spec §4.1–§4.3)
  allocatedCapital: number     // mock USDT
  riskPerTrade: number          // percent, 0.1..5.0
  maxDrawdownPct: number        // percent, kill-switch threshold
  // Counters consumed by mock generators / terminal to re-seed or clear
  resetNonce: number
  flushNonce: number
}

type Action =
  | { type: 'SET_CAPITAL'; value: number }
  | { type: 'SET_RISK'; value: number }
  | { type: 'SET_DRAWDOWN'; value: number }
  | { type: 'DEPLOY' }
  | { type: 'TOGGLE_PAUSED' }
  | { type: 'TERMINATE' }
  | { type: 'FLUSH' }
  | { type: 'RESET' }

const initial: DashboardState = {
  lifecycle: 'idle',
  allocatedCapital: 0,
  riskPerTrade: 1.0,
  maxDrawdownPct: 10,
  resetNonce: 0,
  flushNonce: 0,
}

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'SET_CAPITAL':
      return { ...state, allocatedCapital: Math.max(0, action.value) }
    case 'SET_RISK':
      return { ...state, riskPerTrade: clamp(action.value, 0.1, 5.0) }
    case 'SET_DRAWDOWN':
      return { ...state, maxDrawdownPct: clamp(action.value, 1, 100) }
    case 'DEPLOY':
      // Only deploy from idle; ignored otherwise so the button can stay wired
      // to the same handler regardless of state.
      if (state.lifecycle !== 'idle') return state
      return { ...state, lifecycle: 'active' }
    case 'TOGGLE_PAUSED':
      if (state.lifecycle === 'active') return { ...state, lifecycle: 'paused' }
      if (state.lifecycle === 'paused') return { ...state, lifecycle: 'active' }
      return state
    case 'TERMINATE':
      // Toggle: terminate when running, reset to idle when already terminated.
      return {
        ...state,
        lifecycle: state.lifecycle === 'terminated' ? 'idle' : 'terminated',
      }
    case 'FLUSH':
      return { ...state, flushNonce: state.flushNonce + 1 }
    case 'RESET':
      // Spec §7.3: hard reset — capital input clears, PNL resets, lifecycle
      // back to idle so Deploy can be pressed again.
      return {
        ...initial,
        resetNonce: state.resetNonce + 1,
        flushNonce: state.flushNonce + 1,
      }
    default:
      return state
  }
}

function clamp(v: number, lo: number, hi: number) {
  if (Number.isNaN(v)) return lo
  return Math.min(hi, Math.max(lo, v))
}

interface DashboardContextValue extends DashboardState {
  // Derived booleans used by panels — cheaper than recomputing everywhere.
  paused: boolean
  terminated: boolean
  active: boolean
  // Actions
  setAllocatedCapital: (v: number) => void
  setRiskPerTrade: (v: number) => void
  setMaxDrawdownPct: (v: number) => void
  deployAgent: () => void
  togglePaused: () => void
  terminate: () => void
  flushLogs: () => void
  resetSimulation: () => void
}

const Ctx = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)

  const setAllocatedCapital = useCallback((value: number) => dispatch({ type: 'SET_CAPITAL', value }), [])
  const setRiskPerTrade = useCallback((value: number) => dispatch({ type: 'SET_RISK', value }), [])
  const setMaxDrawdownPct = useCallback((value: number) => dispatch({ type: 'SET_DRAWDOWN', value }), [])
  const deployAgent = useCallback(() => dispatch({ type: 'DEPLOY' }), [])
  const togglePaused = useCallback(() => dispatch({ type: 'TOGGLE_PAUSED' }), [])
  const terminate = useCallback(() => dispatch({ type: 'TERMINATE' }), [])
  const flushLogs = useCallback(() => dispatch({ type: 'FLUSH' }), [])
  const resetSimulation = useCallback(() => dispatch({ type: 'RESET' }), [])

  const value = useMemo<DashboardContextValue>(
    () => ({
      ...state,
      paused: state.lifecycle === 'paused',
      terminated: state.lifecycle === 'terminated',
      active: state.lifecycle === 'active',
      setAllocatedCapital,
      setRiskPerTrade,
      setMaxDrawdownPct,
      deployAgent,
      togglePaused,
      terminate,
      flushLogs,
      resetSimulation,
    }),
    [
      state,
      setAllocatedCapital,
      setRiskPerTrade,
      setMaxDrawdownPct,
      deployAgent,
      togglePaused,
      terminate,
      flushLogs,
      resetSimulation,
    ],
  )

  return createElement(Ctx.Provider, { value }, children)
}

export function useDashboardState(): DashboardContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDashboardState must be used within DashboardProvider')
  return v
}
