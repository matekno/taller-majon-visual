export function scoreColor(score: number): {
  bg: string
  text: string
  ring: string
  label: string
} {
  if (score >= 4) {
    return {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      ring: 'ring-emerald-400',
      label: 'verde',
    }
  }
  if (score === 3) {
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      ring: 'ring-amber-400',
      label: 'amarillo',
    }
  }
  return {
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    ring: 'ring-rose-400',
    label: 'rojo',
  }
}

const KITA_PALETTE = [
  { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  { bg: 'bg-pink-100', text: 'text-pink-800', dot: 'bg-pink-500' },
  { bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500' },
  { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  { bg: 'bg-lime-100', text: 'text-lime-800', dot: 'bg-lime-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', dot: 'bg-cyan-500' },
]

export type KitaStyle = { bg: string; text: string; dot: string }

export function buildKitaColorMap(kitot: string[]): Map<string, KitaStyle> {
  const sorted = [...new Set(kitot)].sort()
  const map = new Map<string, KitaStyle>()
  sorted.forEach((k, i) => map.set(k, KITA_PALETTE[i % KITA_PALETTE.length]))
  return map
}
