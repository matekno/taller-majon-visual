import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { Talmid } from '../data/types'
import { TalmidCard } from './TalmidCard'

type KitaStyle = { bg: string; text: string; dot: string }

type Props = {
  tallerName: string
  tallerIndex: number
  talmidim: Array<{ talmid: Talmid; idx: number }>
  kitaColorMap: Map<string, KitaStyle>
}

const DEFAULT_KITA_STYLE: KitaStyle = { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-400' }

function DraggableCard({
  talmid,
  tallerIndex,
  kitaStyle,
}: {
  talmid: Talmid
  tallerIndex: number
  kitaStyle: KitaStyle
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: talmid.id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
    >
      <TalmidCard talmid={talmid} assignedTaller={tallerIndex} kitaStyle={kitaStyle} />
    </div>
  )
}

export function TallerColumn({ tallerName, tallerIndex, talmidim, kitaColorMap }: Props) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: String(tallerIndex) })

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
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col transition-colors ${
        isOver ? 'border-blue-400 ring-2 ring-blue-300' : 'border-slate-200'
      }`}
    >
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
      <div
        ref={setDropRef}
        className={`p-2 space-y-1.5 flex-1 overflow-y-auto min-h-[60px] transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        {sortedTalmidim.length === 0 ? (
          <p className="text-xs text-slate-400 italic px-2 py-4 text-center">Sin talmidim</p>
        ) : (
          sortedTalmidim.map(({ talmid }) => (
            <DraggableCard
              key={talmid.id}
              talmid={talmid}
              tallerIndex={tallerIndex}
              kitaStyle={kitaColorMap.get(talmid.kita) ?? DEFAULT_KITA_STYLE}
            />
          ))
        )}
      </div>
    </div>
  )
}
