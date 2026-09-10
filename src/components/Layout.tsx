import React, { useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Bot,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Menu,
  X,
  LogOut,
  UserCheck,
  FileCheck2,
  Lock,
  Compass,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BrokerOnboardingModal } from '@/components/BrokerOnboardingModal'
import { NotificationBell } from '@/components/NotificationBell'

export default function Layout() {
  const { user, isAdmin, clientPortal, logout, loginAsAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  // Check if currently on a client-only route or public landing
  const isClientRoute = location.pathname.startsWith('/portal')
  const isPublicSchedule = location.pathname.startsWith('/agendar')

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'CRM & Funil', path: '/crm', icon: Users },
    { label: 'Catálogo de Imóveis', path: '/imoveis', icon: Building2 },
    { label: 'Gestão de Imóveis', path: '/admin/imoveis', icon: Building2, badge: 'Admin' },
    { label: 'Agenda & Visitas', path: '/agenda', icon: CalendarDays },
    { label: 'Vera AI Assistente', path: '/assistente-ia', icon: Bot, badge: 'IA' },
    { label: 'Base de Objeções', path: '/objecoes', icon: ShieldAlert },
    { label: 'Propostas & Docs', path: '/propostas', icon: FileCheck2 },
  ]

  const handleAdminQuickLogin = async () => {
    await loginAsAdmin()
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A3636] flex flex-col md:flex-row">
      {/* Admin Sidebar for Desktop */}
      {!isClientRoute && (
        <aside className="hidden md:flex flex-col w-72 bg-[#1A3636] text-white border-r border-[#2A4D4D] min-h-screen sticky top-0 h-screen z-30 select-none">
          {/* Brand Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-7 bg-[#D4AF37] rounded-sm inline-block" />
              <div>
                <h1 className="font-bold text-lg tracking-wider text-white">VERA LÚCIA KOREN</h1>
                <p className="text-xs text-[#D4AF37] font-medium tracking-wide">
                  CORRETORA DE IMÓVEIS
                </p>
              </div>
            </div>
            <NotificationBell />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            <div className="px-3 pb-2 text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              Menu Principal
            </div>

            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#D4AF37] text-[#1A3636] font-semibold shadow-md'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#1A3636]' : 'text-[#D4AF37]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase px-1.5 py-0 h-4 border-[#D4AF37]/50 ${
                        isActive ? 'bg-[#1A3636] text-[#D4AF37]' : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              )
            })}

            <div className="pt-6 px-3 pb-2 text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              Acesso Externo & Links
            </div>

            <NavLink
              to="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
                <span>Landing Page Pública</span>
              </div>
              <span className="text-[11px] text-[#D4AF37]">Site ↗</span>
            </NavLink>

            <NavLink
              to="/agendar"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
                <span>Agendamento Público</span>
              </div>
              <span className="text-[11px] text-[#D4AF37]">Link ↗</span>
            </NavLink>

            <NavLink
              to="/portal"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-[#D4AF37]" />
                <span>Portal do Cliente</span>
              </div>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/70">
                Demo
              </span>
            </NavLink>
          </nav>

          {/* Tour Button for Vera */}
          <div className="px-4 py-3 border-t border-white/10">
            <button
              onClick={() => setTourOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 transition-all group"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                <span>Tour do Sistema</span>
              </div>
              <span className="text-[10px] bg-[#D4AF37] text-[#1A3636] font-extrabold px-1.5 py-0.2 rounded">
                Ajuda
              </span>
            </button>
          </div>

          {/* User profile / Footer */}
          <div className="p-4 border-t border-white/10 bg-[#142A2A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9 border border-[#D4AF37]/40">
                  <AvatarImage
                    src="https://img.usecurling.com/ppl/256?gender=female&seed=44"
                    alt="Vera Lúcia"
                  />
                  <AvatarFallback className="bg-[#D4AF37] text-[#1A3636] font-bold">
                    VL
                  </AvatarFallback>
                </Avatar>
                <div className="text-left leading-tight">
                  <p className="text-sm font-semibold text-white">Vera Lúcia Koren</p>
                  <p className="text-[11px] text-[#D4AF37]">Corretora & Gestora</p>
                </div>
              </div>
              {user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Sair do painel"
                  className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAdminQuickLogin}
                  className="text-xs text-[#D4AF37] hover:bg-white/10 px-2"
                >
                  Conectar
                </Button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#1A3636] text-white p-4 flex items-center justify-between sticky top-0 z-40 border-b border-white/10 shadow">
          <div className="flex items-center gap-2">
            <span className="w-2 h-6 bg-[#D4AF37] rounded-sm" />
            <span className="font-bold text-sm tracking-wide">VERA LÚCIA KOREN</span>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </header>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1A3636] text-white px-4 py-6 space-y-2 border-b border-[#2A4D4D] z-30">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-[#D4AF37] text-[#1A3636] font-bold' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge className="bg-[#1A3636] text-[#D4AF37] text-[10px]">{item.badge}</Badge>
                  )}
                </NavLink>
              )
            })}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
              <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-[#D4AF37] flex items-center gap-1 font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Landing Page Pública
              </NavLink>
              <NavLink
                to="/agendar"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-white/80 flex items-center gap-1"
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#D4AF37]" /> Agendamento Público
              </NavLink>
              <NavLink
                to="/portal"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-white/80 flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" /> Área do Cliente
              </NavLink>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>

        {/* Global Onboarding Modal for Vera */}
        {!isClientRoute && (
          <BrokerOnboardingModal forceOpen={tourOpen} onCloseManual={() => setTourOpen(false)} />
        )}

        {/* Mobile Bottom Navigation for Vera (quick access) */}
        {!isClientRoute && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1A3636] text-white border-t border-white/10 px-3 py-2 flex justify-around items-center z-40 shadow-lg">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] ${
                  isActive ? 'text-[#D4AF37] font-bold' : 'text-white/70'
                }`
              }
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Início</span>
            </NavLink>
            <NavLink
              to="/crm"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] ${
                  isActive ? 'text-[#D4AF37] font-bold' : 'text-white/70'
                }`
              }
            >
              <Users className="w-5 h-5" />
              <span>Funil</span>
            </NavLink>
            <NavLink
              to="/admin/imoveis"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] ${
                  isActive ? 'text-[#D4AF37] font-bold' : 'text-white/70'
                }`
              }
            >
              <Building2 className="w-5 h-5" />
              <span>Admin Imóveis</span>
            </NavLink>
            <NavLink
              to="/agenda"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] ${
                  isActive ? 'text-[#D4AF37] font-bold' : 'text-white/70'
                }`
              }
            >
              <CalendarDays className="w-5 h-5" />
              <span>Agenda</span>
            </NavLink>
            <NavLink
              to="/assistente-ia"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] ${
                  isActive ? 'text-[#D4AF37] font-bold' : 'text-white/70'
                }`
              }
            >
              <Bot className="w-5 h-5" />
              <span>Vera AI</span>
            </NavLink>
          </nav>
        )}
      </div>
    </div>
  )
}
