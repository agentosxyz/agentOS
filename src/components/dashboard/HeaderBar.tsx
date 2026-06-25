'use client'

import { useDashboardState } from '@/hooks/dashboard/useDashboardState'
import TickerStream from './TickerStream'
import WalletHub from './WalletHub'

// Spec §2: top header h-16. Left = brand, center = system-status text,
// right = wallet + equity. The center used to host the ticker; per spec it
// now hosts the status text. The ticker is folded into the wallet/equity
// rail as a quiet auxiliary row (no real feed yet, so it stays muted).
export default function HeaderBar() {
  const { active, paused, terminated, allocatedCapital, cumulativePnl } = useDashboardState()

  const statusText = terminated
    ? 'Agent terminated'
    : paused
      ? 'Perception paused'
      : active
        ? 'Processing live data'
        : 'Awaiting market feed'

  const ellipsisOn = active

  return (
    <header className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-6 border-b border-line bg-surface-1 px-6">
      {/* 2.1 Brand */}
      <a
        href="/dashboard"
        className="flex items-center gap-3"
        onClick={(e) => {
          // Spec §2.1: clicking the brand acts as a hard reload of the
          // dashboard frontend state. Soft nav would preserve client state.
          e.preventDefault()
          window.location.reload()
        }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1e293b] ring-1 ring-[#475569]/40">
          <span className="text-[14px] font-extrabold leading-none text-acid">A</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[18px] font-bold tracking-tight text-ink">Agent.OS</span>
          <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-fade">
            v1.0.0 · paper
          </span>
        </div>
      </a>

      {/* 2.2 System Status — center */}
      <div className="flex items-center justify-center">
        <span
          className={`font-mono text-[12px] tracking-wide ${
            ellipsisOn ? 'ellipsis-anim text-ink-mute' : 'text-ink-fade'
          }`}
        >
          {statusText}
        </span>
      </div>

      {/* 2.3 Wallet + Equity */}
      <div className="flex items-center gap-3">
        <div className="hidden xl:block">
          <TickerStream />
        </div>
        <EquityTile capital={allocatedCapital} pnl={cumulativePnl} />
        <WalletHub />
      </div>
    </header>
  )
}

// Spec §2.3: equity = allocated capital + cumulative PNL, recomputed every
// simulated tick. Color subtly shifts with PNL sign so the user gets a
// peripheral read on performance without looking down at the cards.
function EquityTile({ capital, pnl }: { capital: number; pnl: number }) {
  const equity = capital + pnl
  const display = capital > 0
    ? `$${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'
  const tone = capital === 0 ? 'text-ink' : pnl > 0 ? 'text-profit' : pnl < 0 ? 'text-loss' : 'text-ink'
  return (
    <div className="flex h-10 flex-col items-end justify-center rounded-xl border border-line bg-surface-1 px-3.5 leading-none">
      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-acid">Equity</span>
      <span className={`mt-1 font-mono text-[13px] font-semibold ${tone}`}>{display}</span>
    </div>
  )
}
