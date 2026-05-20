import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { WinesPage } from '@/pages/WinesPage'
import { MembersPage } from '@/pages/MembersPage'
import { MembershipsPage } from '@/pages/MembershipsPage'
import { ShipmentsPage } from '@/pages/ShipmentsPage'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/wines" replace />} />
        <Route path="/wines" element={<Layout><WinesPage /></Layout>} />
        <Route path="/members" element={<Layout><MembersPage /></Layout>} />
        <Route path="/memberships" element={<Layout><MembershipsPage /></Layout>} />
        <Route path="/shipments" element={<Layout><ShipmentsPage /></Layout>} />
      </Routes>
      <Toaster richColors />
    </BrowserRouter>
  )
}
