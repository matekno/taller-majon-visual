import type { Talmid, Assignment, Weights } from '../data/types'
import { prefScore, eqScore, mixScore } from './metrics'

export type ObjectiveBreakdown = {
  pref: number
  eq: number
  mix: number
  total: number
}

export function normalizeWeights(w: Weights): Weights {
  const sum = w.preferencia + w.equidad + w.mezclaKitot
  if (sum === 0) {
    return { preferencia: 1 / 3, equidad: 1 / 3, mezclaKitot: 1 / 3 }
  }
  return {
    preferencia: w.preferencia / sum,
    equidad: w.equidad / sum,
    mezclaKitot: w.mezclaKitot / sum,
  }
}

export function evaluate(
  talmidim: Talmid[],
  assignment: Assignment,
  weights: Weights,
): ObjectiveBreakdown {
  const w = normalizeWeights(weights)
  const pref = prefScore(talmidim, assignment)
  const eq = eqScore(assignment)
  const mix = mixScore(talmidim, assignment)
  const total = w.preferencia * pref + w.equidad * eq + w.mezclaKitot * mix
  return { pref, eq, mix, total }
}
