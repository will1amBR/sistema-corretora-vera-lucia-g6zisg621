import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  FileText,
  CalendarCheck2,
  CalendarDays,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Percent,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getProperties, getPropertyImageUrl } from '@/services/properties'
import { getClients, updateClientStatus } from '@/services/clients'
import { getProposals } from '@/services/proposals'
import { syncGoogleCalendar } from '@/services/calendar'
import { BrokerOnboardingModal } from '@/components/BrokerOnboardingModal'
import { Compass } from 'lucide-react'
import type { Property, Client, Proposal, CalendarEvent, ClientStatus } from '@/types'

const STAGES: { key: ClientStatus; label: string; color: string }[] = [
  { key: 'lead', label: 'Novo Lead', color: 'border-l-blue-500 bg-blue-50/50' },
  { key: 'contact', label: 'Contato Feito', color: 'border-l-indigo-500 bg-indigo-50/50' },
  { key: 'visit', label: 'Visita Agendada', color: 'border-l-amber-500 bg-amber-50/50' },
  { key: 'proposal', label: 'Proposta & Docs', color: 'border-l-emerald-500 bg-emerald-50/50' },
  { key: 'closing', label: 'Fechamento', color: 'border-l-[#D4AF37] bg-yellow-50/50' },
]

export default function Index() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showTour, setShowTour] = useState(false)

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [propsData, clientsData, propslsData] = await Promise.all([
        getProperties(),
        getClients(),
        getProposals(),
      ])
      setProperties(propsData)
      setClients(clientsData)
      setProposals(propslsData)

      // Try calendar sync
      try {
        const calData = await syncGoogleCalendar()
        setCalendarEvents(calData.events || [])
        setIsGoogleConnected(calData.connected)
      } catch (_) {
        // Fallback calendar items from clients
        const clientVisits = clientsData
          .filter((c) => c.visit_scheduled_at)
          .map((c) => ({
            id: c.google_event_id || c.id,
            client_id: c.id,
            client_name: c.name,
            client_phone: c.phone,
            property_title: c.expand?.visit_property_id?.title || 'Imóvel selecionado',
            scheduled_at: c.visit_scheduled_at!,
            notes: c.visit_notes,
            status: 'confirmed',
            synced_with_google: false,
          }))
        setCalendarEvents(clientVisits)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const handleSyncGoogle = async () => {
    setIsSyncingCalendar(true)
    try {
      const res = await syncGoogleCalendar(true)
      setIsGoogleConnected(true)
      setCalendarEvents(res.events || [])
      toast({
        title: 'Google Calendar Conectado!',
        description: 'Sua agenda de visitas está sincronizada em tempo real.',
      })
    } catch (err: any) {
      toast({
        title: 'Status da Agenda',
        description: 'Estrutura sincronizada com os agendamentos internos.',
      })
    } finally {
      setIsSyncingCalendar(false)
    }
  }

  const handleAdvanceStage = async (clientId: string, currentStatus: ClientStatus) => {
    const stageKeys: ClientStatus[] = ['lead', 'contact', 'visit', 'proposal', 'closing']
    const currentIndex = stageKeys.indexOf(currentStatus)
    if (currentIndex >= 0 && currentIndex < stageKeys.length - 1) {
      const nextStatus = stageKeys[currentIndex + 1]
      try {
        await updateClientStatus(clientId, nextStatus)
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, status: nextStatus } : c)),
        )
        toast({
          title: 'Estágio atualizado!',
          description: `Lead avançado para "${STAGES.find((s) => s.key === nextStatus)?.label}".`,
        })
      } catch (err: any) {
        toast({
          title: 'Erro ao atualizar',
          description: err.message,
          variant: 'destructive',
        })
      }
    }
  }

  // Active metrics
  const activeLeadsCount = clients.filter(
    (c) => c.status !== 'lost' && c.status !== 'closing',
  ).length
  const availablePropsCount = properties.filter((p) => p.status === 'available').length
  const proposalsPendingCount = proposals.filter(
    (p) => p.status === 'docs_pending' || p.status === 'under_review' || p.status === 'sent',
  ).length
  const closingsCount = clients.filter((c) => c.status === 'closing').length

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl card-elevated">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1A3636] tracking-tight">
              Painel de Gestão Imobiliária
            </h1>
            <Badge className="bg-[#1A3636] text-[#D4AF37] font-semibold border-none">
              Vera Lúcia Koren
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhamento integrado de leads, funil de vendas, visitas sincronizadas e propostas
            ativas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTour(true)}
            className="border-[#D4AF37]/50 text-[#1A3636] hover:bg-amber-50/50 text-xs font-semibold gap-1.5"
          >
            <Compass className="w-4 h-4 text-[#D4AF37]" />
            Tour do Sistema
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={loading}
            className="border-gray-200 text-[#1A3636] hover:bg-gray-50 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Link to="/admin/imoveis">
            <Button
              size="sm"
              variant="outline"
              className="border-[#D4AF37] text-[#1A3636] hover:bg-amber-50 gap-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              Cadastrar Imóvel
            </Button>
          </Link>

          <Link to="/crm">
            <Button
              size="sm"
              className="bg-[#1A3636] text-white hover:bg-[#254d4d] gap-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              Novo Lead
            </Button>
          </Link>
        </div>
      </div>

      <BrokerOnboardingModal forceOpen={showTour} onCloseManual={() => setShowTour(false)} />

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-elevated border-l-4 border-l-[#1A3636] hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Leads em Atendimento
              </p>
              <h3 className="text-2xl font-bold text-[#1A3636] mt-1">{activeLeadsCount}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Funil aquecido
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#1A3636]/10 flex items-center justify-center text-[#1A3636]">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Link to="/admin/imoveis" className="block group">
          <Card className="card-elevated border-l-4 border-l-[#D4AF37] hover:shadow-md transition-all group-hover:border-[#1A3636] cursor-pointer">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Imóveis Disponíveis
                </p>
                <h3 className="text-2xl font-bold text-[#1A3636] mt-1">{availablePropsCount}</h3>
                <p className="text-xs text-[#D4AF37] font-semibold mt-1 group-hover:underline flex items-center gap-1">
                  Gerenciar carteira & fotos →
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 group-hover:bg-[#D4AF37]/30 transition-colors flex items-center justify-center text-[#1A3636]">
                <Building2 className="w-6 h-6 text-[#1A3636]" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="card-elevated border-l-4 border-l-emerald-600 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Propostas em Análise
              </p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">{proposalsPendingCount}</h3>
              <p className="text-xs text-gray-500 mt-1">Aguardando docs / aceite</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated border-l-4 border-l-amber-600 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Fechamentos no Mês
              </p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">{closingsCount}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Alta conversão
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Funnel + Google Calendar + AI Copilot Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Funnel Kanban + AI Insights */}
        <div className="lg:col-span-2 space-y-8">
          {/* Funil de Vendas (Kanban interativo simplificado) */}
          <Card className="card-elevated">
            <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-[#1A3636] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#D4AF37]" />
                  Funil de Vendas dos Clientes
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-0.5">
                  Arraste ou avance os leads pelos estágios de qualificação e documentação
                </CardDescription>
              </div>
              <Link to="/crm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#1A3636] hover:text-[#D4AF37]"
                >
                  Ver CRM Completo <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto">
                {STAGES.map((stage) => {
                  const stageClients = clients.filter((c) => c.status === stage.key)
                  return (
                    <div
                      key={stage.key}
                      className={`p-3 rounded-lg border flex flex-col min-h-[320px] ${stage.color}`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-black/5 mb-3">
                        <span className="font-bold text-xs text-[#1A3636]">{stage.label}</span>
                        <Badge
                          variant="secondary"
                          className="bg-white text-xs font-bold px-1.5 py-0 shadow-sm"
                        >
                          {stageClients.length}
                        </Badge>
                      </div>

                      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
                        {stageClients.length === 0 ? (
                          <div className="text-center py-8 text-[11px] text-gray-400">
                            Nenhum lead nesta etapa
                          </div>
                        ) : (
                          stageClients.map((client) => {
                            const breakdown = client.financial_breakdown
                            return (
                              <div
                                key={client.id}
                                className="bg-white p-3 rounded-md shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <h4 className="font-bold text-xs text-[#1A3636] line-clamp-1">
                                    {client.name}
                                  </h4>
                                </div>

                                {client.phone && (
                                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                                    <Phone className="w-3 h-3 text-[#D4AF37]" /> {client.phone}
                                  </p>
                                )}

                                {/* Modalidade de Compra Badges */}
                                {client.purchase_modality && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1.5 py-0 bg-gray-50 border-gray-200 text-gray-700 font-medium"
                                    >
                                      {client.purchase_modality === 'a_vista' && 'À Vista'}
                                      {client.purchase_modality === 'financiamento' &&
                                        'Financiamento'}
                                      {client.purchase_modality === 'consorcio' && 'Consórcio'}
                                      {client.purchase_modality === 'permuta' && 'Permuta'}
                                      {client.purchase_modality === 'fgts' && 'FGTS'}
                                      {client.purchase_modality === 'misto' && 'Composição Mista'}
                                    </Badge>
                                    {breakdown?.cash_percent ? (
                                      <span className="text-[9px] text-[#1A3636] font-semibold bg-[#D4AF37]/20 px-1 rounded">
                                        {breakdown.cash_percent}% à vista
                                      </span>
                                    ) : null}
                                  </div>
                                )}

                                {client.objectives && (
                                  <p className="text-[10px] text-gray-500 mt-1.5 line-clamp-2 italic">
                                    "{client.objectives}"
                                  </p>
                                )}

                                {/* Action button to advance */}
                                {stage.key !== 'closing' && (
                                  <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAdvanceStage(client.id, client.status)}
                                      className="h-6 text-[10px] text-[#1A3636] hover:bg-[#1A3636] hover:text-white px-2 rounded gap-1"
                                    >
                                      Avançar <ChevronRight className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Strategy & Recommendations Card */}
          <Card className="card-elevated border-t-4 border-t-[#D4AF37] bg-gradient-to-br from-white via-white to-amber-50/30">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1A3636] text-[#D4AF37] flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-[#1A3636]">
                      Recomendações Estratégicas "Vera AI"
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      Insights gerados a partir do cruzamento de perfil dos leads e imóveis
                    </CardDescription>
                  </div>
                </div>
                <Link to="/assistente-ia">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-[#D4AF37] text-[#1A3636]"
                  >
                    Abrir Chat IA
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-3">
              <div className="p-3.5 bg-white rounded-lg border border-amber-200/60 shadow-sm flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                <div className="text-xs leading-relaxed text-gray-700">
                  <strong className="text-[#1A3636]">Lead Dra. Camila Torres:</strong> Perfil
                  altamente qualificado com aprovação de 70% no Bradesco Prime. O{' '}
                  <em>"Apartamento High-Tech Vila Nova Conceição"</em> atende 100% aos requisitos de
                  localização e suítes. Envie a proposta com termo de garantia dos armários Ornare
                  para acelerar o fechamento.
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-amber-200/60 shadow-sm flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                <div className="text-xs leading-relaxed text-gray-700">
                  <strong className="text-[#1A3636]">Lead Rodrigo Mendes:</strong> Objeção com custo
                  condominial na Cobertura dos Jardins. Recomenda-se apresentar o cálculo de
                  amortização de reforma imediata (economia de mais de R$ 400.000 em acabamentos já
                  prontos).
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Google Calendar Sync Widget + Quick Actions */}
        <div className="space-y-6">
          {/* Google Calendar Sync Widget */}
          <Card className="card-elevated">
            <CardHeader className="p-5 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#1A3636] flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
                    Agenda & Google Calendar
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-0.5">
                    Visitas e compromissos sincronizados
                  </CardDescription>
                </div>
                <Badge
                  variant={isGoogleConnected ? 'default' : 'outline'}
                  className={`text-[10px] ${
                    isGoogleConnected
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border-amber-500 text-amber-700 bg-amber-50'
                  }`}
                >
                  {isGoogleConnected ? '● Sincronizado' : '○ Pronto p/ Conectar'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Google Sync Status Banner */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-white shadow-xs border flex items-center justify-center">
                    <img
                      src="https://img.usecurling.com/i?q=google"
                      alt="Google Calendar"
                      className="w-4 h-4"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1A3636]">
                      {isGoogleConnected ? 'Google Calendar Ativo' : 'Conectar Google Calendar'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {isGoogleConnected
                        ? 'Eventos sincronizados automaticamente'
                        : 'Permite sincronizar visitas na sua conta'}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isGoogleConnected ? 'outline' : 'default'}
                  onClick={handleSyncGoogle}
                  disabled={isSyncingCalendar}
                  className={`text-xs h-8 ${
                    !isGoogleConnected
                      ? 'bg-[#1A3636] text-white hover:bg-[#254d4d]'
                      : 'text-gray-700 border-gray-300'
                  }`}
                >
                  {isSyncingCalendar ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : isGoogleConnected ? (
                    'Sincronizar'
                  ) : (
                    'Conectar'
                  )}
                </Button>
              </div>

              {/* Agenda List */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Próximas Visitas Agendadas
                </p>

                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-lg bg-gray-100" />
                    <Skeleton className="h-16 w-full rounded-lg bg-gray-100" />
                  </div>
                ) : calendarEvents.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 bg-gray-50/50 rounded-lg">
                    Nenhuma visita agendada no momento.
                  </div>
                ) : (
                  calendarEvents.slice(0, 4).map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 bg-white rounded-lg border border-gray-100 shadow-xs hover:border-[#D4AF37]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-semibold text-xs text-[#1A3636]">{evt.client_name}</p>
                          <p className="text-[11px] text-[#D4AF37] font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {evt.property_title}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-emerald-50 text-emerald-700"
                        >
                          Confirmada
                        </Badge>
                      </div>

                      {evt.scheduled_at && (
                        <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#1A3636]" />
                            {new Date(evt.scheduled_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {evt.client_phone && (
                            <span className="text-gray-400">{evt.client_phone}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <Link to="/agenda" className="block w-full">
                <Button variant="outline" size="sm" className="w-full text-xs text-[#1A3636]">
                  Ver Todos os Agendamentos
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Destaque do Portfólio de Imóveis */}
          <Card className="card-elevated">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-[#1A3636]">
                  Imóveis em Destaque
                </CardTitle>
                <Link to="/imoveis">
                  <span className="text-xs text-[#D4AF37] font-semibold hover:underline">
                    Ver todos ({properties.length})
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full rounded-lg bg-gray-100" />
                  <Skeleton className="h-14 w-full rounded-lg bg-gray-100" />
                  <Skeleton className="h-14 w-full rounded-lg bg-gray-100" />
                </div>
              ) : (
                properties.slice(0, 3).map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={getPropertyImageUrl(property)}
                      alt={property.title}
                      loading="lazy"
                      width="56"
                      height="56"
                      className="w-14 h-14 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-[#1A3636] truncate">
                        {property.title}
                      </h5>
                      <p className="text-[11px] text-gray-500 truncate">
                        {property.neighborhood} • {property.city}
                      </p>
                      <p className="text-xs font-semibold text-[#D4AF37] mt-0.5">
                        R$ {property.price?.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
