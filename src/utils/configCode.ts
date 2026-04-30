import type { Talmid } from '../data/types'
import type { Assignment } from '../data/types'
import { TALLERES } from '../data/types'

export type SavedConfig = Record<string, number>

function greedyForTalmid(t: Talmid): number {
  let best = 0
  let bestScore = -Infinity
  for (let j = 0; j < TALLERES.length; j++) {
    if (t.scores[j] > bestScore) {
      bestScore = t.scores[j]
      best = j
    }
  }
  return best
}

export function encodeConfig(talmidim: Talmid[], assignment: Assignment): string {
  const config: SavedConfig = {}
  for (let i = 0; i < talmidim.length; i++) {
    const t = talmidim[i]
    config[`${t.nombre}|${t.kita}`] = assignment[i]
  }
  const json = JSON.stringify(config)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeConfig(code: string): SavedConfig | null {
  try {
    const padded = code.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((code.length % 4 || 4) - 2)
    const json = decodeURIComponent(escape(atob(padded)))
    const parsed = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    return parsed as SavedConfig
  } catch {
    return null
  }
}

export function buildReconciled(
  talmidim: Talmid[],
  savedConfig: SavedConfig,
): { warmStart: Assignment; pinned: boolean[] } {
  const warmStart: Assignment = []
  const pinned: boolean[] = []
  for (let i = 0; i < talmidim.length; i++) {
    const t = talmidim[i]
    const key = `${t.nombre}|${t.kita}`
    const saved = savedConfig[key]
    if (saved !== undefined && saved >= 0 && saved < TALLERES.length) {
      warmStart[i] = saved
      pinned[i] = true
    } else {
      warmStart[i] = greedyForTalmid(t)
      pinned[i] = false
    }
  }
  return { warmStart, pinned }
}
