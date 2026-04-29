import { TALLERES } from '../data/types'
import type { Talmid } from '../data/types'
import { scoreColor } from '../utils/colors'

type KitaStyle = { bg: string; text: string; dot: string }

type Props = {
  talmid: Talmid
  assignedTaller: number
  kitaStyle: KitaStyle
}

export function TalmidCard({ talmid, assignedTaller, kitaStyle }: Props) {
  const score = talmid.scores[assignedTaller] || 0
  const color = scoreColor(score)
  return (
    <div className="relative group">
      <div
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 hover:shadow-sm transition-shadow"
      >
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${color.bg} ${color.text} text-xs font-bold ring-2 ${color.ring} ring-offset-1 shrink-0`}
        >
          {score || '–'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-900 truncate">{talmid.nombre}</div>
          <div
            className={`inline-flex items-center gap-1 text-xs ${kitaStyle.text} ${kitaStyle.bg} px-1.5 py-0.5 rounded`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${kitaStyle.dot}`} />
            {talmid.kita}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 min-w-[200px]">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">Puntajes</p>
          <ul className="space-y-1">
            {TALLERES.map((nombre, i) => {
              const s = talmid.scores[i] || 0
              const c = scoreColor(s)
              return (
                <li key={nombre} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-700 leading-tight">{nombre}</span>
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${c.bg} ${c.text} text-[10px] font-bold ring-1 ${c.ring} shrink-0`}
                  >
                    {s || '–'}
                  </span>
                </li>
              )
            })}
          </ul>
          {talmid.comentario && (
            <p className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic leading-snug">
              "{talmid.comentario}"
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
