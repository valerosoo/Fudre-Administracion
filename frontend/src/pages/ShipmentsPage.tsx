import { useEffect, useState, Fragment } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { Trash2, Plus, X, Sparkles, CheckCircle, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import type { Shipment, Member, Membership, Wine, ShipmentStatus } from '@/types'

type Tab = 'memberships' | 'standalone' | 'history'

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PROPOSED: 'Propuesto',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
}

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  PROPOSED: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

function StatusBadge({ status }: { status?: ShipmentStatus }) {
  if (!status) return null
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

const defaultValues: Shipment = {
  memberId: 0,
  membershipId: 0,
  shippedAt: new Date().toISOString().slice(0, 10),
  shippingCost: 0,
  notes: '',
  type: 'STANDALONE',
  status: 'CONFIRMED',
  items: [{ wineId: 0, quantity: 1, unitPrice: 0 }],
}

export function ShipmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('memberships')
  const [membershipShipments, setMembershipShipments] = useState<Shipment[]>([])
  const [standaloneShipments, setStandaloneShipments] = useState<Shipment[]>([])
  const [allShipments, setAllShipments] = useState<Shipment[]>([])
  const [historySearch, setHistorySearch] = useState('')
  const [historyMonth, setHistoryMonth] = useState('')
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [expandedMembershipId, setExpandedMembershipId] = useState<number | null>(null)

  const now = new Date()

  const { register, handleSubmit, reset, control, formState: { isSubmitting } } = useForm<Shipment>({ defaultValues })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [mem, stand, all, membs, mships, wns] = await Promise.all([
        shipmentsService.getByType('MEMBERSHIP'),
        shipmentsService.getByType('STANDALONE'),
        shipmentsService.getAll(),
        membersService.getAll(),
        membershipsService.getAll(),
        winesService.getAll(),
      ])
      setMembershipShipments(mem)
      setStandaloneShipments(stand)
      setAllShipments(all.slice().sort((a, b) =>
        (b.shippedAt ?? '').localeCompare(a.shippedAt ?? '')
      ))
      setMembers(membs)
      setMemberships(mships)
      setWines(wns)
    } catch {
      toast.error('Error al cargar envíos')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateProposals() {
    setGenerating(true)
    try {
      const created = await shipmentsService.generateProposals(now.getFullYear(), now.getMonth() + 1)
      if (created.length === 0) {
        toast.info('Ya existen propuestas para todos los miembros este mes')
      } else {
        toast.success(`${created.length} propuesta(s) generadas para ${now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`)
      }
      const updated = await shipmentsService.getByType('MEMBERSHIP')
      setMembershipShipments(updated)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al generar propuestas')
    } finally {
      setGenerating(false)
    }
  }

  async function handleConfirm(id: number) {
    setConfirmingId(id)
    try {
      await shipmentsService.confirm(id)
      toast.success('Envío confirmado y stock descontado')
      const updated = await shipmentsService.getByType('MEMBERSHIP')
      setMembershipShipments(updated)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al confirmar')
    } finally {
      setConfirmingId(null)
    }
  }

  async function confirmCancel() {
    if (!cancelId) return
    try {
      await shipmentsService.cancel(cancelId)
      toast.success('Envío cancelado')
      setCancelId(null)
      const updated = await shipmentsService.getByType('MEMBERSHIP')
      setMembershipShipments(updated)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cancelar')
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

  function openCreateStandalone() {
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
        type: 'STANDALONE',
        status: 'CONFIRMED',
        items: data.items?.map(it => ({
          wineId: Number(it.wineId),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      }
      await shipmentsService.create(payload)
      toast.success('Pedido separado registrado')
      setDialogOpen(false)
      const updated = await shipmentsService.getByType('STANDALONE')
      setStandaloneShipments(updated)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Envíos</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b mb-5">
        {(['memberships', 'standalone', 'history'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {tab === 'memberships' ? 'Membresías' : tab === 'standalone' ? 'Pedidos Separados' : 'Historial'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : activeTab === 'memberships' ? (
        /* ── MEMBERSHIPS TAB ── */
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Propuestas mensuales generadas automáticamente. Confirmá antes de despachar.
            </p>
            <Button onClick={handleGenerateProposals} disabled={generating}>
              <Sparkles size={16} />
              {generating ? 'Generando...' : `Generar propuestas de ${now.toLocaleDateString('es-AR', { month: 'long' })}`}
            </Button>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Miembro</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Fecha propuesta</TableHead>
                      <TableHead className="text-right">Vinos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membershipShipments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No hay envíos de membresía. Generá las propuestas del mes.
                        </TableCell>
                      </TableRow>
                    ) : membershipShipments.map(s => (
                      <Fragment key={s.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => setExpandedMembershipId(expandedMembershipId === s.id ? null : s.id!)}
                        >
                          <TableCell className="text-xs text-gray-400 text-center">
                            {expandedMembershipId === s.id ? '▲' : '▼'}
                          </TableCell>
                          <TableCell className="font-medium">{s.memberName ?? `#${s.memberId}`}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {memberships.find(m => m.id === s.membershipId)?.plan?.replace('_PLUS', '+') ?? '—'}
                          </TableCell>
                          <TableCell>{s.shippedAt?.slice(0, 10) ?? '—'}</TableCell>
                          <TableCell className="text-right">{s.items?.length ?? 0}</TableCell>
                          <TableCell><StatusBadge status={s.status} /></TableCell>
                          <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">{s.notes ?? '—'}</TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <div className="flex gap-1">
                              {s.status === 'PROPOSED' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                    disabled={confirmingId === s.id}
                                    onClick={() => handleConfirm(s.id!)}
                                  >
                                    <CheckCircle size={12} />
                                    {confirmingId === s.id ? '...' : 'Confirmar'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs text-red-700 border-red-300 hover:bg-red-50"
                                    onClick={() => setCancelId(s.id!)}
                                  >
                                    <XCircle size={12} />
                                    Cancelar
                                  </Button>
                                </>
                              )}
                              {(s.status === 'CANCELLED' || s.status === 'CONFIRMED') && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => setDeleteId(s.id!)}
                                >
                                  <Trash2 size={13} className="text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedMembershipId === s.id && (s.items?.length ?? 0) > 0 && (
                          <TableRow key={`${s.id}-detail`} className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={8} className="py-3 px-10">
                              <div className="space-y-1.5">
                                {s.items!.map(item => (
                                  <div key={item.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#7F654E] inline-block" />
                                      <span className="font-medium">{item.wineName}</span>
                                      {item.wineGrape && (
                                        <span className="text-xs text-muted-foreground">({item.wineGrape})</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span>{item.quantity} u.</span>
                                      {item.unitPrice != null && item.unitPrice > 0 && (
                                        <span>${item.unitPrice.toLocaleString('es-AR')}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : activeTab === 'standalone' ? (
        /* ── STANDALONE TAB ── */
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Pedidos individuales de clientes, fuera de la membresía.
            </p>
            <Button onClick={openCreateStandalone} disabled={members.length === 0 || memberships.length === 0}>
              <Plus size={16} /> Nuevo pedido
            </Button>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead className="text-right">Costo envío</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standaloneShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No hay pedidos separados registrados
                    </TableCell>
                  </TableRow>
                ) : standaloneShipments.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.memberName ?? `#${s.memberId}`}</TableCell>
                    <TableCell>{s.memberEmail ?? '—'}</TableCell>
                    <TableCell>{s.shippedAt?.slice(0, 10) ?? '—'}</TableCell>
                    <TableCell>
                      {s.tiendanubeOrderId ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          TN #{s.tiendanubeOrderId}
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Manual</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">${s.shippingCost?.toLocaleString('es-AR') ?? 0}</TableCell>
                    <TableCell className="text-right">{s.items?.length ?? 0}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
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
        </div>
      ) : (
        /* ── HISTORY TAB ── */
        (() => {
          const filtered = allShipments.filter(s => {
            const matchName = !historySearch ||
              (s.memberName ?? '').toLowerCase().includes(historySearch.toLowerCase())
            const matchMonth = !historyMonth || (s.shippedAt ?? '').startsWith(historyMonth)
            return matchName && matchMonth
          })

          return (
            <div>
              <div className="flex flex-wrap gap-3 mb-4 items-center">
                <input
                  type="text"
                  placeholder="Buscar por miembro..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <input
                  type="month"
                  value={historyMonth}
                  onChange={e => setHistoryMonth(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {(historySearch || historyMonth) && (
                  <button
                    onClick={() => { setHistorySearch(''); setHistoryMonth('') }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Limpiar filtros
                  </button>
                )}
                <span className="ml-auto text-xs text-muted-foreground">{filtered.length} envío(s)</span>
              </div>

              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Miembro</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Vinos</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No hay envíos que coincidan con los filtros
                        </TableCell>
                      </TableRow>
                    ) : filtered.map(s => (
                      <Fragment key={s.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => setExpandedHistoryId(expandedHistoryId === s.id ? null : s.id!)}
                        >
                          <TableCell className="font-medium">
                            {s.shippedAt?.slice(0, 10) ?? '—'}
                          </TableCell>
                          <TableCell>{s.memberName ?? `#${s.memberId}`}</TableCell>
                          <TableCell>
                            {s.type === 'MEMBERSHIP' ? (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                Membresía
                              </span>
                            ) : s.tiendanubeOrderId ? (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                TN #{s.tiendanubeOrderId}
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                Manual
                              </span>
                            )}
                          </TableCell>
                          <TableCell><StatusBadge status={s.status} /></TableCell>
                          <TableCell className="text-right">{s.items?.length ?? 0}</TableCell>
                          <TableCell className="text-xs text-gray-400 text-center">
                            {expandedHistoryId === s.id ? '▲' : '▼'}
                          </TableCell>
                        </TableRow>
                        {expandedHistoryId === s.id && (s.items?.length ?? 0) > 0 && (
                          <TableRow key={`${s.id}-detail`} className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={6} className="py-3 px-6">
                              <div className="space-y-1.5">
                                {s.items!.map(item => (
                                  <div key={item.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#7F654E] inline-block" />
                                      <span className="font-medium">{item.wineName}</span>
                                      {item.wineGrape && (
                                        <span className="text-xs text-muted-foreground">({item.wineGrape})</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span>{item.quantity} u.</span>
                                      {item.unitPrice != null && item.unitPrice > 0 && (
                                        <span>${item.unitPrice.toLocaleString('es-AR')}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        })()
      )}

      {/* Create standalone dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo pedido separado</DialogTitle>
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
                <Label>Fecha</Label>
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
              <Button type="submit" disabled={isSubmitting}>Registrar pedido</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel membership shipment dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cancelar propuesta</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            El envío quedará marcado como cancelado. Si ya estaba confirmado, se restaurará el stock.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>Volver</Button>
            <Button variant="destructive" onClick={confirmCancel}>Cancelar envío</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Eliminar envío</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            El stock de los vinos incluidos será restaurado automáticamente si el envío estaba confirmado.
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
