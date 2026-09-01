/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import Layout from './components/Layout'
import { PageSkeleton } from './components/PageSkeleton'

// Lazy-loaded routes for agility & code-splitting
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Index = lazy(() => import('./pages/Index'))
const CRMLeads = lazy(() => import('./pages/CRMLeads'))
const Properties = lazy(() => import('./pages/Properties'))
const CalendarSchedule = lazy(() => import('./pages/CalendarSchedule'))
const AssistantAI = lazy(() => import('./pages/AssistantAI'))
const ObjectionsBase = lazy(() => import('./pages/ObjectionsBase'))
const ProposalsManager = lazy(() => import('./pages/ProposalsManager'))
const ClientPortal = lazy(() => import('./pages/ClientPortal'))
const PublicSchedule = lazy(() => import('./pages/PublicSchedule'))
const NotFound = lazy(() => import('./pages/NotFound'))

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/agendar" element={<PublicSchedule />} />

            {/* Backoffice Management & CRM Layout */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/crm" element={<CRMLeads />} />
              <Route path="/imoveis" element={<Properties />} />
              <Route path="/agenda" element={<CalendarSchedule />} />
              <Route path="/assistente-ia" element={<AssistantAI />} />
              <Route path="/objecoes" element={<ObjectionsBase />} />
              <Route path="/propostas" element={<ProposalsManager />} />
              <Route path="/portal" element={<ClientPortal />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
