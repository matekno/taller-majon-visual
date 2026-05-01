import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { TALLERES } from '../data/types'
import type { Talmid } from '../data/types'
import { fetchTalmidim, SHEET_ID } from '../data/fetchSheet'
import { buildReportStats, formatPct } from '../analysis/reportStats'
import type { Distribution, KitaStats, TalmidProfile, TallerStats } from '../analysis/reportStats'

type Props = {
  homePath: string
}

export function ReportPage({ homePath }: Props) {
  const [talmidim, setTalmidim] = useState<Talmid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTalmidim()
      setTalmidim(data)
      setLastFetch(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(() => buildReportStats(talmidim), [talmidim])
  const mostPolarized = stats.talleres[0]
    ? [...stats.talleres].sort((a, b) => b.polarization + b.stdDev / 2 - (a.polarization + a.stdDev / 2))[0]
    : null

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-[1500px] mx-auto px-4 py-5 md:px-6 md:py-6 space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
              <a href={homePath} className="hover:text-slate-900 underline">
                Asignador
              </a>
              <span>/</span>
              <span>Reporte estadístico</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-950">
              Reporte estadístico Majón
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl">
              Lectura en vivo del Google Sheet: patrones generales, por kitá y por talmid.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-sm bg-white text-slate-700 rounded-lg hover:bg-slate-100 border border-slate-200"
            >
              Ver sheet
            </a>
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Refrescar reporte'}
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-sm">
            Error al leer el sheet: {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>{stats.total} respuestas</span>
          {lastFetch && <span>Ultima actualizacion {lastFetch.toLocaleTimeString()}</span>}
          {mostPolarized && <span>Mayor polarizacion: {mostPolarized.taller}</span>}
        </div>

        {stats.total > 0 && (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <MetricCard label="Respuestas" value={`${stats.total}`} subtitle={`${stats.kitot.length} kitot`} />
              <MetricCard label="Media general" value={formatNumber(stats.overallMean)} subtitle="escala 1-5" />
              <MetricCard label="Altos" value={formatPct(stats.distribution.highRate)} subtitle="votos 4-5" />
              <MetricCard label="Neutros" value={formatPct(stats.distribution.neutralRate)} subtitle="votos 3" />
              <MetricCard label="Bajos" value={formatPct(stats.distribution.lowRate)} subtitle="votos 1-2" />
            </section>

            <section className="space-y-3">
              <SectionTitle title="Señales principales" />
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                {stats.insights.map((insight) => (
                  <div key={insight} className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 shadow-sm">
                    {insight}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle title="General por taller" />
              <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
                {stats.talleres.map((taller) => (
                  <TallerCard key={taller.taller} taller={taller} />
                ))}
              </div>
            </section>

            <section className="grid xl:grid-cols-[1.1fr_0.9fr] gap-4 items-start">
              <div className="space-y-3">
                <SectionTitle title="Por kitá" />
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <Th>Kitá</Th>
                        <Th>N</Th>
                        <Th>Media</Th>
                        <Th>Altos</Th>
                        <Th>Bajos</Th>
                        <Th>Apatía</Th>
                        <Th>Mejor señal</Th>
                        <Th>Más débil</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.kitot.map((kita) => (
                        <KitaRow key={kita.kita} kita={kita} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <SectionTitle title="Mapa kitá x taller" />
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100">
                  {stats.kitot.map((kita) => (
                    <div key={kita.kita} className="p-3">
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{kita.kita}</h3>
                        <span className="text-xs text-slate-500">{kita.count} respuestas</span>
                      </div>
                      <div className="space-y-2">
                        {kita.talleres.map((taller) => (
                          <KitaTallerBar key={taller.taller} label={taller.taller} value={taller.mean} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid lg:grid-cols-3 gap-4 items-start">
              <TalmidList title="Apatía o bajo entusiasmo" talmidim={stats.apathy} empty="No hay casos con media baja y cero votos 4-5." />
              <TalmidList title="Entusiasmo alto" talmidim={stats.enthusiasm.slice(0, 12)} empty="No hay casos destacados de entusiasmo." />
              <TalmidList title="Perfiles polarizados" talmidim={stats.polarizedTalmidim} empty="No hay perfiles muy polarizados." />
            </section>

            <section className="space-y-3">
              <SectionTitle title="Por talmid" />
              <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <Th>Nombre</Th>
                      <Th>Kitá</Th>
                      <Th>Perfil</Th>
                      <Th>Media</Th>
                      <Th>4-5</Th>
                      <Th>3</Th>
                      <Th>1-2</Th>
                      <Th>Favorito/s</Th>
                      <Th>Evitar</Th>
                      {TALLERES.map((taller) => (
                        <Th key={taller}>{shortTaller(taller)}</Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.talmidim.map((profile) => (
                      <TalmidRow key={profile.talmid.id} profile={profile} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {!loading && stats.total === 0 && !error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm text-center">
            El sheet no tiene respuestas todavia.
          </div>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h2>
}

function MetricCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 min-h-[92px]">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
      <div className="text-2xl md:text-3xl font-bold text-slate-950 leading-tight">{value}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </div>
  )
}

function TallerCard({ taller }: { taller: TallerStats }) {
  return (
    <article className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-3">
      <div>
        <h3 className="font-semibold text-slate-950 leading-snug min-h-[40px]">{taller.taller}</h3>
        <p className="text-xs text-slate-500">{taller.signal}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <TinyStat label="Media" value={formatNumber(taller.mean)} />
        <TinyStat label="Desvío" value={formatNumber(taller.stdDev)} />
        <TinyStat label="Polarización" value={formatPct(taller.polarization)} />
        <TinyStat label="Consenso" value={formatPct(taller.consensus)} />
      </div>
      <DistributionBar distribution={taller.distribution} />
      <ScoreHistogram counts={taller.distribution.counts} />
    </article>
  )
}

function TinyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 border border-slate-100 p-2">
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function DistributionBar({ distribution }: { distribution: Distribution }) {
  return (
    <div className="space-y-1">
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
        <div className="bg-rose-400" style={{ width: formatPct(distribution.lowRate) }} />
        <div className="bg-amber-300" style={{ width: formatPct(distribution.neutralRate) }} />
        <div className="bg-emerald-500" style={{ width: formatPct(distribution.highRate) }} />
      </div>
      <div className="grid grid-cols-3 text-[11px] text-slate-500">
        <span>Bajos {distribution.low}</span>
        <span className="text-center">3: {distribution.neutral}</span>
        <span className="text-right">Altos {distribution.high}</span>
      </div>
    </div>
  )
}

function ScoreHistogram({ counts }: { counts: number[] }) {
  const max = Math.max(...counts, 1)
  return (
    <div className="grid grid-cols-5 gap-1 items-end h-16 pt-2">
      {counts.map((count, index) => (
        <div key={index} className="flex flex-col items-center gap-1 h-full justify-end">
          <div
            className="w-full rounded-t bg-slate-300 min-h-[4px]"
            style={{ height: `${Math.max(8, (count / max) * 48)}px` }}
            title={`${index + 1}: ${count}`}
          />
          <span className="text-[10px] text-slate-500">{index + 1}</span>
        </div>
      ))}
    </div>
  )
}

function KitaRow({ kita }: { kita: KitaStats }) {
  return (
    <tr className="border-t border-slate-100">
      <Td strong>{kita.kita}</Td>
      <Td>{kita.count}</Td>
      <Td>{formatNumber(kita.mean)}</Td>
      <Td>{formatPct(kita.highRate)}</Td>
      <Td>{formatPct(kita.lowRate)}</Td>
      <Td>{kita.apathyCount}</Td>
      <Td>{kita.topTaller}</Td>
      <Td>{kita.weakestTaller}</Td>
    </tr>
  )
}

function KitaTallerBar({ label, value }: { label: string; value: number }) {
  const width = `${Math.max(4, (value / 5) * 100)}%`
  return (
    <div className="grid grid-cols-[minmax(120px,1fr)_80px] gap-2 items-center text-xs">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-slate-600 truncate">{label}</span>
          <span className="font-mono text-slate-500">{formatNumber(value)}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500" style={{ width }} />
        </div>
      </div>
      <span className="text-slate-500 text-right">{toneForMean(value)}</span>
    </div>
  )
}

function TalmidList({
  title,
  talmidim,
  empty,
}: {
  title: string
  talmidim: TalmidProfile[]
  empty: string
}) {
  return (
    <section className="space-y-3">
      <SectionTitle title={title} />
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100">
        {talmidim.length === 0 && <div className="p-3 text-sm text-slate-500">{empty}</div>}
        {talmidim.slice(0, 12).map((profile) => (
          <div key={profile.talmid.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-950">{profile.talmid.nombre}</div>
                <div className="text-xs text-slate-500">{profile.talmid.kita} · {profile.profile}</div>
              </div>
              <span className={`text-xs rounded-full px-2 py-1 ${profileTone(profile.profile)}`}>
                {formatNumber(profile.mean)}
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-2">
              {profile.highCount} altos · {profile.neutralCount} neutros · {profile.lowCount} bajos
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Favorito: {joinShort(profile.favorites)}
              {profile.avoid.length > 0 && ` · Evitar: ${joinShort(profile.avoid)}`}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TalmidRow({ profile }: { profile: TalmidProfile }) {
  return (
    <tr className="border-t border-slate-100">
      <Td strong>{profile.talmid.nombre}</Td>
      <Td>{profile.talmid.kita}</Td>
      <Td>
        <span className={`text-xs rounded-full px-2 py-1 whitespace-nowrap ${profileTone(profile.profile)}`}>
          {profile.profile}
        </span>
      </Td>
      <Td>{formatNumber(profile.mean)}</Td>
      <Td>{profile.highCount}</Td>
      <Td>{profile.neutralCount}</Td>
      <Td>{profile.lowCount}</Td>
      <Td>{joinShort(profile.favorites)}</Td>
      <Td>{profile.avoid.length > 0 ? joinShort(profile.avoid) : '-'}</Td>
      {profile.talmid.scores.map((score, index) => (
        <Td key={`${profile.talmid.id}-${index}`}>
          <span className={`inline-flex min-w-7 justify-center rounded px-1.5 py-0.5 font-mono text-xs ${scoreTone(score)}`}>
            {score}
          </span>
        </Td>
      ))}
    </tr>
  )
}

function Th({ children }: { children: ReactNode }) {
  return <th className="text-left font-semibold text-xs uppercase tracking-wide px-3 py-2 whitespace-nowrap">{children}</th>
}

function Td({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <td className={`px-3 py-2 align-top text-slate-700 ${strong ? 'font-semibold text-slate-950' : ''}`}>
      {children}
    </td>
  )
}

function formatNumber(value: number): string {
  return value.toFixed(2)
}

function toneForMean(value: number): string {
  if (value >= 3.5) return 'alta'
  if (value <= 2.4) return 'baja'
  return 'media'
}

function shortTaller(taller: string): string {
  return taller
    .replace(' poco convencional', '')
    .replace('Tecnología dIA a dIA', 'Tecnología')
    .replace(' internacional y debate', '')
}

function joinShort(talleres: string[]): string {
  return talleres.map(shortTaller).join(', ')
}

function scoreTone(score: number): string {
  if (score >= 4) return 'bg-emerald-100 text-emerald-800'
  if (score === 3) return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-800'
}

function profileTone(profile: TalmidProfile['profile']): string {
  if (profile === 'Apatía') return 'bg-rose-100 text-rose-800'
  if (profile === 'Entusiasta') return 'bg-emerald-100 text-emerald-800'
  if (profile === 'Polarizado') return 'bg-violet-100 text-violet-800'
  if (profile === 'Selectivo') return 'bg-cyan-100 text-cyan-800'
  return 'bg-slate-100 text-slate-700'
}
