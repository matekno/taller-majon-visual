import type { Talmid, Assignment } from '../data/types'
import type { ObjectiveBreakdown } from '../algorithm/objective'

type Props = {
  talmidim: Talmid[]
  assignment: Assignment
  breakdown: ObjectiveBreakdown
}

export function StatsPanel({ talmidim, assignment, breakdown }: Props) {
  let green = 0
  let yellow = 0
  let red = 0
  for (let i = 0; i < talmidim.length; i++) {
    const score = talmidim[i].scores[assignment[i]] || 0
    if (score >= 4) green++
    else if (score === 3) yellow++
    else red++
  }
  const total = talmidim.length || 1

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
        Resumen global
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Beneficiados" value={`${green}`} subtitle={`${pct(green, total)}%`} tone="green" />
        <Stat label="Neutrales" value={`${yellow}`} subtitle={`${pct(yellow, total)}%`} tone="yellow" />
        <Stat label="Perjudicados" value={`${red}`} subtitle={`${pct(red, total)}%`} tone="red" />
        <Stat
          label="Score total"
          value={(breakdown.total * 100).toFixed(1)}
          subtitle={`P:${(breakdown.pref * 100).toFixed(0)} · E:${(breakdown.eq * 100).toFixed(0)} · M:${(breakdown.mix * 100).toFixed(0)}`}
          tone="neutral"
        />
      </div>
    </div>
  )
}

function pct(n: number, total: number): string {
  return ((n / total) * 100).toFixed(0)
}

const TONE_BG: Record<string, string> = {
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  red: 'bg-rose-50 border-rose-200 text-rose-900',
  neutral: 'bg-slate-50 border-slate-200 text-slate-900',
}

function Stat({
  label,
  value,
  subtitle,
  tone,
}: {
  label: string
  value: string
  subtitle: string
  tone: 'green' | 'yellow' | 'red' | 'neutral'
}) {
  return (
    <div className={`rounded-lg border p-2.5 ${TONE_BG[tone]}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70 font-semibold">{label}</div>
      <div className="text-2xl font-bold leading-tight">{value}</div>
      <div className="text-xs opacity-70 font-mono">{subtitle}</div>
    </div>
  )
}
