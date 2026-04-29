import type { Talmid } from '../data/types'
import { TalmidCard } from './TalmidCard'

type KitaStyle = { bg: string; text: string; dot: string }

type Props = {
  tallerName: string
  tallerIndex: number
  talmidim: Array<{ talmid: Talmid; idx: number }>
  kitaColorMap: Map<string, KitaStyle>
}

export function TallerColumn({ tallerName, tallerIndex, talmidim, kitaColorMap }: Props) {
  const sortedTalmidim = [...talmidim].sort((a, b) => {
    const sa = a.talmid.scores[tallerIndex] || 0
    const sb = b.talmid.scores[tallerIndex] || 0
    return sb - sa
  })

  const avg = talmidim.length
    ? talmidim.reduce((acc, t) => acc + (t.talmid.scores[tallerIndex] || 0), 0) / talmidim.length
    : 0

  const kitaCounts = new Map<string, number>()
  for (const { talmid } of talmidim) {
    kitaCounts.set(talmid.kita, (kitaCounts.get(talmid.kita) || 0) + 1)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800 text-sm leading-tight">{tallerName}</h3>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-xs text-slate-500">{talmidim.length} talmidim</span>
          <span className="text-xs font-mono text-slate-600">
            promedio {avg.toFixed(2)}/5
          </span>
        </div>
        {kitaCounts.size > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Array.from(kitaCounts.entries()).map(([kita, count]) => {
              const style = kitaColorMap.get(kita)
              if (!style) return null
              return (
                <span
                  key={kita}
                  className={`text-[10px] ${style.bg} ${style.text} px-1.5 py-0.5 rounded`}
                >
                  {kita} · {count}
                </span>
              )
            })}
          </div>
        )}
      </div>
      <div className="p-2 space-y-1.5 flex-1 overflow-y-auto">
        {sortedTalmidim.length === 0 ? (
          <p className="text-xs text-slate-400 italic px-2 py-4 text-center">Sin talmidim</p>
        ) : (
          sortedTalmidim.map(({ talmid }) => {
            const kitaStyle = kitaColorMap.get(talmid.kita) || {
              bg: 'bg-slate-100',
              text: 'text-slate-800',
              dot: 'bg-slate-400',
            }
            return (
              <TalmidCard
                key={talmid.id}
                talmid={talmid}
                assignedTaller={tallerIndex}
                kitaStyle={kitaStyle}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
