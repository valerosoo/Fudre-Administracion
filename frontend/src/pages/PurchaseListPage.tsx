import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Trash2, ImageIcon, Phone, Mail, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

import { purchaseListService } from '@/services/purchaseList'
import { ordersService } from '@/services/orders'
import type { PurchaseListItem } from '@/types'

export function PurchaseListPage() {
  const [items, setItems] = useState<PurchaseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setItems(await purchaseListService.getAll())
    } catch {
      toast.error('Error al cargar la lista de compra')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateQty(item: PurchaseListItem, delta: number) {
    const newQty = item.quantity + delta
    try {
      await purchaseListService.updateQuantity(item.id!, newQty)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  async function handleRemove(item: PurchaseListItem) {
    try {
      await purchaseListService.removeItem(item.id!)
      toast.success(`${item.name} eliminado`)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  async function handleSaveOrder() {
    setSavingOrder(true)
    try {
      await ordersService.createFromPurchaseList()
      toast.success('Pedido guardado como Pendiente')
      navigate('/orders')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar pedido')
    } finally {
      setSavingOrder(false)
    }
  }

  async function handleClearAll() {
    try {
      await purchaseListService.clearAll()
      toast.success('Lista vaciada')
      setClearDialogOpen(false)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  // Group items by distributor
  const byDistributor = items.reduce<Map<number, { name: string; phone?: string; email?: string; items: PurchaseListItem[] }>>(
    (map, item) => {
      if (!map.has(item.distributorId)) {
        map.set(item.distributorId, {
          name: item.distributorName,
          phone: item.distributorPhone,
          email: item.distributorEmail,
          items: [],
        })
      }
      map.get(item.distributorId)!.items.push(item)
      return map
    },
    new Map()
  )

  const grandTotal = items.reduce((sum, i) => sum + i.purchasePrice * i.quantity, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Lista de compra</h1>
        {items.length > 0 && (
          <div className="flex gap-2">
            <Button onClick={handleSaveOrder} disabled={savingOrder}>
              <ClipboardList size={14} /> {savingOrder ? 'Guardando...' : 'Guardar como pedido'}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setClearDialogOpen(true)}>
              <Trash2 size={14} /> Vaciar lista
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">
          La lista de compra está vacía. Agregá ítems desde la Lista de precios.
        </p>
      ) : (
        <div className="space-y-8">
          {[...byDistributor.entries()].map(([distId, group]) => {
            const subtotal = group.items.reduce((s, i) => s + i.purchasePrice * i.quantity, 0)
            return (
              <div key={distId} className="rounded-lg border bg-card overflow-hidden">
                {/* Distributor header */}
                <div className="bg-muted/50 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-b">
                  <span className="font-semibold text-base">{group.name}</span>
                  {group.phone && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone size={13} /> {group.phone}
                    </span>
                  )}
                  {group.email && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail size={13} /> {group.email}
                    </span>
                  )}
                </div>

                {/* Items table */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs uppercase">
                      <th className="w-10 px-4 py-2"></th>
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Uva</th>
                      <th className="px-4 py-2 text-left">Año</th>
                      <th className="px-4 py-2 text-right">Precio unit.</th>
                      <th className="px-4 py-2 text-center">Cantidad</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map(item => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-8 w-8 object-cover rounded" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                              <ImageIcon size={14} className="text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 font-medium">{item.name}</td>
                        <td className="px-4 py-2 text-muted-foreground">{item.grape ?? '—'}</td>
                        <td className="px-4 py-2 text-muted-foreground">{item.vintageYear ?? '—'}</td>
                        <td className="px-4 py-2 text-right">${item.purchasePrice.toLocaleString('es-AR')}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item, -1)}
                              className="h-7 w-7 rounded border flex items-center justify-center text-base leading-none hover:bg-accent"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item, 1)}
                              className="h-7 w-7 rounded border flex items-center justify-center text-base leading-none hover:bg-accent"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          ${(item.purchasePrice * item.quantity).toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemove(item)}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Section subtotal */}
                <div className="px-4 py-2 bg-muted/30 flex justify-end border-t">
                  <span className="text-sm font-semibold">
                    Subtotal {group.name}: ${subtotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Grand total */}
          <div className="flex justify-end">
            <div className="rounded-lg border bg-card px-6 py-3">
              <span className="text-lg font-bold">Total general: ${grandTotal.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Clear all confirmation */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Vaciar lista de compra</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro? Se eliminarán todos los ítems de la lista.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleClearAll}>Vaciar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
