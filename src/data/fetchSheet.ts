import { parseScore } from '../utils/parseScore'
import type { Talmid } from './types'

export const SHEET_ID = '1No-_sY4FESbcme3PbXg0TMpk5r0FRYQcBDKKITVyjsw'

const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`

type GvizCell = { v?: unknown; f?: string } | null
type GvizRow = { c: GvizCell[] }
type GvizResponse = { table: { rows: GvizRow[] } }

function cellString(cell: GvizCell): string {
  if (!cell) return ''
  if (cell.f != null) return String(cell.f).trim()
  if (cell.v != null) return String(cell.v).trim()
  return ''
}

export async function fetchTalmidim(): Promise<Talmid[]> {
  const res = await fetch(GVIZ_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)
  const text = await res.text()
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?\s*$/)
  if (!match) throw new Error('Unexpected gviz response format')
  const json = JSON.parse(match[1]) as GvizResponse

  return json.table.rows
    .map((row, idx): Talmid | null => {
      const cells = row.c
      const timestamp = cellString(cells[0])
      const nombre = cellString(cells[1])
      const kita = cellString(cells[2])
      if (!nombre) return null
      const scores = [3, 4, 5, 6, 7].map((i) => parseScore(cells[i]?.v ?? cells[i]?.f))
      const comentario = cellString(cells[8])
      return {
        id: `${idx}-${nombre}`,
        nombre,
        kita: kita || 'Sin kitá',
        scores,
        comentario,
        timestamp,
      }
    })
    .filter((t): t is Talmid => t !== null)
}
