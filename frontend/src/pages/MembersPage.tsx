import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus } from 'lucide-react'

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

import { membersService } from '@/services/members'
import type { Member } from '@/types'

const defaultValues: Member = {
  name: '',
  email: '',
  phone: '',
  address: '',
  tasteProfile: '',
  notes: '',
}

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Member>({ defaultValues })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setMembers(await membersService.getAll())
    } catch {
      toast.error('Error al cargar miembros')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    reset(defaultValues)
    setEditingId(null)
    setDialogOpen(true)
  }

  function openEdit(m: Member) {
    reset(m)
    setEditingId(m.id!)
    setDialogOpen(true)
  }

  async function onSubmit(data: Member) {
    try {
      if (editingId) {
        await membersService.update(editingId, data)
        toast.success('Miembro actualizado')
      } else {
        await membersService.create(data)
        toast.success('Miembro creado')
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
      await membersService.delete(deleteId)
      toast.success('Miembro eliminado')
      setDeleteId(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Miembros</h1>
        <Button onClick={openCreate}>
          <Plus size={16} /> Nuevo miembro
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
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Perfil de gusto</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay miembros registrados
                  </TableCell>
                </TableRow>
              ) : members.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.phone ?? '—'}</TableCell>
                  <TableCell>{m.address ?? '—'}</TableCell>
                  <TableCell className="max-w-xs truncate">{m.tasteProfile ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(m.id!)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar miembro' : 'Nuevo miembro'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Nombre completo</Label>
              <Input {...register('name', { required: true })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...register('email', { required: true })} />
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input {...register('phone')} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Dirección</Label>
              <Input {...register('address')} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Perfil de gusto</Label>
              <Textarea {...register('tasteProfile')} rows={2} placeholder="Ej: prefiere tintos suaves, sin madera..." />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notas internas</Label>
              <Textarea {...register('notes')} rows={2} />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {editingId ? 'Guardar cambios' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar miembro</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">¿Estás seguro? Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
