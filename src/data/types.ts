export const TALLERES = [
  'Ventas y Hadrajá',
  'Ludoteca poco convencional',
  'Tecnología dIA a dIA',
  'Manualidades',
  'Actualidad internacional y debate',
] as const

export type TallerName = (typeof TALLERES)[number]

export type Talmid = {
  id: string
  nombre: string
  kita: string
  scores: number[]
  comentario: string
  timestamp: string
}

export type Weights = {
  preferencia: number
  equidad: number
  mezclaKitot: number
}

export type Assignment = number[]

export type AssignmentResult = {
  assignment: Assignment
  prefScore: number
  mixScore: number
  eqScore: number
  totalScore: number
}
