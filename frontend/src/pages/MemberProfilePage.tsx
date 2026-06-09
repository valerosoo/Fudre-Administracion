import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Star, Wine, Sparkles, Package, User, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { membersService } from '@/services/members'
import { membershipsService } from '@/services/memberships'
import { shipmentsService } from '@/services/shipments'
import { recommendationsService } from '@/services/recommendations'
import type { MemberDetail, WineRating, RecommendationResult, Shipment, Membership } from '@/types'

const GRAPE_LABELS: Record<string, string> = {
  malbec: 'Malbec', 'cabernet sauvignon': 'Cabernet Sauvignon', merlot: 'Merlot',
  syrah: 'Syrah', 'pinot noir': 'Pinot Noir', chardonnay: 'Chardonnay',
  'sauvignon blanc': 'Sauvignon Blanc', 'cabernet franc': 'Cabernet Franc',
  'semillón': 'Semillón', torrontés: 'Torrontés', rosado: 'Rosado',
}

const PLAN_LABELS: Record<string, string> = {
  BROTE: 'Brote', BROTE_PLUS: 'Brote+', ENVERO: 'Envero', ENVERO_PLUS: 'Envero+',
}
const PLAN_WINES: Record<string, number> = {
  BROTE: 2, BROTE_PLUS: 3, ENVERO: 4, ENVERO_PLUS: 5,
}

