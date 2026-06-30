import { useState, useRef } from 'react'
import { Upload, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

const IMPORT_URL = 'http://localhost:8081'

type Entity = 'wines' | 'members' | 'memberships' | 'shipments' | 'price_list' | 'order'

interface Props {
  entity: Entity
  onSuccess: () => void
}

const ENTITY_LABELS: Record<Entity, string> = {
  wines:        'vinos',
  members:      'miembros',
  memberships:  'membresías',
  shipments:    'envíos',
  price_list:   'lista de precios',
  order:        'pedido',
}

// Campos relevantes a mostrar en el preview por entidad
const PREVIEW_FIELDS: Record<Entity, string[]> = {
  wines:       ['name', 'grape', 'vintageYear', 'referencePrice', 'uploadStatus'],
  members:     ['name', 'email', 'phone', 'address'],
  memberships: ['memberName', 'plan', 'startDate', 'isActive'],
  shipments:   ['memberName', 'shippedAt', 'shippingCost'],
  price_list:  ['imageUrl', 'name', 'grape', 'vintageYear', 'purchasePrice', 'boxPurchasePrice', 'recommendedSalePrice'],
  order:       ['name', 'grape', 'vintageYear', 'purchasePrice', 'quantity'],
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  grape: 'Uva',
  vintageYear: 'Año',
  referencePrice: 'Precio ref.',
  uploadStatus: 'Estado',
  email: 'Email',
  phone: 'Teléfono',
  address: 'Dirección',
  memberName: 'Miembro',
  plan: 'Plan',
  startDate: 'Inicio',
  isActive: 'Activa',
  shippedAt: 'Fecha',
  shippingCost: 'Envío',
  purchasePrice: 'Precio unit.',
  boxPurchasePrice: 'Precio caja',
  recommendedSalePrice: 'PVP recomendado',
  quantity: 'Cantidad',
  imageUrl: 'Imagen',
}

const NUMERIC_FIELDS = new Set([
  'vintageYear',
  'referencePrice',
  'shippingCost',
  'purchasePrice',
  'boxPurchasePrice',
  'recommendedSalePrice',
  'quantity',
])

function parseFieldValue(field: string, value: string) {
  if (value.trim() === '') return null
  if (!NUMERIC_FIELDS.has(field)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function PreviewTable({
  items,
  entity,
  editable = false,
  onChange,
}: {
  items: Record<string, unknown>[]
  entity: Entity
  editable?: boolean
  onChange?: (index: number, field: string, value: unknown) => void
}) {
  const fields = PREVIEW_FIELDS[entity]
  const [expanded, setExpanded] = useState(false)
  const visible = expanded
    ? items.map((row, index) => ({ row, index }))
    : items.slice(0, 5).map((row, index) => ({ row, index }))

  return (
    <div className="text-sm">
      <div className="overflow-x-auto rounded border border-input">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted">
              {fields.map(f => (
                <th key={f} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                  {FIELD_LABELS[f] ?? f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(({ row, index }) => (
              <tr key={index} className="border-t border-input">
                {fields.map(f => (
                  <td key={f} className={f === 'imageUrl' ? 'px-3 py-1.5 min-w-48 max-w-64' : 'px-3 py-1.5 min-w-28 max-w-52'}>
                    {editable && f === 'imageUrl' ? (
                      <div className="flex items-center gap-2">
                        {typeof row[f] === 'string' && row[f] ? (
                          <img src={row[f]} alt="" className="h-8 w-8 rounded object-cover bg-muted" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted" />
                        )}
                        <Input
                          type="text"
                          value={row[f] == null ? '' : String(row[f])}
                          onChange={e => onChange?.(index, f, e.target.value.trim() === '' ? null : e.target.value)}
                          placeholder="URL imagen"
                          className="h-8 text-xs"
                        />
                      </div>
                    ) : editable ? (
                      <Input
                        type={NUMERIC_FIELDS.has(f) ? 'number' : 'text'}
                        value={row[f] == null ? '' : String(row[f])}
                        onChange={e => onChange?.(index, f, parseFieldValue(f, e.target.value))}
                        className="h-8 text-xs"
                      />
                    ) : (
                      f === 'imageUrl' && typeof row[f] === 'string' && row[f] ? (
                        <img src={row[f]} alt="" className="h-8 w-8 rounded object-cover bg-muted" />
                      ) : (
                        <span className="block truncate">{String(row[f] ?? '-')}</span>
                      )
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Ver menos' : `Ver los ${items.length - 5} restantes`}
        </button>
      )}
    </div>
  )
}

interface PreviewData {
  entity: Entity
  preview?: Record<string, unknown>[]
  members?: Record<string, unknown>[]
  memberships?: Record<string, unknown>[]
  distributor?: { name: string; phone?: string | null; email?: string | null }
  items?: Record<string, unknown>[]
  imageCandidates?: string[]
  count: number
}

export function ImportButton({ entity, onSuccess }: Props) {
  const [open, setOpen]           = useState(false)
  const [dragging, setDragging]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [data, setData]           = useState<PreviewData | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setData(null)
    setLoading(false)
  }

  function close() {
    setOpen(false)
    reset()
  }

  async function processFile(file: File) {
    setLoading(true)
    setData(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`${IMPORT_URL}/import/${entity}`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error desconocido')
      setData(json)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error procesando el archivo')
    } finally {
      setLoading(false)
    }
  }

  async function confirmImport() {
    if (!data) return
    setConfirming(true)
    try {
      let body: unknown
      if (entity === 'members') {
        body = { members: data.members, memberships: data.memberships }
      } else if (entity === 'price_list' || entity === 'order') {
        body = { distributor: data.distributor, items: data.items }
      } else {
        body = { items: data.preview }
      }

      const res = await fetch(`${IMPORT_URL}/import/${entity}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (result.success > 0) toast.success(`${result.success} registros importados`)
      if (result.errors?.length > 0) toast.error(`${result.errors.length} errores al importar`)
      close()
      onSuccess()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al confirmar')
    } finally {
      setConfirming(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function updateRows(section: 'preview' | 'members' | 'memberships' | 'items', index: number, field: string, value: unknown) {
    setData(prev => {
      if (!prev) return prev
      const rows = prev[section]
      if (!rows) return prev
      return {
        ...prev,
        [section]: rows.map((row, i) => i === index ? { ...row, [field]: value } : row),
      }
    })
  }

  function updateDistributor(field: 'name' | 'phone' | 'email', value: string) {
    setData(prev => {
      if (!prev) return prev
      const distributor = prev.distributor ?? { name: '' }
      return {
        ...prev,
        distributor: {
          ...distributor,
          [field]: field === 'name' ? value : value.trim() === '' ? null : value,
        },
      }
    })
  }

  async function copyImageUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL de imagen copiada')
    } catch {
      toast.error('No se pudo copiar la URL')
    }
  }

  const totalItems = entity === 'members'
    ? (data?.members?.length ?? 0) + (data?.memberships?.length ?? 0)
    : entity === 'price_list' || entity === 'order'
    ? (data?.items?.length ?? 0)
    : (data?.count ?? 0)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload size={16} /> Importar archivo
      </Button>

      <Dialog open={open} onOpenChange={o => { if (!o) close(); else setOpen(true) }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Importar {ENTITY_LABELS[entity]}</DialogTitle>
          </DialogHeader>

          {/* Drop zone */}
          {!data && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !loading && fileRef.current?.click()}
              className={[
                'border-2 border-dashed rounded-lg p-10 text-center transition-colors',
                loading ? 'cursor-wait opacity-60' : 'cursor-pointer',
                dragging ? 'border-primary bg-accent' : 'border-input hover:border-primary',
              ].join(' ')}
            >
              <Upload size={30} className="mx-auto mb-3 text-muted-foreground" />
              {loading ? (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Analizando archivo con IA...
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium">Arrastrá el archivo acá</p>
                  <p className="text-xs text-muted-foreground mt-1">o hacé click para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-3">PDF · Excel · CSV · Imagen</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]) }}
              />
            </div>
          )}

          {/* Preview */}
          {data && (
            <div className="flex-1 overflow-auto space-y-4">
              <p className="text-sm text-muted-foreground">
                Se detectaron <strong>{totalItems} registros</strong>. Revisá antes de confirmar:
              </p>

              {/* Vinos / Membresías / Envíos */}
              {data.preview && data.preview.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    {ENTITY_LABELS[entity]} ({data.preview.length})
                  </p>
                  <PreviewTable
                    items={data.preview}
                    entity={entity}
                    editable
                    onChange={(index, field, value) => updateRows('preview', index, field, value)}
                  />
                </div>
              )}

              {/* Lista de precios / Pedido */}
              {(entity === 'price_list' || entity === 'order') && data.distributor && (
                <div className="rounded border border-input bg-muted/30 px-4 py-3 text-sm">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      value={data.distributor.name ?? ''}
                      onChange={e => updateDistributor('name', e.target.value)}
                      placeholder="Distribuidor"
                      className="h-8 text-xs font-medium"
                    />
                    <Input
                      value={data.distributor.phone ?? ''}
                      onChange={e => updateDistributor('phone', e.target.value)}
                      placeholder="Teléfono"
                      className="h-8 text-xs"
                    />
                    <Input
                      value={data.distributor.email ?? ''}
                      onChange={e => updateDistributor('email', e.target.value)}
                      placeholder="Email"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
              {(entity === 'price_list' || entity === 'order') && data.imageCandidates && data.imageCandidates.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Imágenes detectadas ({data.imageCandidates.length})
                  </p>
                  <div className="flex gap-2 overflow-x-auto rounded border border-input p-2">
                    {data.imageCandidates.map(url => (
                      <div key={url} className="w-28 shrink-0 space-y-1">
                        <img src={url} alt="" className="h-20 w-28 rounded object-cover bg-muted" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyImageUrl(url)}
                          className="h-7 w-full text-xs"
                        >
                          Copiar URL
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(entity === 'price_list' || entity === 'order') && data.items && data.items.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Vinos ({data.items.length})
                  </p>
                  <PreviewTable
                    items={data.items}
                    entity={entity}
                    editable
                    onChange={(index, field, value) => updateRows('items', index, field, value)}
                  />
                </div>
              )}

              {/* Miembros */}
              {data.members && data.members.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Miembros ({data.members.length})
                  </p>
                  <PreviewTable
                    items={data.members}
                    entity="members"
                    editable
                    onChange={(index, field, value) => updateRows('members', index, field, value)}
                  />
                </div>
              )}

              {/* Membresías detectadas junto con miembros */}
              {data.memberships && data.memberships.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Membresías detectadas ({data.memberships.length})
                  </p>
                  <PreviewTable
                    items={data.memberships}
                    entity="memberships"
                    editable
                    onChange={(index, field, value) => updateRows('memberships', index, field, value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {data ? (
              <>
                <Button variant="outline" onClick={reset}>
                  <X size={14} /> Cambiar archivo
                </Button>
                <Button onClick={confirmImport} disabled={confirming}>
                  <Check size={14} />
                  {confirming ? 'Importando...' : `Confirmar (${totalItems} registros)`}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={close}>Cancelar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
