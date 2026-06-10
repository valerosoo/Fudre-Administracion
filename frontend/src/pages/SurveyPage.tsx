import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { membersService } from '@/services/members'

const GRAPES = [
  'Malbec', 'Cabernet Sauvignon', 'Merlot', 'Syrah', 'Pinot Noir',
  'Chardonnay', 'Sauvignon Blanc', 'Cabernet Franc', 'Semillón', 'Torrontés', 'Rosado',
]
const WINE_TYPES  = ['Tinto', 'Blanco', 'Rosado', 'Espumante']
const OCCASIONS   = ['Consumo diario', 'Cenas en casa', 'Reuniones con amigos', 'Celebraciones', 'Maridaje con comida', 'Eventos especiales', 'Regalos']
const PLANS       = ['Brote (2 botellas/mes)', 'Brote+ (3 botellas/mes)', 'Envero (4 botellas/mes)', 'Envero+ (5 botellas/mes)']
const FREQUENCIES = ['Ocasionalmente', '1–2 veces por semana', '3–4 veces por semana', 'Todos los días']
const BUDGETS     = ['Hasta $5.000', '$5.000 – $10.000', '$10.000 – $20.000', 'Más de $20.000']
const KNOWLEDGE   = ['Principiante (recién empiezo)', 'Entusiasta (me gusta aprender)', 'Conocedor (tengo bastante experiencia)']

// Strip everything that isn't a digit
function normalizePhone(raw: string) { return raw.replace(/\D/g, '') }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Sub-components ────────────────────────────────────────────────────────────

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  const label5 = ['', 'No me gusta', 'Poco', 'Me gusta', 'Mucho', 'Me encanta ❤'][value] ?? ''
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700 w-44">{label}</span>
      <div className="flex gap-1.5">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className={`w-8 h-8 rounded-full border-2 text-xs font-bold transition-all
              ${display >= n
                ? 'bg-[#7F654E] border-[#7F654E] text-white scale-110'
                : 'border-gray-300 text-gray-400 hover:border-[#7F654E]'}`}
          >{n}</button>
        ))}
      </div>
      <span className="text-xs text-gray-400 w-28 text-right">{value ? label5 : 'Sin calificar'}</span>
    </div>
  )
}

function RadioCard({ label, desc, selected, onClick }: { label: string; desc?: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all w-full
        ${selected ? 'border-[#7F654E] bg-[#7F654E]/5' : 'border-gray-200 hover:border-[#7F654E]/50'}`}
    >
      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
        ${selected ? 'border-[#7F654E]' : 'border-gray-300'}`}>
        {selected && <div className="w-2 h-2 rounded-full bg-[#7F654E]" />}
      </div>
      <div>
        <p className={`text-sm ${selected ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
    </button>
  )
}

function CheckCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all w-full
        ${selected ? 'border-[#7F654E] bg-[#7F654E]/5' : 'border-gray-200 hover:border-[#7F654E]/50'}`}
    >
      <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center
        ${selected ? 'border-[#7F654E] bg-[#7F654E]' : 'border-gray-300'}`}>
        {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>}
      </div>
      <span className={`text-sm ${selected ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>{label}</span>
    </button>
  )
}

