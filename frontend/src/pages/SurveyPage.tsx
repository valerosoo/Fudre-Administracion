import { useState } from 'react'

const GRAPES = [
  'Malbec', 'Cabernet Sauvignon', 'Merlot', 'Syrah', 'Pinot Noir',
  'Chardonnay', 'Sauvignon Blanc', 'Cabernet Franc', 'Semillón', 'Torrontés', 'Rosado',
]

const OCCASIONS = [
  'Consumo diario', 'Cenas en casa', 'Reuniones con amigos', 'Celebraciones',
  'Maridaje con comida', 'Eventos especiales', 'Regalos',
]

const WINE_TYPES = ['Tinto', 'Blanco', 'Rosado', 'Espumante']

function StarRow({ label }: { label: string }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700 w-44">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className={`w-8 h-8 rounded-full border-2 text-xs font-bold transition-colors
              ${hovered >= n
                ? 'bg-[#7F654E] border-[#7F654E] text-white'
                : 'border-gray-300 text-gray-400 hover:border-[#7F654E]'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 w-32 justify-end">
        <span className="text-xs text-gray-400">No me gusta</span>
        <span className="text-xs text-gray-400">→</span>
        <span className="text-xs text-gray-400">Me encanta</span>
      </div>
    </div>
  )
}

export function SurveyPage() {
  return (
    <div className="max-w-2xl mx-auto py-2">
      <div className="mb-6">
        <div className="inline-block bg-[#7F654E]/10 text-[#7F654E] text-xs font-semibold px-3 py-1 rounded-full mb-2">
          Vista previa
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Encuesta de Bienvenida</h1>
        <p className="text-sm text-gray-500 mt-1">
          Así se verá el formulario que completan los nuevos miembros al unirse al club.
        </p>
      </div>

      <div className="space-y-6">
        {/* Datos personales */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Datos personales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Nombre y Apellido *</label>
              <input
                type="text"
                placeholder="Ej: María García"
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Mail de contacto *</label>
              <input
                type="email"
                placeholder="Ej: maria@email.com"
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Número de teléfono</label>
              <input
                type="tel"
                placeholder="Ej: +54 9 11 1234-5678"
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50"
                readOnly
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Dirección de entrega</label>
              <input
                type="text"
                placeholder="Ej: Av. Corrientes 1234, CABA"
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50"
                readOnly
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Plan al que te suscribiste *</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50" disabled>
                <option>Seleccioná tu plan</option>
                <option>Brote</option>
                <option>Brote +</option>
                <option>Envero</option>
                <option>Envero +</option>
              </select>
            </div>
          </div>
        </section>

        {/* Estilo */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Estilo de vino</h2>
          <p className="text-sm text-gray-500 mb-4">
            ¿Preferís vinos jóvenes (más frescos, frutados) o con más cuerpo (más estructurados, complejos)?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {['Jóvenes (frescos, frutados)', 'Más cuerpo (estructurados, complejos)'].map(opt => (
              <label
                key={opt}
                className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-[#7F654E] transition-colors"
              >
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                <span className="text-sm text-gray-600">{opt}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Tipos */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Tipos de vino</h2>
          <p className="text-sm text-gray-500 mb-4">¿Qué tipo de vinos preferís? (Podés elegir más de uno)</p>
          <div className="grid grid-cols-2 gap-3">
            {WINE_TYPES.map(t => (
              <label
                key={t}
                className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-[#7F654E] transition-colors"
              >
                <div className="w-4 h-4 rounded border border-gray-300" />
                <span className="text-sm text-gray-600">{t}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Cepas */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Rating por cepa</h2>
          <p className="text-sm text-gray-500 mb-4">
            Marcá en una escala del 1 al 5 tu gusto por cada cepa (1 = no me gusta, 5 = me encanta)
          </p>
          <div>
            {GRAPES.map(g => <StarRow key={g} label={g} />)}
          </div>
        </section>

        {/* Apertura */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Nuevas experiencias</h2>
          <p className="text-sm text-gray-500 mb-4">
            ¿Estás dispuesto/a a probar cepas o estilos que nunca hayas degustado?
          </p>
          <div className="flex flex-col gap-2">
            {['Sí', 'No', 'Depende del estilo'].map(opt => (
              <label
                key={opt}
                className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-[#7F654E] transition-colors w-full"
              >
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                <span className="text-sm text-gray-600">{opt}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Ocasiones */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Ocasiones</h2>
          <p className="text-sm text-gray-500 mb-4">¿En qué ocasiones solés abrir una botella?</p>
          <div className="grid grid-cols-2 gap-2">
            {OCCASIONS.map(o => (
              <label
                key={o}
                className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-[#7F654E] transition-colors"
              >
                <div className="w-4 h-4 rounded border border-gray-300" />
                <span className="text-sm text-gray-600">{o}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Submit preview */}
        <div className="flex justify-end pb-4">
          <button
            disabled
            className="bg-[#7F654E] text-white px-8 py-3 rounded-lg text-sm font-semibold opacity-60 cursor-not-allowed"
          >
            Enviar encuesta
          </button>
        </div>
      </div>
    </div>
  )
}
