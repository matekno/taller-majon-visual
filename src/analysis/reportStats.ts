import { TALLERES } from '../data/types'
import type { Talmid, TallerName } from '../data/types'

export type Distribution = {
  counts: number[]
  low: number
  neutral: number
  high: number
  lowRate: number
  neutralRate: number
  highRate: number
}

export type TallerStats = {
  taller: TallerName
  index: number
  mean: number
  stdDev: number
  distribution: Distribution
  polarization: number
  rejectionRate: number
  enthusiasmRate: number
  consensus: number
  signal: string
}

export type KitaTallerStats = {
  taller: TallerName
  mean: number
  high: number
  neutral: number
  low: number
}

export type KitaStats = {
  kita: string
  count: number
  mean: number
  highRate: number
  lowRate: number
  apathyCount: number
  enthusiasmCount: number
  topTaller: TallerName
  weakestTaller: TallerName
  talleres: KitaTallerStats[]
}

export type TalmidProfile = {
  talmid: Talmid
  mean: number
  highCount: number
  neutralCount: number
  lowCount: number
  range: number
  favorites: TallerName[]
  avoid: TallerName[]
  profile: 'Apatía' | 'Entusiasta' | 'Polarizado' | 'Selectivo' | 'Neutral'
  attention: number
}

export type ReportStats = {
  total: number
  overallMean: number
  distribution: Distribution
  talleres: TallerStats[]
  kitot: KitaStats[]
  talmidim: TalmidProfile[]
  apathy: TalmidProfile[]
  enthusiasm: TalmidProfile[]
  polarizedTalmidim: TalmidProfile[]
  insights: string[]
}

const SCORE_VALUES = [1, 2, 3, 4, 5]

export function buildReportStats(talmidim: Talmid[]): ReportStats {
  const totalScores = talmidim.flatMap((t) => t.scores).filter(isValidScore)
  const distribution = buildDistribution(totalScores)
  const talleres = TALLERES.map((taller, index) => buildTallerStats(taller, index, talmidim))
  const talmidProfiles = talmidim
    .map(buildTalmidProfile)
    .sort((a, b) => b.attention - a.attention || a.mean - b.mean)
  const kitot = buildKitaStats(talmidim)

  const apathy = talmidProfiles
    .filter((p) => p.profile === 'Apatía')
    .sort((a, b) => a.mean - b.mean || b.lowCount - a.lowCount)

  const enthusiasm = [...talmidProfiles]
    .filter((p) => p.profile === 'Entusiasta' || p.highCount >= 2)
    .sort((a, b) => b.mean - a.mean || b.highCount - a.highCount)

  const polarizedTalmidim = talmidProfiles
    .filter((p) => p.profile === 'Polarizado')
    .sort((a, b) => b.range - a.range || b.highCount - a.highCount)

  return {
    total: talmidim.length,
    overallMean: mean(totalScores),
    distribution,
    talleres,
    kitot,
    talmidim: talmidProfiles,
    apathy,
    enthusiasm,
    polarizedTalmidim,
    insights: buildInsights(talmidim, talleres, kitot, apathy, enthusiasm),
  }
}

function buildTallerStats(taller: TallerName, index: number, talmidim: Talmid[]): TallerStats {
  const scores = talmidim.map((t) => t.scores[index]).filter(isValidScore)
  const distribution = buildDistribution(scores)
  const stdDev = standardDeviation(scores)
  const polarization = scores.length === 0 ? 0 : (distribution.high + distribution.low) / scores.length
  const consensus = Math.max(0, 1 - stdDev / 2)

  return {
    taller,
    index,
    mean: mean(scores),
    stdDev,
    distribution,
    polarization,
    rejectionRate: distribution.lowRate,
    enthusiasmRate: distribution.highRate,
    consensus,
    signal: tallerSignal(distribution, polarization, stdDev),
  }
}

function buildKitaStats(talmidim: Talmid[]): KitaStats[] {
  const groups = groupBy(talmidim, (t) => t.kita)
  return Array.from(groups.entries())
    .map(([kita, members]) => {
      const talleres = TALLERES.map((taller, index) => {
        const scores = members.map((t) => t.scores[index]).filter(isValidScore)
        const distribution = buildDistribution(scores)
        return {
          taller,
          mean: mean(scores),
          high: distribution.high,
          neutral: distribution.neutral,
          low: distribution.low,
        }
      })
      const allScores = members.flatMap((t) => t.scores).filter(isValidScore)
      const distribution = buildDistribution(allScores)
      const profiles = members.map(buildTalmidProfile)
      const ranked = [...talleres].sort((a, b) => b.mean - a.mean)

      return {
        kita,
        count: members.length,
        mean: mean(allScores),
        highRate: distribution.highRate,
        lowRate: distribution.lowRate,
        apathyCount: profiles.filter((p) => p.profile === 'Apatía').length,
        enthusiasmCount: profiles.filter((p) => p.profile === 'Entusiasta').length,
        topTaller: ranked[0]?.taller ?? TALLERES[0],
        weakestTaller: ranked[ranked.length - 1]?.taller ?? TALLERES[0],
        talleres,
      }
    })
    .sort((a, b) => a.kita.localeCompare(b.kita))
}