function SelectField({ label, options, value, onChange, required, error }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; required?: boolean; error?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7F654E]/40 transition-colors
          ${error ? 'border-red-400' : 'border-gray-300'}
          ${value ? 'font-semibold text-gray-900' : 'text-gray-400'}`}
      >
        <option value="">Seleccioná una opción...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextField({ label, value, onChange, type = 'text', placeholder, required, error, hint }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
  placeholder?: string; required?: boolean; error?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F654E]/40
          ${value ? 'font-semibold text-gray-900' : 'text-gray-500'}
          ${error ? 'border-red-400' : 'border-gray-300'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type FormState = {
  name: string; email: string
  phone: string; address: string; plan: string
  knowledge: string; frequency: string; budget: string
  wineStyle: string; wineTypes: string[]; openToNew: string; occasions: string[]
  grapeRatings: Record<string, number>; comments: string
}

const EMPTY: FormState = {
  name: '', email: '',
  phone: '', address: '', plan: '',
  knowledge: '', frequency: '', budget: '',
  wineStyle: '', wineTypes: [], openToNew: '', occasions: [],
  grapeRatings: {}, comments: '',
}

export function SurveyPage() {
  const [form, setForm]         = useState<FormState>(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const set = (field: keyof FormState, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const toggleList = (field: 'wineTypes' | 'occasions', item: string) =>
    setForm(prev => {
      const list = prev[field] as string[]
      return { ...prev, [field]: list.includes(item) ? list.filter(x => x !== item) : [...list, item] }
    })

  function validateFields(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio'
    if (!form.email.trim()) errs.email = 'El email es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido'
    if (!form.wineStyle) errs.wineStyle = 'Elegí un estilo de vino'
    if (form.wineTypes.length === 0) errs.wineTypes = 'Elegí al menos un tipo de vino'
    if (form.phone) {
      const digits = normalizePhone(form.phone)
      if (digits.length < 10 || digits.length > 15)
        errs.phone = 'Formato inválido. Incluí código de país (ej: 5491112345678)'
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateFields()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    setSaving(true)
    try {
      // Buscar el miembro por email; si no existe, crearlo
      const allMembers = await membersService.getAll()
      let member = allMembers.find(m => m.email?.toLowerCase() === form.email.trim().toLowerCase())
      if (!member?.id) {
        member = await membersService.create({ name: form.name.trim(), email: form.email.trim() } as any)
      }

      const openToNewBool = form.openToNew.startsWith('Sí') ? true
        : form.openToNew.startsWith('No') ? false : null

      const payload = {
        phone:           form.phone ? normalizePhone(form.phone) : undefined,
        deliveryAddress: form.address || undefined,
        wineStyle:       form.wineStyle || undefined,
        wineTypes:       form.wineTypes.join(', ') || undefined,
        openToNew:       openToNewBool,
        occasions:       form.occasions.join(', ') || undefined,
        knowledge:       form.knowledge || undefined,
        frequency:       form.frequency || undefined,
        budget:          form.budget || undefined,
        comments:        form.comments || undefined,
        grapeRatings:    Object.fromEntries(
          Object.entries(form.grapeRatings).filter(([, v]) => v > 0)
        ),
      }
      await membersService.saveSurvey(member.id!, payload)
      setSubmitted(true)
    } catch {
      toast.error('Error al guardar la encuesta. Revisá la conexión con el servidor.')
    } finally {
      setSaving(false)
    }
  }

  const ratedGrapes = Object.values(form.grapeRatings).filter(Boolean).length

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center">
        <div className="bg-white border rounded-xl p-10 shadow-sm">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={52} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por registrarte{form.name ? `, ${form.name.split(' ')[0]}` : ''}!</h2>
          <p className="text-gray-500 mb-2">Tus preferencias quedaron guardadas.</p>
          <p className="text-gray-400 text-sm mb-6">
            Te enviamos un mail de bienvenida a <strong>{form.email}</strong>
          </p>
          <div className="text-left bg-gray-50 rounded-lg p-4 space-y-2 text-sm mb-6">
            {form.wineStyle && <p><span className="font-medium text-gray-600">Estilo:</span> {form.wineStyle === 'JOVENES' ? 'Jóvenes / Frescos' : 'Más cuerpo'}</p>}
            {form.wineTypes.length > 0 && <p><span className="font-medium text-gray-600">Tipos:</span> {form.wineTypes.join(', ')}</p>}
            <p><span className="font-medium text-gray-600">Cepas calificadas:</span> {ratedGrapes} / {GRAPES.length}</p>
            {form.openToNew && <p><span className="font-medium text-gray-600">Nuevas experiencias:</span> {form.openToNew}</p>}
          </div>
          <Button variant="outline" onClick={() => { setForm(EMPTY); setSubmitted(false) }}>
            Completar otra encuesta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Encuesta de Bienvenida</h1>
        <p className="text-sm text-gray-500 mt-1">
          Contanos tus preferencias para personalizar tu selección de vinos cada mes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── 0. Identificación ── */}
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Tus datos <span className="text-red-400">*</span>
          </h2>
          <p className="text-sm text-gray-500 mb-3">Usamos tu email para vincular tus preferencias a tu cuenta.</p>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Nombre completo"
              value={form.name}
              onChange={v => set('name', v)}
              placeholder="Juan García"
              required
              error={fieldErrors.name}
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={v => set('email', v)}
              type="email"
              placeholder="tu@email.com"
              required
              error={fieldErrors.email}
            />
          </div>
        </section>

        {/* ── 1. Datos de contacto ── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Datos de contacto</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <TextField
                label="Teléfono"
                value={form.phone}
                onChange={v => set('phone', v)}
                type="tel"
                placeholder="Ej: +54 9 11 1234-5678"
                error={fieldErrors.phone}
                hint="Se guardará como solo dígitos: 5491112345678"
              />
              {form.phone && !fieldErrors.phone && (
                <p className="text-xs text-[#7F654E] mt-1 font-medium">
                  Se guardará: {normalizePhone(form.phone)}
                </p>
              )}
            </div>
            <SelectField
              label="Plan suscripto"
              options={PLANS}
              value={form.plan}
              onChange={v => set('plan', v)}
            />
            <div className="col-span-2">
              <TextField
                label="Dirección de entrega"
                value={form.address}
                onChange={v => set('address', v)}
                placeholder="Av. Corrientes 1234, CABA"
                error={fieldErrors.address}
              />
            </div>
          </div>
        </section>

        {/* ── 2. Experiencia ── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Experiencia con el vino</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">¿Cómo describirías tu nivel?</p>
              <div className="space-y-2">
                {KNOWLEDGE.map(k => (
                  <RadioCard key={k} label={k}
                    selected={form.knowledge === k} onClick={() => set('knowledge', k)} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="¿Con qué frecuencia tomás vino?"
                options={FREQUENCIES} value={form.frequency} onChange={v => set('frequency', v)} />
              <SelectField label="Presupuesto habitual por botella"
                options={BUDGETS} value={form.budget} onChange={v => set('budget', v)} />
            </div>
          </div>
        </section>

        {/* ── 3. Estilo ── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Estilo de vino {fieldErrors.wineStyle && <span className="text-xs text-red-500 font-normal ml-2">{fieldErrors.wineStyle}</span>}
          </h2>
          <p className="text-sm text-gray-500 mb-4">¿Frescos y frutados, o más estructurados y complejos?</p>
          <div className="grid grid-cols-2 gap-3">
            <RadioCard label="Jóvenes / Frescos" desc="Livianos, frutados, para el día a día"
              selected={form.wineStyle === 'JOVENES'} onClick={() => set('wineStyle', 'JOVENES')} />
            <RadioCard label="Más cuerpo" desc="Estructura, taninos, madurez y complejidad"
              selected={form.wineStyle === 'MAS_CUERPO'} onClick={() => set('wineStyle', 'MAS_CUERPO')} />
          </div>
        </section>

        {/* ── 4. Tipos ── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Tipos de vino {fieldErrors.wineTypes && <span className="text-xs text-red-500 font-normal ml-2">{fieldErrors.wineTypes}</span>}
          </h2>
          <p className="text-sm text-gray-500 mb-4">Podés elegir más de uno</p>
          <div className="grid grid-cols-2 gap-3">
            {WINE_TYPES.map(t => (
              <CheckCard key={t} label={t}
                selected={form.wineTypes.includes(t)} onClick={() => toggleList('wineTypes', t)} />
            ))}
          </div>
        </section>

        {/* ── 5. Cepas ── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-gray-800">Rating por cepa</h2>
            <span className="text-xs text-gray-400">{ratedGrapes}/{GRAPES.length} calificadas</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">Del 1 al 5 (podés saltear las que no conocés)</p>
          <div>
            {GRAPES.map(g => (
              <StarRow key={g} label={g}
                value={form.grapeRatings[g] ?? 0}
                onChange={n => setForm(prev => ({ ...prev, grapeRatings: { ...prev.grapeRatings, [g]: n } }))} />
            ))}
          </div>
        </section>

        {/* ── 6. Nuevas experiencias ── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Nuevas experiencias</h2>
          <p className="text-sm text-gray-500 mb-4">¿Abierto/a a probar cepas o estilos nuevos?</p>
          <div className="space-y-2">
            {['Sí, me encanta descubrir cosas nuevas', 'No, prefiero lo que ya conozco', 'Depende del estilo'].map(opt => (
              <RadioCard key={opt} label={opt}
                selected={form.openToNew === opt} onClick={() => set('openToNew', opt)} />
            ))}
          </div>
        </section>

        {/* ── 7. Ocasiones ── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Ocasiones</h2>
          <p className="text-sm text-gray-500 mb-4">¿En qué momentos solés abrir una botella?</p>
          <div className="grid grid-cols-2 gap-2">
            {OCCASIONS.map(o => (
              <CheckCard key={o} label={o}
                selected={form.occasions.includes(o)} onClick={() => toggleList('occasions', o)} />
            ))}
          </div>
        </section>

        {/* ── 8. Comentarios ── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">¿Algo más que quieras contarnos?</h2>
          <p className="text-sm text-gray-500 mb-3">Alergias, preferencias especiales, lo que quieras.</p>
          <textarea
            value={form.comments}
            onChange={e => set('comments', e.target.value)}
            rows={3}
            placeholder="Ej: Soy vegano, evito vinos con clarificantes de origen animal..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F654E]/40 resize-none"
          />
        </section>

        {/* Submit */}
        <div className="flex items-center justify-between pb-4">
          <p className="text-xs text-gray-400"><span className="text-red-400">*</span> Campos obligatorios</p>
          <Button type="submit" disabled={saving}
            className="bg-[#7F654E] hover:bg-[#6a5441] text-white px-8 py-3 rounded-lg text-sm font-semibold"
          >
            {saving ? 'Guardando...' : 'Guardar encuesta'}
          </Button>
        </div>
      </form>
    </div>
  )
}
