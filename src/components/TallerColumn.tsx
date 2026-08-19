import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { Talmid } from '../data/types'
import { HISTORIAL } from '../data/historial'
import type { HistorialHit } from '../utils/historialMatch'
import { TalmidCard } from './TalmidCard'

type KitaStyle = { bg: string; text: string; dot: string }

type Props = {
  tallerName: string
  tallerIndex: number
  talmidim: Array<{ talmid: Talmid; idx: number }>
  kitaColorMap: Map<string, KitaStyle>
  historialMap: Map<string, HistorialHit>
}

const DEFAULT_KITA_STYLE: KitaStyle = { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-400' }

function DraggableCard({
  talmid,
  tallerIndex,
  kitaStyle,
  historialHit,
}: {
  talmid: Talmid
  tallerIndex: number
  kitaStyle: KitaStyle
  historialHit?: HistorialHit | null
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: talmid.id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
    >
      <TalmidCard
        talmid={talmid}
        assignedTaller={tallerIndex}
        kitaStyle={kitaStyle}
        historialHit={historialHit}
      />
    </div>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Relojito con la lista de quiénes hicieron este taller en la etapa 1.
 * El tooltip va por portal con position fixed porque la columna tiene
 * overflow-y-auto y si no queda recortado.
 */
function HistorialTooltip({
  tallerIndex,
  repitenPorNombre,
}: {
  tallerIndex: number
  repitenPorNombre: Map<string, HistorialHit['confidence']>
}) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const pasados = HISTORIAL[tallerIndex] ?? []

  function show() {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const alto = Math.min(80 + pasados.length * 20, 420)
    const abajo = rect.bottom + 8 + alto < window.innerHeight
    setPos({
      top: abajo ? rect.bottom + 8 : Math.max(8, rect.top - 8 - alto),
      left: Math.min(rect.left, window.innerWidth - 250),
    })
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        onFocus={show}
        onBlur={() => setPos(null)}
        aria-label={`Ver los ${pasados.length} talmidim que hicieron este taller en la etapa 1`}
        className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
      >
        <ClockIcon />
      </button>

      {pos &&
        createPortal(
          <div
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
            className="pointer-events-none"
          >
            <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 w-[230px] max-h-[420px] overflow-hidden">
              <p className="text-xs font-semibold text-slate-500">
                Etapa 1 · {pasados.length} talmidim
              </p>
              {pasados.length === 0 ? (
                <p className="mt-1 text-[11px] text-slate-400 italic">Nadie registrado.</p>
              ) : (
                <ul className="mt-1.5 space-y-0.5">
                  {pasados.map((nombre) => {
                    const conf = repitenPorNombre.get(nombre)
                    return (
                      <li
                        key={nombre}
                        className={`text-[11px] leading-snug flex items-center gap-1 ${
                          conf ? 'text-rose-700 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        {conf && <span className="shrink-0">↻</span>}
                        <span className="truncate">{nombre}</span>
                        {conf === 'probable' && (
                          <span className="text-rose-400 shrink-0" title="match aproximado">
                            ?
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
              {repitenPorNombre.size > 0 && (
                <p className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-rose-600 leading-snug">
                  ↻ en rojo: vuelve a estar asignado acá.
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export function TallerColumn({
  tallerName,
  tallerIndex,
  talmidim,
  kitaColorMap,
  historialMap,
}: Props) {
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

  // Quiénes de los asignados acá ya habían hecho este mismo taller.
  const repitenPorNombre = new Map<string, HistorialHit['confidence']>()
  for (const { talmid } of talmidim) {
    const hit = historialMap.get(talmid.id)
    if (hit && hit.tallerIndex === tallerIndex) repitenPorNombre.set(hit.nombre, hit.confidence)
  }

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col transition-colors ${
        isOver ? 'border-blue-400 ring-2 ring-blue-300' : 'border-slate-200'
      }`}
    >
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 text-sm leading-tight">{tallerName}</h3>
          <HistorialTooltip tallerIndex={tallerIndex} repitenPorNombre={repitenPorNombre} />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-xs text-slate-500">{talmidim.length} talmidim</span>
          <span className="text-xs font-mono text-slate-600">
            promedio {avg.toFixed(2)}/5
          </span>
        </div>
        {repitenPorNombre.size > 0 && (
          <div className="mt-1.5 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 inline-block">
            ↻ {repitenPorNombre.size}{' '}
            {repitenPorNombre.size === 1 ? 'repite de la etapa 1' : 'repiten de la etapa 1'}
          </div>
        )}
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
              historialHit={historialMap.get(talmid.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
