import { TALLERES } from '../data/types'
import type { Talmid, Assignment, Weights } from '../data/types'
import { evaluate } from './objective'

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleInPlace<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

function greedyInitial(talmidim: Talmid[]): Assignment {
  return talmidim.map((t) => {
    let best = 0
    let bestScore = -Infinity
    for (let j = 0; j < TALLERES.length; j++) {
      if (t.scores[j] > bestScore) {
        bestScore = t.scores[j]
        best = j
      }
    }
    return best
  })
}

export type AssignOptions = {
  warmStart?: Assignment
  pinned?: boolean[]
  maxPasses?: number
  seed?: number
}

export function solveAssignment(
  talmidim: Talmid[],
  weights: Weights,
  options: AssignOptions = {},
): Assignment {
  if (talmidim.length === 0) return []
  const maxPasses = options.maxPasses ?? 12
  const rand = mulberry32(options.seed ?? 42)

  let assignment =
    options.warmStart && options.warmStart.length === talmidim.length
      ? [...options.warmStart]
      : greedyInitial(talmidim)

  let currentScore = evaluate(talmidim, assignment, weights).total

  for (let pass = 0; pass < maxPasses; pass++) {
    let improvedThisPass = false
    const order = talmidim.map((_, i) => i)
    shuffleInPlace(order, rand)

    for (const i of order) {
      if (options.pinned?.[i]) continue
      const original = assignment[i]
      let bestTaller = original
      let bestScore = currentScore

      for (let j = 0; j < TALLERES.length; j++) {
        if (j === original) continue
        assignment[i] = j
        const s = evaluate(talmidim, assignment, weights).total
        if (s > bestScore + 1e-9) {
          bestScore = s
          bestTaller = j
        }
      }
      assignment[i] = bestTaller
      if (bestTaller !== original) {
        currentScore = bestScore
        improvedThisPass = true
      }
    }

    const swapOrder = talmidim.map((_, i) => i)
    shuffleInPlace(swapOrder, rand)
    for (let a = 0; a < swapOrder.length; a++) {
      for (let b = a + 1; b < swapOrder.length; b++) {
        const i = swapOrder[a]
        const j = swapOrder[b]
        if (options.pinned?.[i] || options.pinned?.[j]) continue
        if (assignment[i] === assignment[j]) continue
        const ti = assignment[i]
        const tj = assignment[j]
        assignment[i] = tj
        assignment[j] = ti
        const s = evaluate(talmidim, assignment, weights).total
        if (s > currentScore + 1e-9) {
          currentScore = s
          improvedThisPass = true
        } else {
          assignment[i] = ti
          assignment[j] = tj
        }
      }
    }

    if (!improvedThisPass) break
  }

  return assignment
}
