import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ImportButton } from '@/components/ImportButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

import { membershipsService } from '@/services/memberships'
import { membersService } from '@/services/members'
import type { Membership, Member, Plan } from '@/types'

const PLAN_LABELS: Record<Plan, string> = {
  BROTE: 'Brote (2 vinos)',
  BROTE_PLUS: 'Brote+ (3 vinos)',
  ENVERO: 'Envero (2 vinos)',
  ENVERO_PLUS: 'Envero+ (3 vinos)',
}

const defaultValues: Membership = {
  memberId: 0,
  plan: 'BROTE',
  startDate: new Date().toISOString().slice(0, 10),
  isActive: true,
}

export function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Membership>({ defaultValues })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [ms, membs] = await Promise.all([membershipsService.getAll(), membersService.getAll()])
      setMemberships(ms)
      setMembers(membs)
    } catch {
      toast.error('Error al cargar membresías')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    reset({ ...defaultValues, memberId: members[0]?.id ?? 0 })
    setEditingId(null)
    setDialogOpen(true)
  }

  function openEdit(m: Membership) {
    reset({ ...m, startDate: m.startDate?.slice(0, 10) })
    setEditingId(m.id!)
    setDialogOpen(true)
  }

  async function onSubmit(data: Membership) {
    try {
      const payload = { ...data, memberId: Number(data.memberId), isActive: Boolean(data.isActive) }
      if (editingId) {
        await membershipsService.update(editingId, payload)
        toast.success('Membresía actualizada')
      } else {
        await membershipsService.create(payload)
        toast.success('Membresía creada')
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
      await membershipsService.delete(deleteId)
      toast.success('Membresía eliminada')
      setDeleteId(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Membresías</h1>
        <div className="flex gap-2">
          <ImportButton entity="memberships" onSuccess={load} />
          <Button onClick={openCreate} disabled={members.length === 0}>
            <Plus size={16} /> Nueva membresía
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Buscar por nombre de miembro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos los planes</option>
          {Object.entries(PLAN_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {(search || planFilter) && (
          <button
            type="button"
            onClick={() => { setSearch(''); setPlanFilter('') }}
            className="h-10 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.filter(m => !search || (m.memberName ?? '').toLowerCase().includes(search.toLowerCase())).filter(m => !planFilter || m.plan === planFilter).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay membresías registradas
                  </TableCell>
                </TableRow>
              ) : memberships
                  .filter(m => !search || (m.memberName ?? '').toLowerCase().includes(search.toLowerCase()))
                  .filter(m => !planFilter || m.plan === planFilter)
                  .map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.memberName ?? `#${m.memberId}`}</TableCell>
                  <TableCell>
                    <Badge variant={m.plan.startsWith('ENVERO') ? 'default' : 'secondary'}>
                      {m.plan.replace('_PLUS', '+')}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.startDate?.slice(0, 10)}</TableCell>
                  <TableCell>
                    <Badge variant={m.isActive ? 'default' : 'outline'}>
                      {m.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar membresía' : 'Nueva membresía'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Miembro</Label>
              <select
                {...register('memberId', { required: true })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Plan</Label>
              <select
                {...register('plan', { required: true })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(PLAN_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Fecha de inicio</Label>
              <Input type="date" {...register('startDate', { required: true })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" {...register('isActive')} />
              <Label htmlFor="isActive">Membresía activa</Label>
            </div>
            <DialogFooter>
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
          <DialogHeader><DialogTitle>Eliminar membresía</DialogTitle></DialogHeader>
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
