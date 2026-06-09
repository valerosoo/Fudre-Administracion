import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ImageIcon, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImportButton } from '@/components/ImportButton'
import { GrapeMultiSelect } from '@/components/GrapeMultiSelect'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

import { priceListService } from '@/services/priceList'
import { purchaseListService } from '@/services/purchaseList'
import type { PriceListItem } from '@/types'

const SELECT_CLS = 'h-10 rounded-md border border-input bg-background px-3 text-sm'

export function PriceListPage() {
  const [items, setItems] = useState<PriceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  const [search, setSearch] = useState('')
  const [distributorFilter, setDistributorFilter] = useState('')
  const [grapeFilter, setGrapeFilter] = useState<string[]>([])
  const [sortPrice, setSortPrice] = useState<'asc' | 'desc' | ''>('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setItems(await priceListService.getAll())
    } catch {
      toast.error('Error al cargar la lista de precios')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToCart(item: PriceListItem) {
    const qty = quantities[item.id!] ?? 1
    try {
      await purchaseListService.addItem(item.id!, qty)
      toast.success(`${item.name} agregado al carrito`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al agregar')
    }
  }

  const uniqueDistributors = [...new Map(
    items.map(i => [i.distributorId, i.distributorName])
  ).entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const uniqueGrapes = [...new Set(items.map(i => i.grape).filter(Boolean) as string[])].sort()

  const filtered = items
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .filter(i => !distributorFilter || i.distributorId === Number(distributorFilter))
    .filter(i => grapeFilter.length === 0 || (i.grape && grapeFilter.includes(i.grape)))
    .sort((a, b) => {
      if (!sortPrice) return 0
      const diff = (a.purchasePrice ?? 0) - (b.purchasePrice ?? 0)
      return sortPrice === 'asc' ? diff : -diff
    })

  function cycleSortPrice() {
    setSortPrice(s => s === '' ? 'asc' : s === 'asc' ? 'desc' : '')
  }

  const SortIcon = sortPrice === 'asc' ? ChevronUp : sortPrice === 'desc' ? ChevronDown : ChevronsUpDown
  const hasFilters = search || distributorFilter || grapeFilter.length > 0 || sortPrice

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Lista de precios</h1>
        <ImportButton entity="price_list" onSuccess={load} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-52"
        />
        <select
          value={distributorFilter}
          onChange={e => setDistributorFilter(e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">Todos los distribuidores</option>
          {uniqueDistributors.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <GrapeMultiSelect grapes={uniqueGrapes} selected={grapeFilter} onChange={setGrapeFilter} />
        <button
          type="button"
          onClick={cycleSortPrice}
          className={`${SELECT_CLS} flex items-center gap-1 cursor-pointer ${sortPrice ? 'border-primary text-primary' : ''}`}
        >
          <SortIcon size={14} />
          {sortPrice === 'asc' ? 'Precio ↑' : sortPrice === 'desc' ? 'Precio ↓' : 'Ordenar precio'}
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(''); setDistributorFilter(''); setGrapeFilter([]); setSortPrice('') }}
            className="h-10 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          {items.length === 0
            ? 'No hay listas de precios importadas. Usá el botón "Importar archivo" para comenzar.'
            : 'No hay ítems que coincidan con los filtros.'}
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Uva</TableHead>
                <TableHead>Año</TableHead>
                <TableHead className="text-right">Precio compra</TableHead>
                <TableHead>Distribuidor</TableHead>
                <TableHead className="w-36 text-center">Agregar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-8 w-8 object-cover rounded" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <ImageIcon size={14} className="text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.grape ?? '—'}</TableCell>
                  <TableCell>{item.vintageYear ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    ${item.purchasePrice?.toLocaleString('es-AR')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.distributorName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-center">
                      <Input
                        type="number"
                        min={1}
                        value={quantities[item.id!] ?? 1}
                        onChange={e => setQuantities(prev => ({ ...prev, [item.id!]: Math.max(1, Number(e.target.value)) }))}
                        className="w-16 h-8 text-center px-1"
                      />
                      <Button size="sm" onClick={() => handleAddToCart(item)}>
                        Agregar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
