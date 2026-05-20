import { NavLink, useLocation } from 'react-router-dom'
import { Wine, Users, CreditCard, Package } from 'lucide-react'

const navItems = [
  { to: '/wines', label: 'Vinos', icon: Wine },
  { to: '/members', label: 'Miembros', icon: Users },
  { to: '/memberships', label: 'Membresías', icon: CreditCard },
  { to: '/shipments', label: 'Envíos', icon: Package },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="flex min-h-screen w-full">
      <aside
        className="w-56 flex-shrink-0 flex flex-col"
        style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-fg)' }}
      >
        <div className="px-6 py-6 border-b border-white/10">
          <h1 className="text-xl font-semibold tracking-wide" style={{ color: 'var(--sidebar-fg)' }}>
            🍷 Fudre
          </h1>
          <p className="text-xs mt-0.5 opacity-60">Panel de Administración</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-white/15 font-medium'
                    : 'opacity-70 hover:opacity-100 hover:bg-white/10',
                ].join(' ')}
                style={{ color: 'var(--sidebar-fg)' }}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-background p-8">
        {children}
      </main>
    </div>
  )
}
