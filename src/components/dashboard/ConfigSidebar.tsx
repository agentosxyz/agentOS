'use client'

import { useId } from 'react'
import { useAccount } from 'wagmi'
import { useDashboardState } from '@/hooks/dashboard/useDashboardState'

// Spec §4: vertical right-rail panel where the human controls the AI.
// Allocated Capital, Risk Per Trade, Hard Stop-Loss (Drawdown), and the
// signature Deploy button. Disabled until a wallet is connected and a
// non-zero capital is entered.
export default function ConfigSidebar() {
  const { isConnected } = useAccount()
  const {
    allocatedCapital,
    riskPerTrade,
    maxDrawdownPct,
    lifecycle,
    setAllocatedCapital,
    setRiskPerTrade,
    setMaxDrawdownPct,
    deployAgent,
  } = useDashboardState()

  const capitalId = useId()
  const riskId = useId()
  const ddId = useId()

  const canDeploy = isConnected && allocatedCapital > 0 && lifecycle === 'idle'
  const isLive = lifecycle === 'active' || lifecycle === 'paused'

  return (
    <aside className="flex h-full flex-col gap-4 border-l border-line bg-surface-1 p-4">
      {/* Panel header — Spec §1.2: 32px header bar with bottom border */}
      <div className="flex h-8 items-center justify-between border-b border-line pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
          Agent Configuration
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-fade">
          v1.0
        </span>
      </div>

      {/* 4.1 Allocated Capital */}
      <div className="flex flex-col gap-2">
        <label htmlFor={capitalId} className="text-[11px] text-ink-dim">
          Allocated Capital{' '}
          <span className="text-ink-mute">(Mock USDT)</span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-ink-mute">
            $
          </span>
          <input
            id={capitalId}
            type="number"
            min={0}
            step={100}
            placeholder="0.00"
            disabled={isLive}
            value={allocatedCapital === 0 ? '' : allocatedCapital}
            onChange={(e) => setAllocatedCapital(Number(e.target.value))}
            className="h-10 w-full rounded-md border border-line bg-surface-0 pl-7 pr-14 font-mono text-[13px] text-ink outline-none transition focus:border-acid focus:ring-1 focus:ring-acid disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            disabled={isLive}
            onClick={() => setAllocatedCapital(10_000)}
            className="absolute right-2 top-1/2 flex h-6 -translate-y-1/2 items-center rounded bg-acid/15 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-acid transition hover:bg-acid/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Max
          </button>
        </div>
      </div>

      {/* 4.2 Risk Per Trade */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor={riskId} className="text-[11px] text-ink-dim">
            Risk Per Trade
          </label>
          <span className="font-mono text-[11px] text-acid">
            [ {riskPerTrade.toFixed(1)}% ]
          </span>
        </div>
        <div className="relative flex h-4 items-center">
          {/* Track */}
          <div className="absolute inset-x-0 h-1 rounded-full bg-line" />
          {/* Fill */}
          <div
            className="absolute left-0 h-1 rounded-full bg-acid"
            style={{ width: `${((riskPerTrade - 0.1) / (5.0 - 0.1)) * 100}%` }}
          />
          <input
            id={riskId}
            type="range"
            min={0.1}
            max={5.0}
            step={0.1}
            disabled={isLive}
            value={riskPerTrade}
            onChange={(e) => setRiskPerTrade(Number(e.target.value))}
            className="risk-slider relative z-10 h-4 w-full appearance-none bg-transparent disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex justify-between font-mono text-[9px] text-ink-fade">
          <span>0.1%</span>
          <span>5.0%</span>
        </div>
      </div>

      {/* 4.3 Hard Stop-Loss */}
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={ddId} className="text-[11px] text-ink-dim">
          Hard Stop-Loss <span className="text-ink-mute">(Drawdown)</span>
        </label>
        <div className="relative">
          <input
            id={ddId}
            type="number"
            min={1}
            max={100}
            disabled={isLive}
            value={maxDrawdownPct}
            onChange={(e) => setMaxDrawdownPct(Number(e.target.value))}
            className="h-9 w-20 rounded-md border border-line bg-surface-0 pl-2 pr-6 font-mono text-[12px] text-ink outline-none transition focus:border-acid focus:ring-1 focus:ring-acid disabled:cursor-not-allowed disabled:opacity-60"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-mute">
            %
          </span>
        </div>
      </div>

      {/* Spacer pushes Deploy to the bottom */}
      <div className="flex-1" />

      {/* Pre-flight readouts so the user can sanity-check before deploy */}
      <div className="rounded-md border border-line bg-surface-0/60 p-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-ink-mute">
          <span>Pre-flight</span>
          <span className={isConnected ? 'text-profit' : 'text-loss'}>
            {isConnected ? 'Wallet OK' : 'Wallet —'}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <span className="text-ink-mute">Position size</span>
          <span className="text-right font-mono text-ink">
            ${(allocatedCapital * (riskPerTrade / 100)).toFixed(2)}
          </span>
          <span className="text-ink-mute">Kill at</span>
          <span className="text-right font-mono text-loss">
            -${(allocatedCapital * (maxDrawdownPct / 100)).toFixed(2)}
          </span>
        </div>
      </div>

      {/* 4.4 Deploy Agent — the headline CTA */}
      <button
        type="button"
        disabled={!canDeploy}
        onClick={deployAgent}
        className={`group flex h-12 w-full items-center justify-center gap-2 rounded-md text-[14px] font-bold tracking-tight transition ${
          isLive
            ? 'bg-surface-3 text-ink-fade cursor-not-allowed'
            : canDeploy
              ? 'bg-gradient-to-b from-[#84CC16] to-[#65A30D] text-black hover:from-acid hover:to-[#84CC16] hover:shadow-deploy'
              : 'bg-surface-3 text-ink-fade cursor-not-allowed'
        }`}
      >
        {isLive ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-acid/60 animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-acid" />
            </span>
            AGENT LIVE
          </>
        ) : (
          <>DEPLOY AGENT</>
        )}
      </button>

      {!isConnected && (
        <p className="-mt-2 text-center text-[10px] text-ink-fade">
          Connect a wallet to enable deploy
        </p>
      )}

      <style jsx>{`
        .risk-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
          cursor: pointer;
          border: 2px solid #a3e635;
        }
        .risk-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
          cursor: pointer;
          border: 2px solid #a3e635;
        }
      `}</style>
    </aside>
  )
}
