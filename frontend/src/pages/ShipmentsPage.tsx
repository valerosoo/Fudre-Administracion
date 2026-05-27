import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { Trash2, Plus, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ImportButton } from '@/components/ImportButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

import { shipmentsService } from '@/services/shipments'
import { membersService } from '@/services/members'
import { membershipsService } from '@/services/memberships'
import { winesService } from '@/services/wines'
import type { Shipment, Member, Membership, Wine } from '@/types'

const defaultValues: Shipment = {
  memberId: 0,
  membershipId: 0,
  shippedAt: new Date().toISOString().slice(0, 10),
  shippingCost: 0,
  notes: '',
  items: [{ wineId: 0, quantity: 1, unitPrice: 0 }],
}

export function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [search, setSearch] = useState('')
  const [dateSort, setDateSort] = useState<'asc' | 'desc' | ''>('')

  const { register, handleSubmit, reset, control, formState: { isSubmitting } } = useForm<Shipment>({ defaultValues })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [sh, membs, mships, wns] = await Promise.all([
        shipmentsService.getAll(),
        membersService.getAll(),
        membershipsService.getAll(),
        winesService.getAll(),
      ])
      setShipments(sh)
      setMembers(membs)
      setMemberships(mships)
      setWines(wns)
    } catch {
      toast.error('Error al cargar envíos')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    reset({ ...defaultValues, memberId: members[0]?.id ?? 0, membershipId: memberships[0]?.id ?? 0 })
    setDialogOpen(true)
  }

  async function onSubmit(data: Shipment) {
    try {
      const payload: Shipment = {
        ...data,
        memberId: Number(data.memberId),
        membershipId: Number(data.membershipId),
        shippingCost: Number(data.shippingCost),
        items: data.items?.map(it => ({
          wineId: Number(it.wineId),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      }
      await shipmentsService.create(payload)
      toast.success('Envío registrado')
      setDialogOpen(false)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await shipmentsService.delete(deleteId)
      toast.success('Envío eliminado y stock restaurado')
      setDeleteId(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Envíos</h1>
        <div className="flex gap-2">
          <ImportButton entity="shipments" onSuccess={load} />
          <Button onClick={openCreate} disabled={members.length === 0 || memberships.length === 0}>
            <Plus size={16} /> Nuevo envío
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Buscar por miembro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-52"
        />
        <button
          type="button"
          onClick={() => setDateSort(s => s === '' ? 'desc' : s === 'desc' ? 'asc' : '')}
          className={`h-10 rounded-md border border-input bg-background px-3 text-sm flex items-center gap-1 cursor-pointer transition-colors ${dateSort ? 'border-primary text-primary' : ''}`}
        >
          {dateSort === 'desc' ? <ChevronDown size={14} /> : dateSort === 'asc' ? <ChevronUp size={14} /> : <ChevronsUpDown size={14} />}
          {dateSort === 'desc' ? 'Fecha más reciente' : dateSort === 'asc' ? 'Fecha más antigua' : 'Ordenar fecha'}
        </button>
        {(search || dateSort) && (
          <button
            type="button"
            onClick={() => { setSearch(''); setDateSort('') }}
            className="h-10 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (() => {
        const filtered = shipments
          .filter(s => !search || (s.memberName ?? '').toLowerCase().includes(search.toLowerCase()))
          .sort((a, b) => {
            if (!dateSort) return 0
            const da = a.shippedAt ?? ''
            const db = b.shippedAt ?? ''
            return dateSort === 'asc' ? da.localeCompare(db) : db.localeCompare(da)
          })
        return (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Costo envío</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay envíos registrados
                  </TableCell>
                </TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.memberName ?? `#${s.memberId}`}</TableCell>
                  <TableCell>{s.memberEmail ?? '—'}</TableCell>
                  <TableCell>{s.shippedAt?.slice(0, 10) ?? '—'}</TableCell>
                  <TableCell className="text-right">${s.shippingCost?.toLocaleString('es-AR') ?? 0}</TableCell>
                  <TableCell className="text-right">{s.items?.length ?? 0}</TableCell>
                  <TableCell className="max-w-xs truncate">{s.notes ?? '—'}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(s.id!)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )
      })()}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo envío</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Miembro</Label>
                <select
                  {...register('memberId', { required: true })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Membresía</Label>
                <select
                  {...register('membershipId', { required: true })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {memberships.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.memberName} — {m.plan.replace('_PLUS', '+')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Fecha de envío</Label>
                <Input type="date" {...register('shippedAt')} />
              </div>
              <div className="space-y-1">
                <Label>Costo de envío ($)</Label>
                <Input type="number" {...register('shippingCost')} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Vinos incluidos</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ wineId: wines[0]?.id ?? 0, quantity: 1, unitPrice: 0 })}
                >
                  <Plus size={14} /> Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Vino</Label>
                      <select
                        {...register(`items.${idx}.wineId`, { required: true })}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {wines.map(w => <option key={w.id} value={w.id}>{w.name} ({w.grape})</option>)}
                      </select>
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Cantidad</Label>
                      <Input type="number" min={1} {...register(`items.${idx}.quantity`)} className="h-9" />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Precio unit.</Label>
                      <Input type="number" {...register(`items.${idx}.unitPrice`)} className="h-9" />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 shrink-0"
                      onClick={() => remove(idx)}
                      disabled={fields.length === 1}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea {...register('notes')} rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>Registrar envío</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Eliminar envío</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            El stock de los vinos incluidos será restaurado automáticamente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
