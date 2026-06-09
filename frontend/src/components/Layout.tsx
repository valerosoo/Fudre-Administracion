import { NavLink, useLocation } from 'react-router-dom'
import { Wine, Users, CreditCard, Package, LogOut, List, ShoppingCart, ClipboardList, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/wines',         label: 'Vinos',           icon: Wine         },
  { to: '/members',       label: 'Miembros',         icon: Users        },
  { to: '/memberships',   label: 'Membresías',       icon: CreditCard   },
  { to: '/shipments',     label: 'Envíos',           icon: Package      },
  { to: '/price-list',    label: 'Lista de precios', icon: List         },
  { to: '/purchase-list', label: 'Lista de compra',  icon: ShoppingCart },
  { to: '/orders',        label: 'Pedidos',          icon: ClipboardList },
  { to: '/survey',        label: 'Encuesta',         icon: FileText     },
]

function useCurrentTime() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const now = useCurrentTime()

  const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', width: '100%' }}>

      {/* Navbar */}
      <header style={{
        height: '60px',
        background: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px 0 0',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 12px' }}>
          <img src="/logo.png" alt="FUDRE Wine Club" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
            <span style={{ color: '#ffffff', fontSize: '13.5px', lineHeight: 1 }}>
              ¡Hola, <strong>Admin</strong>!
            </span>
            <div style={{ display: 'flex', gap: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '11.5px', lineHeight: 1 }}>
              <span>{timeStr}</span>
              <span>{dateStr}</span>
            </div>
          </div>
          <button
            className="navbar-logout"
            type="button"
            aria-label="Cerrar sesión"
          >
            <LogOut size={17} color="#ffffff" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <nav
          style={{ width: '56px', background: '#7F654E', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}
          aria-label="Navegación"
        >
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to
            return (
              <NavLink
                key={to}
                to={to}
                title={label}
                aria-label={label}
                className={`sidebar-nav-item${active ? ' sidebar-nav-item--active' : ''}`}
              >
                <Icon size={27} color={active ? '#111111' : '#ffffff'} />
              </NavLink>
            )
          })}
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, background: '#ffffff', overflowY: 'auto', padding: '32px 40px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
