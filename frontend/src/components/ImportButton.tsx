import { useState, useRef } from 'react'
import { Upload, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

const IMPORT_URL = 'http://localhost:8081'

type Entity = 'wines' | 'members' | 'memberships' | 'shipments'

interface Props {
  entity: Entity
  onSuccess: () => void
}

const ENTITY_LABELS: Record<Entity, string> = {
  wines:        'vinos',
  members:      'miembros',
  memberships:  'membresías',
  shipments:    'envíos',
}

// Campos relevantes a mostrar en el preview por entidad
const PREVIEW_FIELDS: Record<Entity, string[]> = {
  wines:       ['name', 'grape', 'vintageYear', 'referencePrice', 'uploadStatus'],
  members:     ['name', 'email', 'phone', 'address'],
  memberships: ['memberName', 'plan', 'startDate', 'isActive'],
  shipments:   ['memberName', 'shippedAt', 'shippingCost'],
}

function PreviewTable({ items, entity }: { items: Record<string, unknown>[]; entity: Entity }) {
  const fields = PREVIEW_FIELDS[entity]
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, 5)

  return (
    <div className="text-sm">
      <div className="overflow-x-auto rounded border border-input">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted">
              {fields.map(f => (
                <th key={f} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i} className="border-t border-input">
                {fields.map(f => (
                  <td key={f} className="px-3 py-1.5 max-w-[200px] truncate">
                    {String(row[f] ?? '—')}
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
      const body = entity === 'members'
        ? { members: data.members, memberships: data.memberships }
        : { items: data.preview }

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

  const totalItems = entity === 'members'
    ? (data?.members?.length ?? 0) + (data?.memberships?.length ?? 0)
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
                  <p className="text-xs text-muted-foreground mt-3">PDF · Excel · CSV</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
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
                  <PreviewTable items={data.preview} entity={entity} />
                </div>
              )}

              {/* Miembros */}
              {data.members && data.members.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Miembros ({data.members.length})
                  </p>
                  <PreviewTable items={data.members} entity="members" />
                </div>
              )}

              {/* Membresías detectadas junto con miembros */}
              {data.memberships && data.memberships.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Membresías detectadas ({data.memberships.length})
                  </p>
                  <PreviewTable items={data.memberships} entity="memberships" />
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
