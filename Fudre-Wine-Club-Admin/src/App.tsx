import { useState } from 'react'
import './App.css'

// ── Types ──────────────────────────────────────────────────────────────────
type WineTag = 'Rosado' | 'Tinto' | 'Blanco' | 'Espumoso' | 'Dulce'
type Page    = 'clientes' | 'stock'

interface Cliente {
  name: string
  vinosFavoritos: WineTag[]
  vinosRestantes: number
  suscripcion: string
  vinoRecomendado: string
}

interface Producto {
  vino: string
  caracteristicas: WineTag[]
  gama: 'Alta' | 'Baja'
  stock: number
  linkTiendaNube: string
}

// ── Data ───────────────────────────────────────────────────────────────────
const clientes: Cliente[] = [
  { name: 'George R.R Martin', vinosFavoritos: ['Rosado', 'Tinto'],      vinosRestantes: 1, suscripcion: 'Brote',    vinoRecomendado: 'Rosé de Malbec'     },
  { name: 'Markus Suzak',      vinosFavoritos: ['Tinto'],                 vinosRestantes: 2, suscripcion: 'Brote +',  vinoRecomendado: 'Cabernet Sauvignon'  },
  { name: 'Ankur Warikoo',     vinosFavoritos: ['Blanco'],                vinosRestantes: 3, suscripcion: 'Envero +', vinoRecomendado: 'Chardonnay'          },
  { name: 'Jodi Picoult',      vinosFavoritos: ['Tinto', 'Espumoso'],     vinosRestantes: 2, suscripcion: 'Envero',   vinoRecomendado: 'Prosecco'            },
  { name: 'James Clear',       vinosFavoritos: ['Blanco'],                vinosRestantes: 2, suscripcion: 'Brote +',  vinoRecomendado: 'Sauvignon Blanc'     },
  { name: 'Frank Herbert',     vinosFavoritos: ['Dulce'],                 vinosRestantes: 1, suscripcion: 'Brote',    vinoRecomendado: 'Moscato'             },
]

const initialProductos: Producto[] = [
  { vino: 'Rosé de Malbec',     caracteristicas: ['Rosado'],         gama: 'Alta', stock: 12, linkTiendaNube: 'https://fudre.mitiendanube.com/rose-de-malbec'      },
  { vino: 'Cabernet Sauvignon', caracteristicas: ['Tinto'],          gama: 'Alta', stock: 8,  linkTiendaNube: 'https://fudre.mitiendanube.com/cabernet-sauvignon'  },
  { vino: 'Chardonnay',         caracteristicas: ['Blanco'],         gama: 'Alta', stock: 15, linkTiendaNube: 'https://fudre.mitiendanube.com/chardonnay'          },
  { vino: 'Prosecco',           caracteristicas: ['Espumoso'],       gama: 'Baja', stock: 6,  linkTiendaNube: 'https://fudre.mitiendanube.com/prosecco'            },
  { vino: 'Sauvignon Blanc',    caracteristicas: ['Blanco'],         gama: 'Baja', stock: 20, linkTiendaNube: 'https://fudre.mitiendanube.com/sauvignon-blanc'     },
  { vino: 'Moscato',            caracteristicas: ['Dulce'],          gama: 'Baja', stock: 4,  linkTiendaNube: 'https://fudre.mitiendanube.com/moscato'             },
]

const tagClass: Record<WineTag, string> = {
  Rosado:   'tag-rosado',
  Tinto:    'tag-tinto',
  Blanco:   'tag-blanco',
  Espumoso: 'tag-espumoso',
  Dulce:    'tag-dulce',
}

// ── Icons ──────────────────────────────────────────────────────────────────
const PersonIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.33 0-10 1.673-10 5v2h20v-2c0-3.327-6.67-5-10-5z" />
  </svg>
)

const PackageIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
)

