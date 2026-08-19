import { HISTORIAL } from '../data/historial'
import type { Talmid } from '../data/types'

export type MatchConfidence = 'exacto' | 'probable'

export type HistorialHit = {
  tallerIndex: number
  /** Nombre tal cual figura en la lista de la etapa 1. */
  nombre: string
  confidence: MatchConfidence
}

/** Minúsculas, sin tildes ni puntuación, espacios colapsados. */
export function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[b.length]
}

function ratio(a: string, b: string): number {
  const max = Math.max(a.length, b.length)
  return max === 0 ? 1 : 1 - levenshtein(a, b) / max
}

/**
 * Colapsa un token a una forma fonética aproximada del castellano, para que
 * las grafías que suenan igual queden iguales: Cukier/Cuquier, Schwartz/Shwartz,
 * Goldszmidt/Goldsmit. Es la variación más común cuando el nombre lo tipea
 * cada pibe a mano en el formulario.
 */
function phoneticFold(token: string): string {
  return token
    .replace(/ll/g, 'y')
    .replace(/qu/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/h/g, '')
    .replace(/c([ei])/g, 's$1')
    .replace(/[cq]/g, 'k')
    .replace(/[zx]/g, 's')
    .replace(/[vw]/g, 'b')
    .replace(/y/g, 'i')
    .replace(/(.)\1+/g, '$1')
}

/**
 * Similitud entre dos tokens sueltos. Dos casos que Levenshtein solo puntúa
 * bajísimo y acá pesan mucho:
 *   - prefijo: "Mica" -> "Micaela", "Tati" -> "Tatiana" (castiga el largo)
 *   - fonética: "Cuquier" -> "Cukier" (los trata como 2 ediciones cualesquiera)
 */
function tokenSim(a: string, b: string): number {
  if (a === b) return 1
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  if (short.length >= 3 && long.startsWith(short)) return 0.95
  // Nunca llega a 1: una coincidencia fonética es más débil que una literal.
  return Math.max(ratio(a, b), ratio(phoneticFold(a), phoneticFold(b)) * 0.98)
}

const SURNAME_MIN = 0.85
const GIVEN_MIN = 0.7
const SINGLE_TOKEN_MIN = 0.88
/** Un nombre suelto sin apellido nunca da más que esto: es inherentemente ambiguo. */
const SINGLE_TOKEN_SCORE = 0.78
export const PROBABLE_MIN = 0.75

/**
 * Puntúa qué tan probable es que dos nombres sean la misma persona.
 * El apellido pesa más que el nombre de pila, porque compartir nombre es
 * mucho más común que compartir apellido (hay tres Micaelas y dos Solanas
 * en la lista de la etapa 1).
 */
function scoreNames(a: string, b: string): number {
  const ta = a.split(' ').filter(Boolean)
  const tb = b.split(' ').filter(Boolean)
  if (ta.length === 0 || tb.length === 0) return 0

  if (ta.length === 1 || tb.length === 1) {
    // Sin apellido de un lado solo podemos comparar nombres de pila.
    const sim = tokenSim(ta[0], tb[0])
    return sim >= SINGLE_TOKEN_MIN ? SINGLE_TOKEN_SCORE : 0
  }

  const surnameSim = tokenSim(ta[ta.length - 1], tb[tb.length - 1])
  if (surnameSim < SURNAME_MIN) return 0

  // El mejor match entre los tokens que no son el apellido, para tolerar
  // segundos nombres ("Maria Solana Chab" vs "Solana Chab").
  let givenSim = 0
  for (const x of ta.slice(0, -1)) {
    for (const y of tb.slice(0, -1)) {
      givenSim = Math.max(givenSim, tokenSim(x, y))
    }
  }
  if (givenSim < GIVEN_MIN) return 0

  return 0.35 * givenSim + 0.65 * surnameSim
}

type Candidate = { tallerIndex: number; nombre: string; norm: string }

const CANDIDATES: Candidate[] = HISTORIAL.flatMap((nombres, tallerIndex) =>
  nombres.map((nombre) => ({ tallerIndex, nombre, norm: normalize(nombre) })),
)

/** Busca a una persona en la lista de la etapa 1. `null` si no estuvo. */
export function findInHistorial(nombre: string): HistorialHit | null {
  const target = normalize(nombre)
  if (!target) return null

  const exact = CANDIDATES.find((c) => c.norm === target)
  if (exact) {
    return { tallerIndex: exact.tallerIndex, nombre: exact.nombre, confidence: 'exacto' }
  }

  let best: Candidate | null = null
  let bestScore = 0
  for (const c of CANDIDATES) {
    const score = scoreNames(target, c.norm)
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }
  if (!best || bestScore < PROBABLE_MIN) return null
  return { tallerIndex: best.tallerIndex, nombre: best.nombre, confidence: 'probable' }
}

/** Índice talmid.id -> dónde estuvo en la etapa 1. */
export function buildHistorialMap(talmidim: Talmid[]): Map<string, HistorialHit> {
  const map = new Map<string, HistorialHit>()
  for (const t of talmidim) {
    const hit = findInHistorial(t.nombre)
    if (hit) map.set(t.id, hit)
  }
  return map
}

/** Nombres de la etapa 1 que no matchearon con ninguna respuesta nueva. */
export function unmatchedHistorial(matches: Map<string, HistorialHit>): string[] {
  const used = new Set(Array.from(matches.values()).map((h) => h.nombre))
  return CANDIDATES.filter((c) => !used.has(c.nombre)).map((c) => c.nombre)
}