function RatingStars({ rating, onRate }: { rating?: number; onRate?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onRate?.(n)}
          onMouseEnter={() => onRate && setHovered(n)}
          onMouseLeave={() => onRate && setHovered(0)}
          className={`transition-colors ${onRate ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            size={14}
            className={`${(hovered || rating || 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  )
}

function WineCard({ wine, accent = false }: { wine: { id?: number; name: string; grape: string; imageUrl?: string; category?: string; referencePrice?: number }; accent?: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${accent ? 'border-purple-200 bg-purple-50' : 'border-amber-200 bg-amber-50'}`}>
      {wine.imageUrl ? (
        <img src={wine.imageUrl} alt={wine.name} className="w-10 h-14 object-cover rounded" />
      ) : (
        <div className={`w-10 h-14 rounded flex items-center justify-center ${accent ? 'bg-purple-100' : 'bg-amber-100'}`}>
          <Wine size={18} className={accent ? 'text-purple-400' : 'text-amber-600'} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{wine.name}</p>
        <p className="text-xs text-gray-500">{wine.grape}</p>
        {wine.category && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${wine.category === 'ENVERO' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
            {wine.category}
          </span>
        )}
      </div>
    </div>
  )
}

export function MemberProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const memberId = Number(id)

  const [member, setMember] = useState<MemberDetail | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [wineRatings, setWineRatings] = useState<WineRating[]>([])
  const [recs, setRecs] = useState<RecommendationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedShipment, setExpandedShipment] = useState<number | null>(null)

  useEffect(() => { load() }, [memberId])

  async function load() {
    try {
      const [m, mb, sh, wr, rc] = await Promise.all([
        membersService.getById(memberId),
        membershipsService.getByMember(memberId).catch(() => [] as Membership[]),
        shipmentsService.getByMember(memberId),
        membersService.getWineRatings(memberId),
        recommendationsService.getForMember(memberId).catch(() => ({ paraVos: [], nuevasExperiencias: [] })),
      ])
      setMember(m)
      setMembership(mb.find(ms => ms.isActive) ?? mb[0] ?? null)
      setShipments(sh.filter(s => s.status === 'CONFIRMED'))
      setWineRatings(wr)
      setRecs(rc)
    } catch {
      toast.error('Error al cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  async function handleRate(wineId: number, wineName: string, rating: number) {
    try {
      await membersService.submitWineRating(memberId, { memberId, wineId, wineName, rating })
      toast.success(`Calificaste ${wineName} con ${rating} estrellas`)
      const updated = await membersService.getWineRatings(memberId)
      setWineRatings(updated)
    } catch {
      toast.error('Error al guardar la calificación')
    }
  }

  if (loading) return <div className="text-muted-foreground py-8">Cargando perfil...</div>
  if (!member) return <div className="text-muted-foreground py-8">Miembro no encontrado</div>

  const ratingMap = new Map(wineRatings.map(r => [r.wineId, r.rating]))

  const wineStyleLabel = member.wineStyle === 'JOVENES' ? 'Jóvenes / Frescos' : member.wineStyle === 'MAS_CUERPO' ? 'Más cuerpo' : null
  const openToNewLabel = member.openToNew === true ? 'Sí' : member.openToNew === false ? 'No' : 'Depende del estilo'

  const confirmedItems = shipments.flatMap(s =>
    (s.items ?? []).map(item => ({ ...item, shippedAt: s.shippedAt }))
  )
  const totalWinesReceived = new Set(confirmedItems.map(i => i.wineId)).size

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/members')}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{member.name}</h1>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Info card */}
          <div className="bg-white border rounded-xl p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-[#7F654E]" />
              <h2 className="text-sm font-semibold text-gray-700">Información</h2>
            </div>
            {member.phone && (
              <div>
                <p className="text-xs text-gray-400">Teléfono</p>
                <p className="text-sm">{member.phone}</p>
              </div>
            )}
            {member.deliveryAddress && (
              <div>
                <p className="text-xs text-gray-400">Dirección</p>
                <p className="text-sm">{member.deliveryAddress}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Vinos recibidos</p>
              <p className="text-sm font-medium">{totalWinesReceived} vinos únicos</p>
            </div>
            {member.createdAt && (
              <div>
                <p className="text-xs text-gray-400">Miembro desde</p>
                <p className="text-sm">{new Date(member.createdAt).toLocaleDateString('es-AR')}</p>
              </div>
            )}
          </div>

          {/* Membership card */}
          {membership && (
            <div className="bg-white border rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={16} className="text-[#7F654E]" />
                <h2 className="text-sm font-semibold text-gray-700">Membresía</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Plan</p>
                  <p className="text-base font-semibold text-[#7F654E]">
                    {PLAN_LABELS[membership.plan] ?? membership.plan}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  membership.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {membership.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Vinos por envío</p>
                <p className="text-sm">{PLAN_WINES[membership.plan] ?? '—'} botellas / mes</p>
              </div>
              {membership.startDate && (
                <div>
                  <p className="text-xs text-gray-400">Inicio</p>
                  <p className="text-sm">{new Date(membership.startDate).toLocaleDateString('es-AR')}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">Envíos confirmados</p>
                <p className="text-sm font-medium">{shipments.length}</p>
              </div>
            </div>
          )}

          {/* Survey data */}
          <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Encuesta de bienvenida</h2>
            {wineStyleLabel && (
              <div>
                <p className="text-xs text-gray-400">Estilo preferido</p>
                <span className="inline-block text-xs bg-[#7F654E]/10 text-[#7F654E] px-2 py-0.5 rounded-full mt-0.5">
                  {wineStyleLabel}
                </span>
              </div>
            )}
            {member.wineTypes && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Tipos de vino</p>
                <div className="flex flex-wrap gap-1">
                  {member.wineTypes.split(',').map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Abierto a nuevas cepas</p>
              <p className="text-sm">{openToNewLabel}</p>
            </div>
            {member.occasions && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Ocasiones</p>
                <p className="text-sm text-gray-600">{member.occasions}</p>
              </div>
            )}
          </div>

          {/* Grape ratings */}
          {(member.grapeRatings?.length ?? 0) > 0 && (
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Rating por cepa (encuesta)</h2>
              <div className="space-y-2">
                {member.grapeRatings!.map(gr => (
                  <div key={gr.grape} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 w-36">
                      {GRAPE_LABELS[gr.grape.toLowerCase()] ?? gr.grape}
                    </span>
                    <RatingStars rating={gr.rating} />
                    <span className="text-xs text-gray-400 w-4 text-right">{gr.rating}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-700">Para Vos</h2>
                <span className="text-xs text-gray-400">(basado en tus gustos)</span>
              </div>
              {(recs?.paraVos?.length ?? 0) === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">Sin recomendaciones disponibles</p>
              ) : (
                <div className="space-y-2">
                  {recs!.paraVos.map(w => <WineCard key={w.id} wine={w} />)}
                </div>
              )}
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} className="text-purple-500" />
                <h2 className="text-sm font-semibold text-gray-700">Nuevas Experiencias</h2>
                <span className="text-xs text-gray-400">(cepas nuevas)</span>
              </div>
              {(recs?.nuevasExperiencias?.length ?? 0) === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">Sin recomendaciones disponibles</p>
              ) : (
                <div className="space-y-2">
                  {recs!.nuevasExperiencias.map(w => <WineCard key={w.id} wine={w} accent />)}
                </div>
              )}
            </div>
          </div>

          {/* Wine history */}
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Package size={15} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">Historial de vinos recibidos</h2>
              <span className="text-xs text-gray-400">({totalWinesReceived} únicos)</span>
            </div>
            {shipments.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No hay envíos confirmados</p>
            ) : (
              <div className="space-y-2">
                {shipments.map(s => (
                  <div key={s.id} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      onClick={() => setExpandedShipment(expandedShipment === s.id ? null : s.id!)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{s.shippedAt?.slice(0, 10)}</span>
                        <span className="text-xs text-gray-500">{s.items?.length ?? 0} vinos</span>
                        {s.tiendanubeOrderId && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                            TN #{s.tiendanubeOrderId}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{expandedShipment === s.id ? '▲' : '▼'}</span>
                    </button>
                    {expandedShipment === s.id && (
                      <div className="border-t px-4 py-3 bg-gray-50">
                        <div className="space-y-2">
                          {(s.items ?? []).map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{item.wineName}</p>
                                <p className="text-xs text-gray-500">{item.wineGrape} · {item.quantity} u.</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {ratingMap.has(item.wineId) ? (
                                  <RatingStars rating={ratingMap.get(item.wineId)} />
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-400 mr-1">Calificar:</span>
                                    <RatingStars onRate={r => handleRate(item.wineId, item.wineName ?? '', r)} />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