const LogoutIcon = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const CloudUploadIcon = ({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
)

const DownloadIcon = ({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const ListIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6"  x2="21" y2="6"  />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6"  x2="3.01" y2="6"  />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

const SparkleIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 2l2.09 6.42H21l-5.47 3.97 2.09 6.42L12 15l-5.62 3.81 2.09-6.42L3 8.42h6.91z" />
  </svg>
)

const StarIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const LinkIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const PlusIcon = ({ size = 13, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5"  y1="12" x2="19" y2="12" />
  </svg>
)

const MinusIcon = ({ size = 13, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const ExternalLinkIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const LayersIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
)

const BoxIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

// ── Wine remaining icon ────────────────────────────────────────────────────
function WineRemainingIcon({ count }: Readonly<{ count: number }>) {
  if (count === 1) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" stroke="#d1fae5" strokeWidth="2" />
        <path d="M8 2.5a5.5 5.5 0 0 1 5.5 5.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="#22c55e" strokeWidth="2" />
    </svg>
  )
}

// ── Tag components ─────────────────────────────────────────────────────────
function Tag({ type }: Readonly<{ type: WineTag }>) {
  return <span className={`wine-tag ${tagClass[type]}`}>{type}</span>
}

function GamaTag({ gama }: Readonly<{ gama: 'Alta' | 'Baja' }>) {
  return <span className={`gama-tag gama-${gama.toLowerCase()}`}>{gama}</span>
}

// ── Clientes page ──────────────────────────────────────────────────────────
function ClientesPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <div className="header-actions">
          <button className="btn-sync" type="button">
            <CloudUploadIcon size={14} color="#ffffff" />
            Sincronizar a TiendaNube
          </button>
          <button className="btn-download" type="button">
            <DownloadIcon size={14} color="#4b5563" />
            Descargar XLSX
          </button>
        </div>
      </div>

      <table className="clients-table">
        <thead>
          <tr>
            <th><span className="th-inner"><PersonIcon size={13} color="#9ca3af" /> Cliente</span></th>
            <th><span className="th-inner"><ListIcon size={13} color="#9ca3af" /> Vinos Favoritos</span></th>
            <th><span className="th-inner"><SparkleIcon size={13} color="#9ca3af" /> Vinos Restantes</span></th>
            <th><span className="th-inner"><StarIcon size={13} color="#9ca3af" /> Suscripción</span></th>
            <th><span className="th-inner"><LinkIcon size={13} color="#9ca3af" /> Vino Recomendado</span></th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.name}>
              <td className="td-name">{c.name}</td>
              <td>
                <div className="tags-wrap">
                  {c.vinosFavoritos.map((v) => <Tag key={v} type={v} />)}
                </div>
              </td>
              <td>
                <div className="remaining-wrap">
                  <span>{c.vinosRestantes}</span>
                  <WineRemainingIcon count={c.vinosRestantes} />
                </div>
              </td>
              <td>{c.suscripcion}</td>
              <td>{c.vinoRecomendado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

// ── Stock y Productos page ─────────────────────────────────────────────────
function StockProductosPage() {
  const [productos, setProductos] = useState<Producto[]>(initialProductos)

  const changeStock = (index: number, delta: number) => {
    setProductos((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      )
    )
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Stock y Productos</h1>
        <div className="header-actions">
          <button className="btn-sync" type="button">
            <CloudUploadIcon size={14} color="#ffffff" />
            Sincronizar a TiendaNube
          </button>
          <button className="btn-download" type="button">
            <DownloadIcon size={14} color="#4b5563" />
            Descargar XLSX
          </button>
        </div>
      </div>

      <table className="clients-table">
        <thead>
          <tr>
            <th><span className="th-inner"><BoxIcon size={13} color="#9ca3af" /> Vino</span></th>
            <th><span className="th-inner"><ListIcon size={13} color="#9ca3af" /> Características</span></th>
            <th><span className="th-inner"><LayersIcon size={13} color="#9ca3af" /> Gama</span></th>
            <th><span className="th-inner"><SparkleIcon size={13} color="#9ca3af" /> Stock</span></th>
            <th><span className="th-inner"><LinkIcon size={13} color="#9ca3af" /> Link de TiendaNube</span></th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p, i) => (
            <tr key={p.vino}>
              <td className="td-name">{p.vino}</td>
              <td>
                <div className="tags-wrap">
                  {p.caracteristicas.map((c) => <Tag key={c} type={c} />)}
                </div>
              </td>
              <td><GamaTag gama={p.gama} /></td>
              <td>
                <div className="stock-control">
                  <button
                    className="stock-btn stock-btn-minus"
                    type="button"
                    onClick={() => changeStock(i, -1)}
                    aria-label={`Reducir stock de ${p.vino}`}
                  >
                    <MinusIcon size={12} color="#374151" />
                  </button>
                  <span className="stock-value">{p.stock}</span>
                  <button
                    className="stock-btn stock-btn-plus"
                    type="button"
                    onClick={() => changeStock(i, 1)}
                    aria-label={`Aumentar stock de ${p.vino}`}
                  >
                    <PlusIcon size={12} color="#374151" />
                  </button>
                </div>
              </td>
              <td>
                <a
                  href={p.linkTiendaNube}
                  target="_blank"
                  rel="noreferrer"
                  className="tiendanube-link"
                >
                  <ExternalLinkIcon size={13} color="#2563eb" />
                  Ver en TiendaNube
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

// ── App ────────────────────────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState<Page>('clientes')

  return (
    <div className="layout">

      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="navbar-brand">
          <img src="/logo.png" alt="FUDRE Wine Club" className="brand-logo" />
        </div>

        <div className="navbar-right">
          <div className="user-info">
            <span className="user-greeting">¡Hola, <strong>Juan</strong>!</span>
            <div className="user-time">
              <span>14:35</span>
              <span>20/05/2026</span>
            </div>
          </div>
          <button className="logout-btn" type="button" aria-label="Cerrar sesión">
            <LogoutIcon size={17} color="#ffffff" />
          </button>
        </div>
      </header>

      <div className="body-wrap">

        {/* ── Sidebar ── */}
        <nav className="sidebar" aria-label="Navegación">
          <button
            className={`sidebar-icon${page === 'clientes' ? ' active' : ''}`}
            type="button"
            aria-label="Clientes"
            aria-current={page === 'clientes' ? 'page' : undefined}
            onClick={() => setPage('clientes')}
          >
            <PersonIcon size={27} color="#111111" />
          </button>
          <button
            className={`sidebar-icon${page === 'stock' ? ' active' : ''}`}
            type="button"
            aria-label="Stock y Productos"
            aria-current={page === 'stock' ? 'page' : undefined}
            onClick={() => setPage('stock')}
          >
            <PackageIcon size={27} color="#111111" />
          </button>
        </nav>

        {/* ── Main ── */}
        <main className="main-content">
          {page === 'clientes' ? <ClientesPage /> : <StockProductosPage />}
        </main>
      </div>
    </div>
  )
}

export default App
