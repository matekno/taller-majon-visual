import type { Weights } from '../data/types'

type Props = {
  weights: Weights
  onChange: (w: Weights) => void
}

const SLIDERS: Array<{
  key: keyof Weights
  label: string
  hint: string
  importance: 'alta' | 'baja'
}> = [
  { key: 'preferencia', label: 'Preferencia del talmid', hint: 'Respeta los puntajes 1-5', importance: 'alta' },
  { key: 'equidad', label: 'Equidad de tamaños', hint: 'Grupos del mismo tamaño', importance: 'baja' },
  { key: 'mezclaKitot', label: 'Mezcla de kitot', hint: 'Diversidad por taller', importance: 'alta' },
]

export function WeightsPanel({ weights, onChange }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Pesos del algoritmo
        </h2>
        <span className="text-xs text-slate-400">Mové los sliders y los grupos se recalculan en vivo</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SLIDERS.map((s) => (
          <div key={s.key}>
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium text-slate-800">{s.label}</label>
              <span className="text-xs text-slate-500">
                <span
                  className={
                    s.importance === 'alta'
                      ? 'text-emerald-600 font-medium'
                      : 'text-slate-400'
                  }
                >
                  {s.importance}
                </span>{' '}
                · <span className="font-mono text-slate-700">{weights[s.key]}</span>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={weights[s.key]}
              onChange={(e) => onChange({ ...weights, [s.key]: Number(e.target.value) })}
              className="w-full mt-1 accent-slate-700"
            />
            <p className="text-xs text-slate-500 mt-0.5">{s.hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
