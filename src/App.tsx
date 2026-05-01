import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { TALLERES } from './data/types'
import type { Talmid, Weights, Assignment } from './data/types'
import { fetchTalmidim, SHEET_ID } from './data/fetchSheet'
import { solveAssignment } from './algorithm/assign'
import { evaluate } from './algorithm/objective'
import { WeightsPanel } from './components/WeightsPanel'
import { TallerColumn } from './components/TallerColumn'
import { TalmidCard } from './components/TalmidCard'
import { StatsPanel } from './components/StatsPanel'
import { SaveLoadPanel } from './components/SaveLoadPanel'
import { ReportPage } from './components/ReportPage'
import { buildKitaColorMap } from './utils/colors'
import { encodeConfig, decodeConfig, buildReconciled } from './utils/configCode'
import type { SavedConfig } from './utils/configCode'

const DEFAULT_KITA_STYLE = { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-400' }

const DEFAULT_WEIGHTS: Weights = { preferencia: 70, equidad: 20, mezclaKitot: 70 }

function readConfigFromHash(): SavedConfig | null {
  const hash = window.location.hash
  if (!hash.startsWith('#c=')) return null
  return decodeConfig(hash.slice(3))
}

function isReportRoute(): boolean {
  return window.location.pathname.replace(/\/+$/, '').endsWith('/reporte')
}

function homePath(): string {
  const path = window.location.pathname
  if (!isReportRoute()) return path.endsWith('/') ? path : `${path}/`
  const base = path.replace(/\/?reporte\/?$/, '/')
  return base || '/'
}

function reportPath(): string {
  const base = homePath()
  return base.endsWith('/') ? `${base}reporte` : `${base}/reporte`
}

export default function App() {
  if (isReportRoute()) return <ReportPage homePath={homePath()} />
  return <AssignmentApp />
}

function AssignmentApp() {
  const [talmidim, setTalmidim] = useState<Talmid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [assignment, setAssignment] = useState<Assignment>([])
  const warmStartRef = useRef<Assignment>([])
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [savedConfig, setSavedConfig] = useState<SavedConfig | null>(readConfigFromHash)
  const [showPanel, setShowPanel] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragStart({ active }: DragStartEvent) {
    setActiveDragId(String(active.id))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDragId(null)
    if (!over) return
    const talmidIdx = talmidim.findIndex((t) => t.id === active.id)
    if (talmidIdx === -1) return
    const newTaller = Number(over.id)
    if (assignment[talmidIdx] === newTaller) return
    const next = [...assignment]
    next[talmidIdx] = newTaller
    warmStartRef.current = next
    setAssignment(next)
    // Pin the dragged talmid to the new position in the saved config
    if (savedConfig) {
      const t = talmidim[talmidIdx]
      setSavedConfig({ ...savedConfig, [`${t.nombre}|${t.kita}`]: newTaller })
    }
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTalmidim()
      setTalmidim(data)
      setLastFetch(new Date())
      warmStartRef.current = []
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (talmidim.length === 0) {
      setAssignment([])
      return
    }
    let warmStart: Assignment | undefined
    let pinned: boolean[] | undefined

    if (savedConfig) {
      const reconciled = buildReconciled(talmidim, savedConfig)
      warmStart = reconciled.warmStart
      pinned = reconciled.pinned
    } else {
      warmStart =
        warmStartRef.current.length === talmidim.length ? warmStartRef.current : undefined
    }

    const handle = setTimeout(() => {
      const newAssignment = solveAssignment(talmidim, weights, { warmStart, pinned, seed: 42 })
      warmStartRef.current = newAssignment
      setAssignment(newAssignment)
    }, 50)
    return () => clearTimeout(handle)
  }, [talmidim, weights, savedConfig])

  const breakdown = useMemo(
    () => evaluate(talmidim, assignment, weights),
    [talmidim, assignment, weights],
  )

  const kitaColorMap = useMemo(
    () => buildKitaColorMap(talmidim.map((t) => t.kita)),
    [talmidim],
  )

  const groupedByTaller = useMemo(() => {
    const groups: Array<Array<{ talmid: Talmid; idx: number }>> = TALLERES.map(() => [])
    for (let i = 0; i < talmidim.length; i++) {
      const taller = assignment[i]
      if (taller != null) groups[taller].push({ talmid: talmidim[i], idx: i })
    }
    return groups
  }, [talmidim, assignment])

  function handleSave() {
    if (talmidim.length === 0) return
    const code = encodeConfig(talmidim, assignment)
    window.location.hash = `#c=${code}`
    setSavedConfig(decodeConfig(code))
    setShowPanel(true)
  }

  function handleLoadConfig(config: SavedConfig) {
    setSavedConfig(config)
    warmStartRef.current = []
  }

  function handleClearConfig() {
    setSavedConfig(null)
    warmStartRef.current = []
    window.location.hash = ''
  }

  const saveCode = talmidim.length > 0 ? encodeConfig(talmidim, assignment) : ''
  const saveUrl = talmidim.length > 0
    ? `${window.location.origin}${window.location.pathname}#c=${saveCode}`
    : ''

  return (
    <div className="min-h-full p-4 md:p-6 max-w-[1600px] mx-auto space-y-4">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Asignador de Talleres
          </h1>
          <p className="text-sm text-slate-600">
            Algoritmo en vivo basado en preferencias, equidad y mezcla de kitot.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedConfig && (
            <span className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Config cargada
              <button
                onClick={handleClearConfig}
                className="ml-0.5 text-emerald-500 hover:text-emerald-800 leading-none"
                title="Limpiar configuración"
              >
                ×
              </button>
            </span>
          )}
          <a
            href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Ver sheet
          </a>
          <a
            href={reportPath()}
            className="px-3 py-1.5 text-sm bg-white text-slate-700 rounded-lg hover:bg-slate-100 border border-slate-200"
          >
            Reporte
          </a>
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 disabled:opacity-50"
          >
            {loading ? 'Cargando…' : 'Refrescar datos'}
          </button>
          <button
            onClick={() => setShowPanel(true)}
            className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 border border-slate-200"
          >
            Cargar config
          </button>
          <button
            onClick={handleSave}
            disabled={talmidim.length === 0}
            className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-sm">
          Error al leer el sheet: {error}
        </div>
      )}

      {lastFetch && (
        <div className="text-xs text-slate-500">
          {talmidim.length} respuestas · última actualización {lastFetch.toLocaleTimeString()}
        </div>
      )}

      <WeightsPanel weights={weights} onChange={setWeights} />

      {talmidim.length > 0 && (
        <StatsPanel talmidim={talmidim} assignment={assignment} breakdown={breakdown} />
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {TALLERES.map((nombre, i) => (
            <TallerColumn
              key={nombre}
              tallerName={nombre}
              tallerIndex={i}
              talmidim={groupedByTaller[i] || []}
              kitaColorMap={kitaColorMap}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeDragId ? (() => {
            const t = talmidim.find((t) => t.id === activeDragId)
            if (!t) return null
            const taller = assignment[talmidim.indexOf(t)] ?? 0
            return (
              <div className="rotate-1 shadow-2xl scale-105 cursor-grabbing">
                <TalmidCard
                  talmid={t}
                  assignedTaller={taller}
                  kitaStyle={kitaColorMap.get(t.kita) ?? DEFAULT_KITA_STYLE}
                />
              </div>
            )
          })() : null}
        </DragOverlay>
      </DndContext>

      {!loading && talmidim.length === 0 && !error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm text-center">
          El sheet no tiene respuestas todavía.
        </div>
      )}

      <footer className="pt-6 text-xs text-slate-400 text-center">
        Verde: 4-5 (top elección) · Amarillo: 3 (neutral) · Rojo: 1-2 (perjudicado)
      </footer>

      {showPanel && (
        <SaveLoadPanel
          currentUrl={saveUrl}
          currentCode={saveCode}
          onLoad={handleLoadConfig}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  )
}
