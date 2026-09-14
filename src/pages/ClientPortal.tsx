import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Percent,
  Phone,
  Mail,
  Send,
  Lock,
  Download,
  Bot,
  Compass,
  Calculator,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  User,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getClientByPortalToken, getClientById } from '@/services/clients'
import { getProposalsByClientId, acceptCounterProposal } from '@/services/proposals'
import { getDocumentsByClientId } from '@/services/documents'
import { getProperties } from '@/services/properties'
import { ClientOnboardingModal } from '@/components/ClientOnboardingModal'
import {
  NegotiationTimeline,
  NEGOTIATION_STAGES,
  inferStageFromProposal,
} from '@/components/NegotiationTimeline'
import { FinancingSimulator } from '@/components/FinancingSimulator'
import { ClientProposalForm } from '@/components/ClientProposalForm'
import { DocumentVault, CHECKLIST_BY_MODALITY } from '@/components/DocumentVault'
import { BROKER_PHONE_DISPLAY, getWhatsAppUrl } from '@/components/FloatingWhatsApp'
import type { Client, Proposal, ClientDocument, Property } from '@/types'

export default function ClientPortal() {
  const { toast } = useToast()
  const { clientPortal, loginClientWithToken } = useAuth()
  const [searchParams] = useSearchParams()

  const [client, setClient] = useState<Client | null>(clientPortal)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [tokenInput, setTokenInput] = useState('')
  const [clientTourOpen, setClientTourOpen] = useState(false)

  // Active tab selection
  const [activeTab, setActiveTab] = useState<'overview' | 'proposal' | 'documents' | 'simulator'>(
    'overview',
  )

  // Bridge state between Simulator and Proposal Form
  const [stagedSimulationData, setStagedSimulationData] = useState<{
    propertyValue?: number
    downPayment?: number
    financingValue?: number
    bankName?: string
    amortizationType?: 'SAC' | 'PRICE'
    termYears?: number
    annualRate?: number
    monthlyInstallment?: number
    fgtsAmount?: number
    consorcioAmount?: number
  } | null>(null)

  // Direct login from URL query param
  useEffect(() => {
    const tokenFromUrl = searchParams.get('portal_token')
    if (tokenFromUrl) {
      handleAuthenticate(tokenFromUrl)
    } else if (clientPortal) {
      loadClientData(clientPortal.id)
    } else {
      setLoading(false)
    }
  }, [searchParams, clientPortal])

  // Fetch available properties for proposal creation / selection
  useEffect(() => {
    getProperties()
      .then((props) => setProperties(props))
      .catch((err) => console.error(err))
  }, [])

  const handleAuthenticate = async (token: string) => {
    try {
      setLoading(true)
      const res = await loginClientWithToken(token)
      if (res.client) {
        setClient(res.client)
        await loadClientData(res.client.id)
      } else {
        toast({
          title: 'Link não encontrado',
          description:
            'Verifique o código de acesso recebido por e-mail ou WhatsApp da Vera Lúcia.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadClientData = async (clientId: string) => {
    try {
      const [freshClient, propsls, docs] = await Promise.all([
        getClientById(clientId),
        getProposalsByClientId(clientId),
        getDocumentsByClientId(clientId),
      ])
      setClient(freshClient)
      setProposals(propsls)
      setDocuments(docs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Handle simulation applied into proposal
  const handleApplySimulation = (simData: any) => {
    setStagedSimulationData(simData)
    setActiveTab('proposal')
    toast({
      title: 'Simulação Carregada!',
      description: 'Navegamos você para a aba de Proposta Comercial com os valores preenchidos.',
    })
  }

  // Handle proposal submission
  const handleProposalSubmitted = (newProposal: Proposal) => {
    setProposals([newProposal, ...proposals.filter((p) => p.id !== newProposal.id)])
    setActiveTab('overview')
    if (client) loadClientData(client.id)
  }

  // Handle client accepting Vera's counterproposal
  const [isAcceptingCounter, setIsAcceptingCounter] = useState(false)
  const handleAcceptCounter = async (proposalId: string) => {
    try {
      setIsAcceptingCounter(true)
      const updated = await acceptCounterProposal(proposalId)
      toast({
        title: '🎉 Contraproposta Aceita com Sucesso!',
        description:
          'Parabéns! Você aceitou os termos da contraproposta. A corretora Vera Lúcia foi notificada imediatamente e entrará em contato para os próximos passos.',
      })
      setProposals((prev) => prev.map((p) => (p.id === proposalId ? updated : p)))
      if (client) loadClientData(client.id)
    } catch (err: any) {
      toast({
        title: 'Erro ao aceitar contraproposta',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsAcceptingCounter(false)
    }
  }

  // Handle client wanting to renegotiate
  const handleRenegotiate = (counterOffer: any) => {
    if (counterOffer?.value) {
      setStagedSimulationData({
        propertyValue: counterOffer.value,
        downPayment: counterOffer.down_payment,
        financingValue: counterOffer.financing_value,
        bankName: counterOffer.bank_partner,
      })
    }
    setActiveTab('proposal')
    toast({
      title: 'Ajuste de Proposta',
      description: 'O formulário foi pré-carregado com os termos para você fazer uma nova rodada.',
    })
  }

  // Unauthenticated login view
  if (!client && !loading) {
    return (
      <div className="max-w-md mx-auto my-12 space-y-6 animate-fade-in px-4">
        <Card className="card-elevated border-t-4 border-t-[#1A3636]">
          <CardHeader className="text-center p-6 pb-2">
            <div className="w-14 h-14 rounded-full bg-[#1A3636] text-[#D4AF37] flex items-center justify-center mx-auto mb-2 shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl font-bold text-[#1A3636]">
              Área Exclusiva do Cliente
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Ambiente privativo para acompanhar sua negociação, simular financiamentos e enviar
              documentação com a corretora Vera Lúcia Koren.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-xs font-semibold">
                Código de Acesso / Token Seguro
              </Label>
              <Input
                id="token"
                placeholder="Ex: token_rodrigo_mendes_77a"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="text-xs bg-gray-50 font-mono"
              />
              <p className="text-[11px] text-gray-400">
                Você recebeu este link seguro no seu WhatsApp oficial ou por e-mail.
              </p>
            </div>

            <Button
              onClick={() => handleAuthenticate(tokenInput)}
              disabled={!tokenInput.trim() || loading}
              className="w-full bg-[#1A3636] text-white hover:bg-[#254d4d] text-xs font-bold py-5"
            >
              Acessar Meu Portal Seguro
            </Button>

            {/* Quick Demo Login links */}
            <div className="pt-4 border-t border-gray-100 text-center space-y-2">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Acesso Rápido de Demonstração
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAuthenticate('token_rodrigo_mendes_77a')}
                  className="text-xs text-gray-700 hover:border-[#D4AF37]"
                >
                  Entrar como Rodrigo Mendes (Misto / Visita)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAuthenticate('token_camila_torres_88b')}
                  className="text-xs text-gray-700 hover:border-[#D4AF37]"
                >
                  Entrar como Dra. Camila Torres (Financiamento)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active client data
  const activeProposal = proposals[0] || null
  const interestedProperty =
    activeProposal?.expand?.property_id ||
    client?.expand?.visit_property_id ||
    properties.find((p) => p.id === client?.visit_property_id) ||
    properties[0]

  const fb = client?.financial_breakdown

  // Compute stages, remaining days and document status
  const currentStageKey = inferStageFromProposal(
    activeProposal?.status,
    activeProposal?.negotiation_stage,
  )
  const currentStageObj =
    NEGOTIATION_STAGES.find((s) => s.key === currentStageKey) || NEGOTIATION_STAGES[0]
  const currentOrder = currentStageObj.order
  const overallNegotiationProgress = Math.round((currentOrder / NEGOTIATION_STAGES.length) * 100)

  const activeModality = client?.purchase_modality || 'financiamento'
  const relevantChecklist = CHECKLIST_BY_MODALITY.filter((item) =>
    item.requiredFor.includes(activeModality),
  )
  const totalRequiredDocs = relevantChecklist.length
  const uploadedDocsCount = relevantChecklist.filter((req) =>
    documents.some((d) => d.type === req.type),
  ).length
  const missingDocsCount = Math.max(0, totalRequiredDocs - uploadedDocsCount)

  // Compute expected next action with realistic days and clear CTA
  const getNextAction = () => {
    if (!activeProposal) {
      return {
        title: 'Enviar Proposta Comercial Formal',
        desc: 'Simule as parcelas e envie formalmente seus termos de compra para análise do vendedor.',
        tab: 'proposal' as const,
        btnText: 'Montar Minha Proposta',
        badge: 'Ação do Comprador',
        urgency: 'high',
      }
    }
    if (activeProposal.status === 'counter_sent') {
      return {
        title: 'Contraproposta Recebida da Vera Lúcia!',
        desc: 'Vera alinhou novas condições com o proprietário vendedor. Avalie os termos e decida o fechamento.',
        tab: 'overview' as const,
        btnText: 'Avaliar Contraproposta',
        badge: 'Decisão Pendente',
        urgency: 'urgent',
      }
    }
    if (missingDocsCount > 0) {
      return {
        title: `Falta enviar ${missingDocsCount} ${missingDocsCount === 1 ? 'documento' : 'documentos'}`,
        desc: `Para avançar na aprovação bancária e minuta jurídica, envie os documentos restantes no cofre seguro.`,
        tab: 'documents' as const,
        btnText: 'Completar Envio de Documentos',
        badge: `${uploadedDocsCount}/${totalRequiredDocs} Enviados`,
        urgency: 'medium',
      }
    }
    if (
      activeProposal.status === 'under_review' ||
      activeProposal.negotiation_stage === 'analise_credito'
    ) {
      return {
        title: 'Documentos em Análise Bancária / Engenharia',
        desc: 'Seus documentos estão em validação técnica. Faltam ~12 a 15 dias úteis para emissão do laudo de avaliação.',
        tab: 'overview' as const,
        btnText: 'Ver Linha do Tempo',
        badge: 'Em Análise',
        urgency: 'low',
      }
    }
    if (activeProposal.status === 'accepted') {
      return {
        title: 'Proposta Aprovada! Próximo: Minuta e Assinatura',
        desc: 'Vera Koren está preparando a minuta oficial do compromisso de compra e venda.',
        tab: 'overview' as const,
        btnText: 'Acompanhar Minuta',
        badge: 'Fase Final',
        urgency: 'low',
      }
    }
    return {
      title: 'Acompanhar Linha do Tempo',
      desc: 'Sua negociação está evoluindo de forma segura e transparente. Acompanhe cada etapa abaixo.',
      tab: 'overview' as const,
      btnText: 'Ver Andamento',
      badge: currentStageObj.shortTitle,
      urgency: 'low',
    }
  }

  const nextAction = getNextAction()

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-16 px-3 sm:px-4">
      {/* 1. RESUMO HERO NO TOPO (Reduzir Ansiedade da Compra) */}
      <div className="bg-gradient-to-br from-[#1A3636] via-[#214343] to-[#122424] text-white p-6 sm:p-7 rounded-2xl shadow-xl border border-[#D4AF37]/40 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-gradient-to-l from-[#D4AF37]/15 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Top Line: Client Name + Foxter Badge */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1 min-w-0 max-w-full">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-6 bg-[#D4AF37] rounded-sm shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-wide break-words">
                  Área do Cliente • {client?.name}
                </h1>
              </div>
              <p className="text-xs text-white/80 break-words">
                Imóvel em Negociação:{' '}
                <strong className="text-[#D4AF37]">
                  {interestedProperty?.title || 'Imóvel Selecionado'}
                </strong>{' '}
                • {interestedProperty?.neighborhood || 'Porto Alegre - RS'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0 max-w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClientTourOpen(true)}
                className="border-[#D4AF37]/70 text-[#D4AF37] hover:bg-white/10 text-xs font-semibold gap-1.5 shadow-xs whitespace-normal sm:whitespace-nowrap h-auto py-1.5"
              >
                <Compass className="w-3.5 h-3.5 shrink-0" /> <span>Como Funciona o Portal</span>
              </Button>
              <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-xs py-1.5 px-3 border-none whitespace-normal text-center">
                Foxter Imobiliária • Vera Koren
              </Badge>
            </div>
          </div>

          {/* Hero Core: Indicador de Progresso Geral & Estimativa de Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Box 1: Progresso Geral X% Concluído */}
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex flex-col justify-between gap-2 min-w-0">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-white/80 font-semibold truncate">
                    Progresso da Negociação
                  </span>
                  <span className="font-extrabold text-base text-[#D4AF37] shrink-0">
                    {overallNegotiationProgress}%
                  </span>
                </div>
                <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#D4AF37] to-amber-300 h-full rounded-full transition-all duration-700"
                    style={{ width: `${overallNegotiationProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] text-white/70 block break-words">
                Etapa {currentOrder} de {NEGOTIATION_STAGES.length}:{' '}
                <strong className="text-white">{currentStageObj.shortTitle}</strong>
              </span>
            </div>

            {/* Box 2: Estimativa Realista de Prazo Restante */}
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex flex-col justify-between gap-1.5 min-w-0">
              <span className="text-[11px] uppercase font-bold text-[#D4AF37] tracking-wider block">
                Estimativa de Prazos
              </span>
              <div className="text-base sm:text-lg font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                {currentStageObj.remainingBusinessDays > 0 ? (
                  <span>Faltam ~{currentStageObj.remainingBusinessDays} dias úteis</span>
                ) : (
                  <span>Etapa Concluída</span>
                )}
              </div>
              <p className="text-[11px] text-white/80 leading-snug break-words">
                {currentStageObj.key === 'documentacao' &&
                  'Baseado na conferência dos documentos e submissão ao banco parceiro.'}
                {currentStageObj.key === 'analise_credito' &&
                  'Prazo para vistoria técnica da engenharia e parecer final de crédito.'}
                {currentStageObj.key !== 'documentacao' &&
                  currentStageObj.key !== 'analise_credito' &&
                  `Duração estimada desta fase: ${currentStageObj.estimatedDuration}.`}
              </p>
            </div>

            {/* Box 3: PRÓXIMA AÇÃO CLARA (Zero Dúvida) */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-white/10 backdrop-blur-xs border border-[#D4AF37]/50 flex flex-col justify-between gap-3 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] uppercase font-bold text-[#D4AF37] tracking-wider flex items-center gap-1 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Próxima Ação Necessária</span>
                  </span>
                  <Badge className="bg-[#D4AF37] text-[#1A3636] text-[10px] font-bold shrink-0 max-w-full whitespace-nowrap">
                    {nextAction.badge}
                  </Badge>
                </div>
                <h4 className="font-bold text-sm text-white leading-snug break-words">
                  {nextAction.title}
                </h4>
              </div>
              <Button
                size="sm"
                onClick={() => setActiveTab(nextAction.tab)}
                className="w-full bg-[#D4AF37] hover:bg-[#b89528] text-[#1A3636] font-bold text-xs min-h-[36px] h-auto py-2 px-3 gap-1.5 shadow-md justify-between items-center whitespace-normal text-left"
              >
                <span className="line-clamp-2 leading-tight flex-1 mr-1">{nextAction.btnText}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Acolhimento, Mensagem da Vera e Seção "O que acontece agora" */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Mensagem Acolhedora da Vera (Reduzir Ansiedade) */}
        <Card className="card-elevated border-l-4 border-l-[#1A3636] flex flex-col justify-between bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#1A3636] tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Atendimento Exclusivo
              </span>
              <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-bold">Online</Badge>
            </div>
            <CardTitle className="text-sm font-bold text-[#1A3636] flex items-center gap-1.5">
              Corretora Vera Lúcia Koren
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              CRECI 38415 • Foxter Imobiliária Porto Alegre
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-1 space-y-3 text-xs">
            {client?.broker_message ? (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-gray-800 shadow-2xs">
                <span className="font-bold text-[#1A3636] block mb-1">
                  Mensagem Pessoal da Vera:
                </span>
                <p className="italic leading-relaxed">"{client.broker_message}"</p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/40 border border-emerald-200/60 rounded-xl text-[11px] text-gray-700 leading-relaxed italic shadow-2xs">
                "Estou acompanhando cada detalhe da sua negociação para garantir que você tenha a
                máxima tranquilidade, segurança jurídica e a menor taxa de financiamento."
              </div>
            )}

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <a
                href={getWhatsAppUrl(
                  `Olá Vera, estou no meu Portal do Cliente acompanhando o imóvel ${interestedProperty?.title || ''} e gostaria de bater um papo rápido!`,
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs shrink-0"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />{' '}
                <span>WhatsApp Direto</span>
              </a>
              <span className="text-[11px] text-gray-500 font-mono font-medium truncate">
                {BROKER_PHONE_DISPLAY}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Seção "O que acontece agora" */}
        <Card className="card-elevated border-l-4 border-l-[#D4AF37] flex flex-col justify-between bg-gradient-to-br from-amber-50/20 to-white">
          <CardHeader className="p-4 pb-2">
            <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Transparência do Processo
            </span>
            <CardTitle className="text-sm font-bold text-[#1A3636] leading-snug">
              O Que Acontece Agora?
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Etapa atual: <strong>{currentStageObj.title}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-1 space-y-2 text-xs">
            <p className="text-gray-700 leading-relaxed text-[11px] bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
              {currentStageObj.whatHappensNow}
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-gray-500">
              <span>Duração esperada: {currentStageObj.estimatedDuration}</span>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="font-bold text-[#1A3636] hover:underline flex items-center gap-0.5"
              >
                Ver 8 etapas <ChevronRight className="w-3 h-3 text-[#D4AF37]" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Status dos Documentos com Acesso Rápido */}
        <Card className="card-elevated border-l-4 border-l-teal-600 flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-teal-600" /> Cofre de Documentos
            </span>
            <CardTitle className="text-sm font-bold text-[#1A3636]">
              {uploadedDocsCount} de {totalRequiredDocs} Enviados
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              {missingDocsCount === 0
                ? 'Todos os documentos foram enviados!'
                : `Faltam ${missingDocsCount} itens para aprovação completa.`}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-1 space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>Conclusão:</span>
                <span className="font-bold text-[#1A3636]">
                  {Math.round((uploadedDocsCount / Math.max(1, totalRequiredDocs)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((uploadedDocsCount / Math.max(1, totalRequiredDocs)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setActiveTab('documents')}
              className="w-full bg-[#1A3636] hover:bg-[#254d4d] text-white text-xs font-bold gap-1 h-8"
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{missingDocsCount > 0 ? 'Enviar Documentos Faltantes' : 'Acessar Cofre'}</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs for All Functions */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="w-full space-y-6 min-w-0"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 bg-gray-100 p-1.5 rounded-xl h-auto">
          <TabsTrigger
            value="overview"
            className="text-xs py-2.5 px-2 font-bold data-[state=active]:bg-[#1A3636] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 text-center whitespace-normal"
          >
            <Clock className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
            <span className="truncate">Status</span>
            <span className="hidden sm:inline">da Negociação</span>
          </TabsTrigger>

          <TabsTrigger
            value="proposal"
            className="text-xs py-2.5 px-2 font-bold data-[state=active]:bg-[#1A3636] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 text-center whitespace-normal"
          >
            <FileText className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
            <span className="truncate">Minha Proposta</span>
          </TabsTrigger>

          <TabsTrigger
            value="documents"
            className="text-xs py-2.5 px-2 font-bold data-[state=active]:bg-[#1A3636] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 text-center whitespace-normal"
          >
            <UploadCloud className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
            <span className="truncate">Cofre</span>
            <span className="hidden sm:inline">de Documentos</span>
          </TabsTrigger>

          <TabsTrigger
            value="simulator"
            className="text-xs py-2.5 px-2 font-bold data-[state=active]:bg-[#1A3636] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 text-center whitespace-normal"
          >
            <Calculator className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
            <span className="truncate">Simulador</span>
            <span className="hidden sm:inline">de Financiamento</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & NEGOTIATION TIMELINE */}
        <TabsContent value="overview" className="space-y-6">
          <NegotiationTimeline
            currentStage={
              activeProposal?.status === 'counter_sent'
                ? 'proposta_em_analise'
                : activeProposal?.negotiation_stage
            }
            proposalStatus={activeProposal?.status}
            lastUpdatedDate={activeProposal?.updated || client?.updated}
            propertyTitle={interestedProperty?.title}
          />

          {/* HIGHLIGHTED COUNTER-OFFER CARD FOR CLIENT */}
          {activeProposal && activeProposal.counter_offer && (
            <Card className="card-elevated border-2 border-[#D4AF37] bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 shadow-lg overflow-hidden animate-fade-in">
              <div className="bg-[#1A3636] text-white p-4 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#D4AF37]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1.5 rounded-md bg-[#D4AF37] text-[#1A3636] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm tracking-wide text-white break-words">
                      CONTRAPROPOSTA COMERCIAL DA CORRETORA VERA LÚCIA
                    </h3>
                    <p className="text-[11px] text-[#D4AF37] break-words">
                      Condições ajustadas para fechamento do negócio
                    </p>
                  </div>
                </div>

                <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-xs shrink-0 whitespace-nowrap">
                  {activeProposal.status === 'accepted'
                    ? '✓ Aceita por Você'
                    : 'Aguardando Sua Decisão'}
                </Badge>
              </div>
              <CardContent className="p-6 space-y-5">
                {/* Personal note from Vera */}
                {activeProposal.counter_offer.notes && (
                  <div className="p-3.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold text-[#1A3636] uppercase tracking-wide flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Recado Pessoal da
                      Vera Lúcia:
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed italic">
                      "{activeProposal.counter_offer.notes}"
                    </p>
                  </div>
                )}

                {/* Values Comparison Table */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs min-w-0">
                    <span className="text-gray-400 block text-[11px]">Novo Valor Proposto</span>
                    <span className="font-bold text-lg text-[#1A3636] break-all sm:break-normal">
                      R$ {activeProposal.counter_offer.value?.toLocaleString('pt-BR')}
                    </span>
                    {activeProposal.value && (
                      <span className="text-[10px] text-gray-500 block mt-0.5 break-words">
                        Sua proposta: R$ {activeProposal.value.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs min-w-0">
                    <span className="text-gray-400 block text-[11px]">Entrada Sugerida</span>
                    <span className="font-bold text-base text-[#1A3636] break-all sm:break-normal">
                      R${' '}
                      {activeProposal.counter_offer.down_payment?.toLocaleString('pt-BR') || '--'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs min-w-0">
                    <span className="text-gray-400 block text-[11px]">Financiamento</span>
                    <span className="font-bold text-base text-emerald-800 break-all sm:break-normal">
                      R${' '}
                      {activeProposal.counter_offer.financing_value?.toLocaleString('pt-BR') ||
                        '--'}
                    </span>
                    {activeProposal.counter_offer.bank_partner && (
                      <span className="text-[10px] text-gray-500 block mt-0.5 truncate">
                        {activeProposal.counter_offer.bank_partner}
                      </span>
                    )}
                  </div>
                </div>
                {/* Conditions / Terms */}
                {(activeProposal.counter_offer.payment_terms ||
                  activeProposal.counter_offer.conditions) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {activeProposal.counter_offer.payment_terms && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <strong className="text-gray-700 block mb-1">Prazos e Pagamento:</strong>
                        <p className="text-gray-600 leading-relaxed">
                          {activeProposal.counter_offer.payment_terms}
                        </p>
                      </div>
                    )}
                    {activeProposal.counter_offer.conditions && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <strong className="text-gray-700 block mb-1">
                          Condições & Benfeitorias:
                        </strong>
                        <p className="text-gray-600 leading-relaxed">
                          {activeProposal.counter_offer.conditions}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Validity and Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-amber-200/50">
                  {activeProposal.counter_offer.valid_until && (
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        Condições válidas até{' '}
                        <strong>
                          {new Date(
                            activeProposal.counter_offer.valid_until + 'T23:59:59',
                          ).toLocaleDateString('pt-BR')}
                        </strong>
                      </span>
                    </div>
                  )}

                  {activeProposal.status === 'counter_sent' && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRenegotiate(activeProposal.counter_offer)}
                        className="text-xs border-gray-300 text-gray-700 hover:bg-gray-100 flex-1 sm:flex-initial"
                      >
                        Negociar Novamente
                      </Button>
                      <Button
                        size="sm"
                        disabled={isAcceptingCounter}
                        onClick={() => handleAcceptCounter(activeProposal.id)}
                        className="bg-[#1A3636] hover:bg-[#254d4d] text-white font-bold text-xs gap-1.5 flex-1 sm:flex-initial shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {isAcceptingCounter ? 'Processando...' : 'Aceitar Contraproposta'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Summary of Current Proposal if exists */}
          {activeProposal && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-elevated md:col-span-2 border-t-4 border-t-[#D4AF37]">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-[#1A3636] flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#D4AF37]" /> Resumo dos Valores
                        Acordados
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 mt-0.5">
                        {interestedProperty?.title} • {interestedProperty?.neighborhood}
                      </CardDescription>
                    </div>

                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {activeProposal.status === 'docs_pending' && 'Aguardando Seus Documentos'}
                      {activeProposal.status === 'under_review' && 'Documentos em Análise'}
                      {activeProposal.status === 'accepted' && 'Proposta Aceita!'}
                      {activeProposal.status === 'sent' && 'Proposta Enviada'}
                      {activeProposal.status === 'rejected' && 'Em Contraproposta'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <div className="min-w-0">
                      <span className="text-gray-400 block text-[11px]">Valor Proposto</span>
                      <span className="font-bold text-base text-[#1A3636] break-all sm:break-normal">
                        R$ {activeProposal.value?.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-gray-400 block text-[11px]">Entrada / Sinal</span>
                      <span className="font-bold text-sm text-[#1A3636] break-all sm:break-normal">
                        R$ {activeProposal.down_payment?.toLocaleString('pt-BR') || '--'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-gray-400 block text-[11px]">Saldo Financiado</span>
                      <span className="font-bold text-sm text-emerald-700 break-all sm:break-normal">
                        R$ {activeProposal.financing_value?.toLocaleString('pt-BR') || '--'}
                      </span>
                    </div>
                  </div>

                  {activeProposal.payment_terms && (
                    <div className="text-xs">
                      <span className="font-semibold text-gray-700 block mb-0.5">
                        Condições Estruturadas:
                      </span>
                      <p className="text-gray-600 leading-relaxed bg-white p-3 rounded-lg border border-gray-200">
                        {activeProposal.payment_terms}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('proposal')}
                      className="text-xs text-[#1A3636] border-gray-300 flex-1 sm:flex-initial"
                    >
                      Ajustar Termos da Proposta
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('documents')}
                      className="bg-[#1A3636] text-white hover:bg-[#254d4d] text-xs font-bold gap-1 flex-1 sm:flex-initial"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />{' '}
                      <span>Enviar Documentação</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Composition Breakdown */}
              <Card className="card-elevated space-y-4 p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-[#1A3636] flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-[#D4AF37]" /> Sua Composição Financeira
                  </h3>

                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 text-xs space-y-2">
                    <div className="flex justify-between font-medium text-gray-700">
                      <span>Modalidade:</span>
                      <strong className="text-[#1A3636] capitalize">
                        {(client?.purchase_modality || 'financiamento').replace('_', ' ')}
                      </strong>
                    </div>

                    {fb && (
                      <div className="space-y-1 pt-1 border-t border-amber-200/40 text-[11px] text-gray-600">
                        {fb.cash_percent ? <div>• {fb.cash_percent}% Recursos Próprios</div> : null}
                        {fb.finance_percent ? (
                          <div>
                            • {fb.finance_percent}% Banco {fb.finance_bank || ''}
                          </div>
                        ) : null}
                        {fb.fgts_percent ? <div>• {fb.fgts_percent}% FGTS</div> : null}
                        {fb.permuta_percent ? <div>• {fb.permuta_percent}% Permuta</div> : null}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('simulator')}
                  className="w-full text-xs text-[#1A3636] border-[#D4AF37]/50 hover:bg-amber-50/40 font-semibold gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5 text-[#D4AF37]" /> Simular Novo Cenário
                </Button>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: PROPOSAL FORM */}
        <TabsContent value="proposal" className="space-y-6">
          <ClientProposalForm
            client={client}
            properties={properties}
            activeProposal={activeProposal}
            initialSimulationData={stagedSimulationData}
            onProposalSubmitted={handleProposalSubmitted}
          />
        </TabsContent>

        {/* TAB 3: DOCUMENT VAULT */}
        <TabsContent value="documents" className="space-y-6">
          <DocumentVault
            client={client}
            proposal={activeProposal}
            documents={documents}
            onDocumentsChange={() => loadClientData(client.id)}
          />
        </TabsContent>

        {/* TAB 4: FINANCING SIMULATOR */}
        <TabsContent value="simulator" className="space-y-6">
          <FinancingSimulator
            propertyPrice={interestedProperty?.price || 2450000}
            propertyTitle={interestedProperty?.title || 'Imóvel Selecionado'}
            initialDownPaymentPercent={20}
            onApplySimulationToProposal={handleApplySimulation}
          />
        </TabsContent>
      </Tabs>

      {/* Client Onboarding Walkthrough */}
      <ClientOnboardingModal
        forceOpen={clientTourOpen}
        onCloseManual={() => setClientTourOpen(false)}
      />
    </div>
  )
}
