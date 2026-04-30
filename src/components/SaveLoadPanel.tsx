import { useState } from 'react'
import { decodeConfig } from '../utils/configCode'
import type { SavedConfig } from '../utils/configCode'

type Props = {
  currentUrl: string
  currentCode: string
  onLoad: (config: SavedConfig) => void
  onClose: () => void
}

export function SaveLoadPanel({ currentUrl, currentCode, onLoad, onClose }: Props) {
  const [tab, setTab] = useState<'save' | 'load'>('save')
  const [inputCode, setInputCode] = useState('')
  const [copyState, setCopyState] = useState<'url' | 'code' | null>(null)
  const [loadError, setLoadError] = useState(false)

  function copy(text: string, which: 'url' | 'code') {
    navigator.clipboard.writeText(text).then(() => {
      setCopyState(which)
      setTimeout(() => setCopyState(null), 1500)
    })
  }

  function handleLoad() {
    const code = inputCode.trim()
    // Support pasting a full URL (extract the hash part)
    let extracted = code
    const hashIdx = code.indexOf('#c=')
    if (hashIdx !== -1) extracted = code.slice(hashIdx + 3)

    const config = decodeConfig(extracted)
    if (!config) {
      setLoadError(true)
      setTimeout(() => setLoadError(false), 2000)
      return
    }
    onLoad(config)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setTab('save')}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${tab === 'save' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Guardar
            </button>
            <button
              onClick={() => setTab('load')}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${tab === 'load' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cargar
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {tab === 'save' && (
            <>
              <p className="text-sm text-slate-600">
                Guardá la configuración actual. Podés compartir el link o guardar solo el código.
              </p>

              {/* URL */}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Link completo</label>
                <div className="mt-1 flex gap-2">
                  <input
                    readOnly
                    value={currentUrl}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono truncate"
                  />
                  <button
                    onClick={() => copy(currentUrl, 'url')}
                    className="px-3 py-2 text-xs bg-slate-800 text-white rounded-lg hover:bg-slate-900 shrink-0 transition-colors"
                  >
                    {copyState === 'url' ? '✓' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Code only */}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Solo el código</label>
                <div className="mt-1 flex gap-2">
                  <input
                    readOnly
                    value={currentCode}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono truncate"
                  />
                  <button
                    onClick={() => copy(currentCode, 'code')}
                    className="px-3 py-2 text-xs bg-slate-800 text-white rounded-lg hover:bg-slate-900 shrink-0 transition-colors"
                  >
                    {copyState === 'code' ? '✓' : 'Copiar'}
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === 'load' && (
            <>
              <p className="text-sm text-slate-600">
                Pegá un código o link guardado para restaurar la configuración.
              </p>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Código o link</label>
                <textarea
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Pegá el código o el link completo..."
                  rows={3}
                  className={`mt-1 w-full text-xs border rounded-lg px-3 py-2 font-mono resize-none focus:outline-none focus:ring-2 transition-colors ${loadError ? 'border-rose-400 focus:ring-rose-300' : 'border-slate-200 focus:ring-slate-300'}`}
                />
                {loadError && (
                  <p className="text-xs text-rose-600 mt-1">Código inválido. Verificá que lo copiaste bien.</p>
                )}
              </div>
              <button
                onClick={handleLoad}
                disabled={!inputCode.trim()}
                className="w-full py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-40 transition-colors"
              >
                Aplicar configuración
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
