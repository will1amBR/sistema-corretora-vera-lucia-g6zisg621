/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import Layout from './components/Layout'

import Index from './pages/Index'
import CRMLeads from './pages/CRMLeads'
import Properties from './pages/Properties'
import CalendarSchedule from './pages/CalendarSchedule'
import AssistantAI from './pages/AssistantAI'
import ObjectionsBase from './pages/ObjectionsBase'
import ProposalsManager from './pages/ProposalsManager'
import ClientPortal from './pages/ClientPortal'
import PublicSchedule from './pages/PublicSchedule'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/crm" element={<CRMLeads />} />
            <Route path="/imoveis" element={<Properties />} />
            <Route path="/agenda" element={<CalendarSchedule />} />
            <Route path="/assistente-ia" element={<AssistantAI />} />
            <Route path="/objecoes" element={<ObjectionsBase />} />
            <Route path="/propostas" element={<ProposalsManager />} />
            <Route path="/portal" element={<ClientPortal />} />
          </Route>

          {/* Standalone Public Schedule page */}
          <Route path="/agendar" element={<PublicSchedule />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
