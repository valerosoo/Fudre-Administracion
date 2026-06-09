import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Trash2, Phone, Mail, ChevronDown, ChevronUp, Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ImportButton } from '@/components/ImportButton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

import { ordersService } from '@/services/orders'
import { priceListService } from '@/services/priceList'
import type { Order, OrderItem, OrderStatus, OrderItemStatus, PriceListItem } from '@/types'

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:   'Pendiente',
  ORDERED:   'Pedido',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING:   'secondary',
  ORDERED:   'default',
  DELIVERED: 'outline',
  CANCELLED: 'destructive',
}

const ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  ORDERED:                  'Pedido',
  NOT_ORDERED:              'No pedido',
  CANCELLED_BY_DISTRIBUTOR: 'Cancelado por distribuidor',
}

const ITEM_STATUS_COLORS: Record<OrderItemStatus, string> = {
  ORDERED:                  'text-green-700 bg-green-50 border-green-200',
  NOT_ORDERED:              'text-gray-500 bg-gray-50 border-gray-200',
  CANCELLED_BY_DISTRIBUTOR: 'text-red-600 bg-red-50 border-red-200',
}

const STATUS_FILTER_OPTIONS: { label: string; value: OrderStatus | 'ALL' }[] = [
  { label: 'Todos',     value: 'ALL'       },
  { label: 'Pendiente', value: 'PENDING'   },
  { label: 'Pedido',    value: 'ORDERED'   },
  { label: 'Entregado', value: 'DELIVERED' },
  { label: 'Cancelado', value: 'CANCELLED' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByDistributor(items: OrderItem[]) {
  const map = new Map<string, { phone?: string; email?: string; items: OrderItem[] }>()
  for (const item of items) {
    if (!map.has(item.distributorName)) {
      map.set(item.distributorName, { phone: item.distributorPhone, email: item.distributorEmail, items: [] })
    }
    map.get(item.distributorName)!.items.push(item)
  }
  return map
}

// ── CSV download ──────────────────────────────────────────────────────────────

function downloadCsv(order: Order) {
  const sep = ';'
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

  const rows = [
    ['Pedido #' + order.id, '', '', '', '', '', '', ''],
    ['Fecha pedido:', order.orderDate, '', '', '', '', '', ''],
    ...(order.deliveredAt ? [['Fecha entrega:', order.deliveredAt, '', '', '', '', '', '']] : []),
    ['Estado:', STATUS_LABELS[order.status], '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['Distribuidor', 'Nombre', 'Uva', 'Año', 'Estado ítem', 'Precio unitario', 'Cantidad', 'Subtotal'],
    ...(order.items ?? []).map(i => [
      i.distributorName,
      i.name,
      i.grape ?? '',
      i.vintageYear ?? '',
      i.itemStatus ? ITEM_STATUS_LABELS[i.itemStatus] ?? i.itemStatus : 'Pedido',
      i.purchasePrice ?? '',
      i.quantity,
      i.purchasePrice != null ? i.purchasePrice * i.quantity : '',
    ]),
    ['', '', '', '', '', '', 'TOTAL', order.totalAmount ?? ''],
  ]

  const csv = rows.map(r => r.map(esc).join(sep)).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `pedido-${order.id}-${order.orderDate}.csv`
  a.click()
}

// ── PDF download ──────────────────────────────────────────────────────────────

async function downloadPdf(order: Order) {
  try {
    // Dynamic import so we don't break if jspdf isn't installed yet
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    const totalAmount = order.totalAmount != null
      ? `$${Number(order.totalAmount).toLocaleString('es-AR')}`
      : '—'

    doc.setFontSize(16)
    doc.text(`Pedido #${order.id}`, 14, 18)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Fecha pedido: ${order.orderDate}    Estado: ${STATUS_LABELS[order.status]}`, 14, 26)
    if (order.deliveredAt) {
      doc.text(`Fecha entrega: ${order.deliveredAt}`, 14, 32)
    }
    doc.setTextColor(0)

    const rows = (order.items ?? []).map(i => [
      i.distributorName,
      i.name,
      i.grape ?? '—',
      String(i.vintageYear ?? '—'),
      i.itemStatus ? (ITEM_STATUS_LABELS[i.itemStatus] ?? i.itemStatus) : 'Pedido',
      i.purchasePrice != null ? `$${i.purchasePrice.toLocaleString('es-AR')}` : '—',
      String(i.quantity),
      i.purchasePrice != null ? `$${(i.purchasePrice * i.quantity).toLocaleString('es-AR')}` : '—',
    ])

    autoTable(doc, {
      startY: order.deliveredAt ? 38 : 32,
      head: [['Distribuidor', 'Nombre', 'Uva', 'Año', 'Estado', 'Precio', 'Cant.', 'Subtotal']],
      body: rows,
      foot: [['', '', '', '', '', '', 'Total', totalAmount]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [127, 101, 78] },
      footStyles: { fontStyle: 'bold' },
    })

    doc.save(`pedido-${order.id}-${order.orderDate}.pdf`)
  } catch {
    toast.error('Para descargar PDF, instalá la dependencia: npm install jspdf jspdf-autotable')
  }
}

// ── DownloadButton ─────────────────────────────────────────────────────────────

function DownloadButton({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }} className="ml-2">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="h-7 px-2 rounded border text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Download size={12} /> Descargar <ChevronDown size={10} />
      </button>
      {open && (
        <div style={{ position: 'fixed', zIndex: 9999 }} className="bg-white border border-input rounded-md shadow-lg min-w-44 py-1 mt-1">
          <button
            type="button"
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            onClick={() => { downloadCsv(order); setOpen(false) }}
          >Descargar CSV (.csv)</button>
          <button
            type="button"
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            onClick={() => { downloadPdf(order); setOpen(false) }}
          >Descargar PDF (.pdf)</button>
        </div>
      )}
    </div>
  )
}

// ── AddItemDialog ─────────────────────────────────────────────────────────────

function AddItemDialog({
  orderId,
  open,
  onClose,
  onAdded,
}: {
  orderId: number
  open: boolean
  onClose: () => void
  onAdded: () => void
}) {
  const [priceList, setPriceList] = useState<PriceListItem[]>([])
  const [search, setSearch] = useState('')
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [adding, setAdding] = useState<number | null>(null)

  useEffect(() => {
    if (open && priceList.length === 0) {
      priceListService.getAll().then(setPriceList).catch(() => toast.error('Error al cargar lista de precios'))
    }
  }, [open])

  const filtered = priceList.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAdd(item: PriceListItem) {
    const qty = quantities[item.id!] ?? 1
    setAdding(item.id!)
    try {
      await ordersService.addItem(orderId, item.id!, qty)
      toast.success(`${item.name} agregado`)
      onAdded()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setAdding(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle>Agregar vino al pedido</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        <div className="flex-1 overflow-y-auto rounded border border-input">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Nombre</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Uva</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Distribuidor</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">Precio</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground text-xs">Cant.</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-t border-input hover:bg-muted/30">
                  <td className="px-3 py-1.5 font-medium">{item.name}</td>
                  <td className="px-3 py-1.5 text-muted-foreground text-xs">{item.grape ?? '—'}</td>
                  <td className="px-3 py-1.5 text-muted-foreground text-xs">{item.distributorName}</td>
                  <td className="px-3 py-1.5 text-right text-xs">
                    {item.purchasePrice != null ? `$${item.purchasePrice.toLocaleString('es-AR')}` : '—'}
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      type="number" min={1}
                      value={quantities[item.id!] ?? 1}
                      onChange={e => setQuantities(prev => ({ ...prev, [item.id!]: Math.max(1, Number(e.target.value)) }))}
                      className="w-16 h-7 text-center px-1"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <Button size="sm" onClick={() => handleAdd(item)} disabled={adding === item.id}>
                      Agregar
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-sm">
                    {priceList.length === 0 ? 'No hay lista de precios cargada.' : 'Sin resultados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── OrderSection ──────────────────────────────────────────────────────────────

function OrderSection({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(order.status === 'PENDING')
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addItemOpen, setAddItemOpen] = useState(false)

  const isPending  = order.status === 'PENDING'
  const isOrdered  = order.status === 'ORDERED'
  const groups     = groupByDistributor(order.items ?? [])
  const totalAmount = order.totalAmount != null
    ? `$${Number(order.totalAmount).toLocaleString('es-AR')}`
    : null

  async function changeStatus(newStatus: OrderStatus) {
    try {
      await ordersService.updateStatus(order.id!, newStatus)
      toast.success(newStatus === 'DELIVERED'
        ? 'Pedido entregado. Stock actualizado en el sistema.'
        : `Estado actualizado a ${STATUS_LABELS[newStatus]}`)
      onRefresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  async function handleQtyChange(item: OrderItem, delta: number) {
    const current = quantities[item.id!] ?? item.quantity
    const newQty = Math.max(0, current + delta)
    setQuantities(prev => ({ ...prev, [item.id!]: newQty }))
    try {
      await ordersService.updateItemQty(order.id!, item.id!, newQty)
      onRefresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
      setQuantities(prev => ({ ...prev, [item.id!]: item.quantity }))
    }
  }

  async function handleItemStatusChange(item: OrderItem, newStatus: OrderItemStatus) {
    try {
      await ordersService.updateItemStatus(order.id!, item.id!, newStatus)
      onRefresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  async function handleRemoveItem(item: OrderItem) {
    try {
      await ordersService.removeItem(order.id!, item.id!)
      toast.success(`${item.name} eliminado`)
      onRefresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  async function handleDelete() {
    try {
      await ordersService.deleteOrder(order.id!)
      toast.success('Pedido eliminado')
      setDeleteDialogOpen(false)
      onRefresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Card header */}
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors select-none rounded-lg"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded
          ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" />
          : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-medium text-sm">Pedido #{order.id}</span>
          <span className="text-sm text-muted-foreground">Pedido: {order.orderDate}</span>
          {order.deliveredAt && (
            <span className="text-sm text-muted-foreground">Entregado: {order.deliveredAt}</span>
          )}
          <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABELS[order.status]}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
          <span>{order.totalItems} ítems</span>
          {totalAmount && <span className="font-medium text-foreground">{totalAmount}</span>}
        </div>
        <DownloadButton order={order} />
      </div>

      {expanded && (
        <div className="border-t rounded-b-lg overflow-hidden">
          {[...groups.entries()].map(([distName, group]) => (
            <div key={distName} className="border-b last:border-0">
              <div className="bg-muted/30 px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="font-medium text-sm">{distName}</span>
                {group.phone && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone size={11} /> {group.phone}
                  </span>
                )}
                {group.email && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail size={11} /> {group.email}
                  </span>
                )}
              </div>

              <table className="w-full text-sm">
                <tbody>
                  {group.items.map(item => (
                    <tr key={item.id} className="border-t border-input hover:bg-muted/20">
                      <td className="px-4 py-2 font-medium">{item.name}</td>
                      <td className="px-2 py-2 text-muted-foreground text-xs">{item.grape ?? '—'}</td>
                      <td className="px-2 py-2 text-muted-foreground text-xs">{item.vintageYear ?? '—'}</td>
                      <td className="px-2 py-2 text-right text-xs">
                        {item.purchasePrice != null ? `$${item.purchasePrice.toLocaleString('es-AR')}` : '—'}
                      </td>

                      {/* Item status */}
                      <td className="px-2 py-2">
                        {isOrdered ? (
                          <select
                            value={item.itemStatus ?? 'ORDERED'}
                            onChange={e => handleItemStatusChange(item, e.target.value as OrderItemStatus)}
                            onClick={e => e.stopPropagation()}
                            className={`text-xs rounded border px-1.5 py-0.5 ${ITEM_STATUS_COLORS[item.itemStatus ?? 'ORDERED']}`}
                          >
                            <option value="ORDERED">Pedido</option>
                            <option value="NOT_ORDERED">No pedido</option>
                            <option value="CANCELLED_BY_DISTRIBUTOR">Cancelado por distribuidor</option>
                          </select>
                        ) : item.itemStatus && item.itemStatus !== 'ORDERED' ? (
                          <span className={`text-xs rounded border px-1.5 py-0.5 ${ITEM_STATUS_COLORS[item.itemStatus]}`}>
                            {ITEM_STATUS_LABELS[item.itemStatus]}
                          </span>
                        ) : null}
                      </td>

                      {/* Quantity */}
                      <td className="px-2 py-2">
                        {isPending ? (
                          <div className="flex items-center gap-1 justify-center">
                            <button type="button" onClick={() => handleQtyChange(item, -1)}
                              className="h-6 w-6 rounded border flex items-center justify-center text-sm leading-none hover:bg-accent">−</button>
                            <span className="w-7 text-center text-sm font-medium">
                              {quantities[item.id!] ?? item.quantity}
                            </span>
                            <button type="button" onClick={() => handleQtyChange(item, 1)}
                              className="h-6 w-6 rounded border flex items-center justify-center text-sm leading-none hover:bg-accent">+</button>
                          </div>
                        ) : (
                          <span className="block text-center text-sm font-medium">{item.quantity}</span>
                        )}
                      </td>

                      <td className="px-2 py-2 text-right text-sm font-medium">
                        {item.purchasePrice != null
                          ? `$${(item.purchasePrice * item.quantity).toLocaleString('es-AR')}`
                          : '—'}
                      </td>

                      {isPending && (
                        <td className="px-2 py-2 w-8">
                          <button type="button" onClick={() => handleRemoveItem(item)}
                            className="text-destructive hover:text-destructive/80">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {totalAmount && (
            <div className="px-4 py-2 bg-muted/20 flex justify-end border-t text-sm font-semibold">
              Total: {totalAmount}
            </div>
          )}

          <div className="px-4 py-3 bg-muted/10 flex flex-wrap gap-2 justify-between items-center border-t">
            <div className="flex gap-2 flex-wrap">
              {isPending && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setAddItemOpen(true)}>
                    <Plus size={13} /> Agregar vino
                  </Button>
                  <Button size="sm" onClick={() => changeStatus('ORDERED')}>Confirmar pedido</Button>
                  <Button size="sm" variant="outline" onClick={() => changeStatus('CANCELLED')}>Cancelar</Button>
                </>
              )}
              {isOrdered && (
                <>
                  <Button size="sm" onClick={() => changeStatus('DELIVERED')}>Marcar entregado</Button>
                  <Button size="sm" variant="outline" onClick={() => changeStatus('CANCELLED')}>Cancelar</Button>
                </>
              )}
            </div>
            {(isPending || order.status === 'CANCELLED') && (
              <Button size="sm" variant="ghost" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 size={13} /> Eliminar pedido
              </Button>
            )}
          </div>
        </div>
      )}

      {addItemOpen && (
        <AddItemDialog
          orderId={order.id!}
          open={addItemOpen}
          onClose={() => setAddItemOpen(false)}
          onAdded={() => { setAddItemOpen(false); onRefresh() }}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Eliminar pedido #{order.id}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">¿Estás seguro? Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── OrdersPage ────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setOrders(await ordersService.getAll())
    } catch {
      toast.error('Error al cargar los pedidos')
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Lista de pedidos</h1>
        <ImportButton entity="order" onSuccess={load} />
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {STATUS_FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={`h-8 px-3 rounded-md text-sm border transition-colors ${
              filter === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">
          {orders.length === 0
            ? 'No hay pedidos. Guardá tu Lista de Compra como pedido o importá uno.'
            : 'No hay pedidos que coincidan con el filtro.'}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <OrderSection key={order.id} order={order} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  )
}
