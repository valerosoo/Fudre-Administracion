import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { WinesPage } from '@/pages/WinesPage'
import { MembersPage } from '@/pages/MembersPage'
import { MemberProfilePage } from '@/pages/MemberProfilePage'
import { MembershipsPage } from '@/pages/MembershipsPage'
import { ShipmentsPage } from '@/pages/ShipmentsPage'
import { PriceListPage } from '@/pages/PriceListPage'
import { PurchaseListPage } from '@/pages/PurchaseListPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { SurveyPage } from '@/pages/SurveyPage'
import { LoginPage } from '@/pages/LoginPage'
import { GuidePage } from '@/pages/GuidePage'
import { Toaster } from '@/components/ui/sonner'
import { authService } from '@/services/auth'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Encuesta pública (demo): sin login, se va a mover a Tiendanube más adelante */}
        <Route path="/survey" element={<SurveyPage />} />

        <Route path="/" element={<Navigate to="/wines" replace />} />
        <Route path="/wines" element={<RequireAuth><Layout><WinesPage /></Layout></RequireAuth>} />
        <Route path="/members" element={<RequireAuth><Layout><MembersPage /></Layout></RequireAuth>} />
        <Route path="/members/:id" element={<RequireAuth><Layout><MemberProfilePage /></Layout></RequireAuth>} />
        <Route path="/memberships" element={<RequireAuth><Layout><MembershipsPage /></Layout></RequireAuth>} />
        <Route path="/shipments" element={<RequireAuth><Layout><ShipmentsPage /></Layout></RequireAuth>} />
        <Route path="/price-list" element={<RequireAuth><Layout><PriceListPage /></Layout></RequireAuth>} />
        <Route path="/purchase-list" element={<RequireAuth><Layout><PurchaseListPage /></Layout></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><Layout><OrdersPage /></Layout></RequireAuth>} />
        <Route path="/guide" element={<RequireAuth><Layout><GuidePage /></Layout></RequireAuth>} />
      </Routes>
      <Toaster richColors />
    </BrowserRouter>
  )
}
