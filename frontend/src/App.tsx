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
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/wines" replace />} />
        <Route path="/wines" element={<Layout><WinesPage /></Layout>} />
        <Route path="/members" element={<Layout><MembersPage /></Layout>} />
        <Route path="/members/:id" element={<Layout><MemberProfilePage /></Layout>} />
        <Route path="/memberships" element={<Layout><MembershipsPage /></Layout>} />
        <Route path="/shipments" element={<Layout><ShipmentsPage /></Layout>} />
        <Route path="/price-list" element={<Layout><PriceListPage /></Layout>} />
        <Route path="/purchase-list" element={<Layout><PurchaseListPage /></Layout>} />
        <Route path="/orders" element={<Layout><OrdersPage /></Layout>} />
        <Route path="/survey" element={<Layout><SurveyPage /></Layout>} />
      </Routes>
      <Toaster richColors />
    </BrowserRouter>
  )
}
