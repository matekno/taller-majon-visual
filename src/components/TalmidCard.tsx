import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TALLERES } from '../data/types'
import type { Talmid } from '../data/types'
import { scoreColor } from '../utils/colors'
import type { HistorialHit } from '../utils/historialMatch'

type KitaStyle = { bg: string; text: string; dot: string }

type Props = {
  talmid: Talmid
  assignedTaller: number
  kitaStyle: KitaStyle
  historialHit?: HistorialHit | null
}

export function TalmidCard({ talmid, assignedTaller, kitaStyle, historialHit }: Props) {
  const score = talmid.scores[assignedTaller] || 0
  const color = scoreColor(score)
  const cardRef = useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)

  // Repite solo si el taller de la etapa 1 es este mismo.
  const repite = historialHit != null && historialHit.tallerIndex === assignedTaller
  const dudoso = repite && historialHit.confidence === 'probable'

  function handleMouseEnter() {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const tooltipH = historialHit ? 300 : 260
    const showBelow = rect.bottom + 8 + tooltipH < window.innerHeight
    setTooltipPos({
      top: showBelow ? rect.bottom + 8 : rect.top - 8 - tooltipH,
      left: Math.min(rect.left, window.innerWidth - 220),
    })
  }

  function handleMouseLeave() {
    setTooltipPos(null)
  }

  return (
    <div ref={cardRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div
        className={`flex items-center gap-2 rounded-lg border bg-white px-2 py-1.5 hover:shadow-sm transition-shadow ${
          repite ? 'border-rose-300 border-l-4 border-l-rose-500 bg-rose-50/50' : 'border-slate-200'
        }`}
      >
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${color.bg} ${color.text} text-xs font-bold ring-2 ${color.ring} ring-offset-1 shrink-0`}
        >
          {score || '–'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-slate-900 truncate">{talmid.nombre}</span>
            {repite && (
              <span
                title={
                  dudoso
                    ? `Posible repetido: "${historialHit.nombre}" en la etapa 1`
                    : 'Ya hizo este taller en la etapa 1'
                }
                className={`shrink-0 text-[10px] font-bold leading-none px-1 py-0.5 rounded ${
                  dudoso
                    ? 'text-rose-600 border border-rose-400 border-dashed'
                    : 'text-white bg-rose-600'
                }`}
              >
                ↻{dudoso ? '?' : ''}
              </span>
            )}
          </div>
          <div
            className={`inline-flex items-center gap-1 text-xs ${kitaStyle.text} ${kitaStyle.bg} px-1.5 py-0.5 rounded`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${kitaStyle.dot}`} />
            {talmid.kita}
          </div>
        </div>
      </div>

      {tooltipPos &&
        createPortal(
          <div
            style={{ position: 'fixed', top: tooltipPos.top, left: tooltipPos.left, zIndex: 9999 }}
            className="pointer-events-none"
          >
            <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 min-w-[200px]">
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Puntajes</p>
              <ul className="space-y-1">
                {TALLERES.map((nombre, i) => {
                  const s = talmid.scores[i] || 0
                  const c = scoreColor(s)
                  const fueAca = historialHit?.tallerIndex === i
                  return (
                    <li key={nombre} className="flex items-center justify-between gap-3">
                      <span
                        className={`text-xs leading-tight ${
                          fueAca ? 'text-rose-700 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {fueAca && '↻ '}
                        {nombre}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${c.bg} ${c.text} text-[10px] font-bold ring-1 ${c.ring} shrink-0`}
                      >
                        {s || '–'}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {historialHit && (
                <p
                  className={`mt-2 pt-2 border-t border-slate-100 text-[11px] leading-snug ${
                    repite ? 'text-rose-700 font-medium' : 'text-slate-500'
                  }`}
                >
                  Etapa 1: {TALLERES[historialHit.tallerIndex]}
                  {historialHit.confidence === 'probable' && (
                    <span className="block text-slate-400 italic">
                      match aproximado con "{historialHit.nombre}"
                    </span>
                  )}
                </p>
              )}
              {talmid.comentario && (
                <p className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic leading-snug">
                  "{talmid.comentario}"
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