function buildTalmidProfile(talmid: Talmid): TalmidProfile {
  const scores = talmid.scores.filter(isValidScore)
  const highCount = scores.filter((s) => s >= 4).length
  const neutralCount = scores.filter((s) => s === 3).length
  const lowCount = scores.filter((s) => s <= 2).length
  const avg = mean(scores)
  const maxScore = Math.max(...scores, 0)
  const minScore = Math.min(...scores, 5)
  const favorites = maxScore > 0 ? TALLERES.filter((_, index) => talmid.scores[index] === maxScore) : []
  const avoid = minScore <= 2 ? TALLERES.filter((_, index) => talmid.scores[index] === minScore) : []
  const range = maxScore - minScore
  const profile = classifyTalmid(avg, highCount, neutralCount, lowCount, range)

  return {
    talmid,
    mean: avg,
    highCount,
    neutralCount,
    lowCount,
    range,
    favorites,
    avoid,
    profile,
    attention: attentionScore(profile, avg, highCount, lowCount, range),
  }
}

function classifyTalmid(
  avg: number,
  highCount: number,
  neutralCount: number,
  lowCount: number,
  range: number,
): TalmidProfile['profile'] {
  if (highCount === 0 && avg <= 3) return 'Apatía'
  if (avg >= 3.4 && highCount >= 2 && lowCount <= 1) return 'Entusiasta'
  if (highCount > 0 && lowCount > 0 && range >= 3) return 'Polarizado'
  if (highCount > 0 && neutralCount + highCount <= 3) return 'Selectivo'
  return 'Neutral'
}

function attentionScore(
  profile: TalmidProfile['profile'],
  avg: number,
  highCount: number,
  lowCount: number,
  range: number,
): number {
  const base = {
    Apatía: 10,
    Polarizado: 8,
    Selectivo: 6,
    Entusiasta: 4,
    Neutral: 2,
  }[profile]
  return base + lowCount * 1.2 + range + Math.max(0, 3 - avg) + highCount * 0.3
}

function buildDistribution(scores: number[]): Distribution {
  const counts = SCORE_VALUES.map((score) => scores.filter((s) => s === score).length)
  const total = scores.length || 1
  const low = counts[0] + counts[1]
  const neutral = counts[2]
  const high = counts[3] + counts[4]

  return {
    counts,
    low,
    neutral,
    high,
    lowRate: low / total,
    neutralRate: neutral / total,
    highRate: high / total,
  }
}

function buildInsights(
  talmidim: Talmid[],
  talleres: TallerStats[],
  kitot: KitaStats[],
  apathy: TalmidProfile[],
  enthusiasm: TalmidProfile[],
): string[] {
  if (talmidim.length === 0) return []

  const mostPolarized = maxBy(talleres, (t) => t.polarization + t.stdDev / 2)
  const mostNeutral = maxBy(talleres, (t) => t.distribution.neutralRate)
  const mostRejected = maxBy(talleres, (t) => t.rejectionRate)
  const mostLoved = maxBy(talleres, (t) => t.enthusiasmRate)
  const lowEnergyKita = maxBy(kitot, (k) => k.apathyCount / Math.max(1, k.count))
  const highEnergyKita = maxBy(kitot, (k) => k.enthusiasmCount / Math.max(1, k.count))

  return [
    `${mostPolarized.taller} es el taller con señal más polarizada: ${formatPct(mostPolarized.polarization)} de respuestas fuera del 3.`,
    `${mostRejected.taller} concentra el mayor rechazo relativo (${formatPct(mostRejected.rejectionRate)} en 1-2).`,
    `${mostLoved.taller} tiene la mayor proporción de entusiasmo (${formatPct(mostLoved.enthusiasmRate)} en 4-5).`,
    `${mostNeutral.taller} es el taller más neutralizado: ${formatPct(mostNeutral.distribution.neutralRate)} lo puso en 3.`,
    `${apathy.length} talmidim no pusieron ningún 4 o 5; conviene cuidarlos al asignar porque tienen poco margen de satisfacción.`,
    `${enthusiasm.length} talmidim muestran alta apertura o entusiasmo en al menos dos talleres.`,
    `${lowEnergyKita.kita} tiene la mayor concentración relativa de apatía (${lowEnergyKita.apathyCount}/${lowEnergyKita.count}).`,
    `${highEnergyKita.kita} tiene la mayor concentración relativa de entusiasmo (${highEnergyKita.enthusiasmCount}/${highEnergyKita.count}).`,
  ]
}

function tallerSignal(distribution: Distribution, polarization: number, stdDev: number): string {
  if (polarization >= 0.7 && distribution.low > distribution.high) return 'Polarizado con rechazo alto'
  if (polarization >= 0.7 && distribution.high >= distribution.low) return 'Polarizado con fans claros'
  if (distribution.neutralRate >= 0.55) return 'Mayoría neutral'
  if (stdDev <= 0.5) return 'Consenso fuerte'
  return 'Señal mixta'
}

function mean(values: number[]): number {
  const valid = values.filter(isValidScore)
  if (valid.length === 0) return 0
  return valid.reduce((acc, value) => acc + value, 0) / valid.length
}

function standardDeviation(values: number[]): number {
  const avg = mean(values)
  if (values.length === 0) return 0
  const variance = values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function isValidScore(score: number): boolean {
  return score >= 1 && score <= 5
}

function groupBy<T>(values: T[], getKey: (value: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const value of values) {
    const key = getKey(value)
    groups.set(key, [...(groups.get(key) ?? []), value])
  }
  return groups
}

function maxBy<T>(values: T[], score: (value: T) => number): T {
  return values.reduce((best, value) => (score(value) > score(best) ? value : best), values[0])
}

export function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`
}
