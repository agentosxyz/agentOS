'use client'

import HeaderBar from './HeaderBar'
import AgentViewport from './AgentViewport'
import ReasoningTerminal from './ReasoningTerminal'
import SMCChart from './SMCChart'
import PositionsLedger from './PositionsLedger'
import ControlStrip from './ControlStrip'
import ConfigSidebar from './ConfigSidebar'

// Spec §1–§7 layout map:
//   [Header h-16, full width                                           ]
//   [3D Viewport ~58%        | Intel Feeds (Term + Chart)  | Config 320]
//   [Positions & Performance Ledger — full width                       ]
//   [Emergency Action Bar h-14                                         ]
export default function DashboardShell() {
  return (
    <main className="grid h-screen w-full grid-rows-[64px_minmax(0,1fr)_auto_56px] bg-surface-0 text-ink">
      <HeaderBar />

      <section className="grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(480px,1.25fr)_320px]">
        <AgentViewport />
        <div className="grid min-h-0 grid-rows-[minmax(0,0.8fr)_minmax(0,1.4fr)] border-l border-line">
          <ReasoningTerminal />
          <SMCChart />
        </div>
        <ConfigSidebar />
      </section>

      <PositionsLedger />
      <ControlStrip />
    </main>
  )
}
