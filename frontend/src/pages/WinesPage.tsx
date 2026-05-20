import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

import { winesService } from '@/services/wines'
import type { Wine, UploadStatus } from '@/types'

const UPLOAD_STATUS_LABELS: Record<UploadStatus, string> = {
  PENDING: 'Pendiente',
  UPLOADED: 'Subido',
  OUT_OF_STOCK: 'Sin stock',
}

const defaultValues: Wine = {
  name: '',
  grape: '',
  vintageYear: undefined,
  stockGondola: 0,
  stockCuartito: 0,
  referencePrice: 0,
  isClubEligible: false,
  tiendanubeProductId: '',
  uploadStatus: 'PENDING',
}

export function WinesPage() {
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Wine>({ defaultValues })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setWines(await winesService.getAll())
    } catch {
      toast.error('Error al cargar vinos')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    reset(defaultValues)
    setEditingId(null)
    setDialogOpen(true)
  }

  function openEdit(wine: Wine) {
    reset(wine)
    setEditingId(wine.id!)
    setDialogOpen(true)
  }

  async function onSubmit(data: Wine) {
    try {
      const payload = {
        ...data,
        stockGondola: Number(data.stockGondola),
        stockCuartito: Number(data.stockCuartito),
        referencePrice: Number(data.referencePrice),
        vintageYear: data.vintageYear ? Number(data.vintageYear) : undefined,
        isClubEligible: Boolean(data.isClubEligible),
      }
      if (editingId) {
        await winesService.update(editingId, payload)
        toast.success('Vino actualizado')
      } else {
        await winesService.create(payload)
        toast.success('Vino creado')
      }
      setDialogOpen(false)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await winesService.delete(deleteId)
      toast.success('Vino eliminado')
      setDeleteId(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Vinos</h1>
        <Button onClick={openCreate}>
          <Plus size={16} /> Nuevo vino
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Uva</TableHead>
                <TableHead>Año</TableHead>
                <TableHead className="text-right">Góndola</TableHead>
                <TableHead className="text-right">Cuartito</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Precio ref.</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    No hay vinos registrados
                  </TableCell>
                </TableRow>
              ) : wines.map(wine => (
                <TableRow key={wine.id}>
                  <TableCell className="font-medium">{wine.name}</TableCell>
                  <TableCell>{wine.grape}</TableCell>
                  <TableCell>{wine.vintageYear ?? '—'}</TableCell>
                  <TableCell className="text-right">{wine.stockGondola}</TableCell>
                  <TableCell className="text-right">{wine.stockCuartito}</TableCell>
                  <TableCell className="text-right font-medium">{wine.stockTotal ?? wine.stockGondola + wine.stockCuartito}</TableCell>
                  <TableCell className="text-right">${wine.referencePrice?.toLocaleString('es-AR')}</TableCell>
                  <TableCell>
                    {wine.category && (
                      <Badge variant={wine.category === 'ENVERO' ? 'default' : 'secondary'}>
                        {wine.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={wine.isClubEligible ? 'default' : 'outline'}>
                      {wine.isClubEligible ? 'Sí' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {wine.uploadStatus && (
                      <Badge variant="outline">{UPLOAD_STATUS_LABELS[wine.uploadStatus]}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(wine)}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(wine.id!)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar vino' : 'Nuevo vino'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Nombre</Label>
              <Input {...register('name', { required: true })} placeholder="Ej: Malbec Reserva" />
            </div>
            <div className="space-y-1">
              <Label>Uva</Label>
              <Input {...register('grape')} placeholder="Ej: Malbec" />
            </div>
            <div className="space-y-1">
              <Label>Año</Label>
              <Input type="number" {...register('vintageYear')} placeholder="Ej: 2022" />
            </div>
            <div className="space-y-1">
              <Label>Stock Góndola</Label>
              <Input type="number" {...register('stockGondola')} />
            </div>
            <div className="space-y-1">
              <Label>Stock Cuartito</Label>
              <Input type="number" {...register('stockCuartito')} />
            </div>
            <div className="space-y-1">
              <Label>Precio referencia ($)</Label>
              <Input type="number" {...register('referencePrice')} />
            </div>
            <div className="space-y-1">
              <Label>ID Tiendanube</Label>
              <Input {...register('tiendanubeProductId')} placeholder="Opcional" />
            </div>
            <div className="space-y-1">
              <Label>Estado Tiendanube</Label>
              <select
                {...register('uploadStatus')}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="PENDING">Pendiente</option>
                <option value="UPLOADED">Subido</option>
                <option value="OUT_OF_STOCK">Sin stock</option>
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="clubEligible" {...register('isClubEligible')} />
              <Label htmlFor="clubEligible">Apto para el club</Label>
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {editingId ? 'Guardar cambios' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar vino</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro? Esta acción no se puede deshacer.
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
