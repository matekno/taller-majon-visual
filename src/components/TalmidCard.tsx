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
    <div
      className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 hover:shadow-sm transition-shadow`}
      title={`Puntaje en este taller: ${score}/5`}
    >
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${color.bg} ${color.text} text-xs font-bold ring-2 ${color.ring} ring-offset-1`}
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
  )
}
