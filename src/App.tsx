import { useEffect, useMemo, useRef, useState } from 'react'
import { TALLERES } from './data/types'
import type { Talmid, Weights, Assignment } from './data/types'
import { fetchTalmidim, SHEET_ID } from './data/fetchSheet'
import { solveAssignment } from './algorithm/assign'
import { evaluate } from './algorithm/objective'
import { WeightsPanel } from './components/WeightsPanel'
import { TallerColumn } from './components/TallerColumn'
import { StatsPanel } from './components/StatsPanel'
import { buildKitaColorMap } from './utils/colors'

const DEFAULT_WEIGHTS: Weights = { preferencia: 70, equidad: 20, mezclaKitot: 70 }

export default function App() {
  const [talmidim, setTalmidim] = useState<Talmid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [assignment, setAssignment] = useState<Assignment>([])
  const warmStartRef = useRef<Assignment>([])

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
    const handle = setTimeout(() => {
      const newAssignment = solveAssignment(talmidim, weights, {
        warmStart: warmStartRef.current.length === talmidim.length ? warmStartRef.current : undefined,
        seed: 42,
      })
      warmStartRef.current = newAssignment
      setAssignment(newAssignment)
    }, 50)
    return () => clearTimeout(handle)
  }, [talmidim, weights])

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
        <div className="flex items-center gap-2">
          <a
            href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Ver sheet
          </a>
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50"
          >
            {loading ? 'Cargando…' : 'Refrescar datos'}
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

      {!loading && talmidim.length === 0 && !error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm text-center">
          El sheet no tiene respuestas todavía.
        </div>
      )}

      <footer className="pt-6 text-xs text-slate-400 text-center">
        Verde: 4-5 (top elección) · Amarillo: 3 (neutral) · Rojo: 1-2 (perjudicado)
      </footer>
    </div>
  )
}
