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
import { getProposalsByClientId } from '@/services/proposals'
import { getDocumentsByClientId } from '@/services/documents'
import { getProperties } from '@/services/properties'
import { ClientOnboardingModal } from '@/components/ClientOnboardingModal'
import { NegotiationTimeline } from '@/components/NegotiationTimeline'
import { FinancingSimulator } from '@/components/FinancingSimulator'
import { ClientProposalForm } from '@/components/ClientProposalForm'
import { DocumentVault } from '@/components/DocumentVault'
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

  // Compute expected next action
  const getNextAction = () => {
    if (!activeProposal) {
      return {
        title: 'Enviar Proposta Comercial',
        desc: 'Simule as parcelas e envie formalmente seus termos de compra para análise da proprietária.',
        tab: 'proposal' as const,
        btnText: 'Montar Minha Proposta',
      }
    }
    if (
      activeProposal.status === 'docs_pending' ||
      activeProposal.negotiation_stage === 'documentacao'
    ) {
      return {
        title: 'Enviar Documentos Pessoais e Renda',
        desc: 'Seu cofre de documentos está aguardando o upload do RG, comprovante de renda e residência.',
        tab: 'documents' as const,
        btnText: 'Abrir Cofre de Documentos',
      }
    }
    if (activeProposal.status === 'under_review') {
      return {
        title: 'Documentos em Análise Bancária',
        desc: 'Aguarde a emissão do parecer da engenharia e validação do banco escolhido.',
        tab: 'overview' as const,
        btnText: 'Ver Linha do Tempo',
      }
    }
    if (activeProposal.status === 'accepted') {
      return {
        title: 'Proposta Aprovada! Próximo: Minuta e Assinatura',
        desc: 'Vera Koren está preparando a minuta do compromisso de compra e venda.',
        tab: 'overview' as const,
        btnText: 'Falar com a Vera',
      }
    }
    return {
      title: 'Acompanhar Linha do Tempo',
      desc: 'Sua negociação está em andamento. Veja o status das etapas abaixo.',
      tab: 'overview' as const,
      btnText: 'Ver Status',
    }
  }

  const nextAction = getNextAction()

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-16 px-3 sm:px-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1A3636] via-[#244848] to-[#142A2A] text-white p-6 rounded-2xl shadow-lg border border-[#D4AF37]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#D4AF37]/10 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#D4AF37] rounded-sm" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide">
              Área do Cliente • {client?.name}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
            Painel exclusivo de negociação imobiliária em Porto Alegre. Faça propostas, envie
            documentos no cofre seguro e simule condições de financiamento bancário em tempo real.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setClientTourOpen(true)}
            className="border-[#D4AF37]/70 text-[#D4AF37] hover:bg-white/10 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Compass className="w-3.5 h-3.5" /> Como Funciona o Portal
          </Button>
          <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-xs py-1.5 px-3 border-none">
            Foxter Imobiliária • Vera Koren
          </Badge>
        </div>
      </div>

      {/* Top Quick Status & Next Action Executive Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Imóvel em Negociação */}
        <Card className="card-elevated border-l-4 border-l-[#1A3636] flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Imóvel de Interesse
            </span>
            <CardTitle className="text-sm font-bold text-[#1A3636] flex items-center gap-1.5 leading-snug">
              <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
              {interestedProperty?.title || 'Imóvel em Negociação'}
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              {interestedProperty?.neighborhood} • Porto Alegre - RS
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-1 space-y-2 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-500">Valor de Avaliação:</span>
              <strong className="text-sm text-[#1A3636]">
                R$ {interestedProperty?.price?.toLocaleString('pt-BR')}
              </strong>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>Modalidade Pretendida:</span>
              <strong className="text-gray-800 capitalize">
                {(client?.purchase_modality || 'financiamento').replace('_', ' ')}
              </strong>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Próxima Ação Esperada */}
        <Card className="card-elevated border-l-4 border-l-[#D4AF37] flex flex-col justify-between bg-gradient-to-br from-amber-50/20 to-white">
          <CardHeader className="p-4 pb-2">
            <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
              Próximo Passo Recomendado
            </span>
            <CardTitle className="text-sm font-bold text-[#1A3636] flex items-center gap-1.5 leading-snug">
              <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
              {nextAction.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 pt-1 space-y-3 text-xs">
            <p className="text-gray-600 leading-snug text-[11px]">{nextAction.desc}</p>
            <Button
              size="sm"
              onClick={() => setActiveTab(nextAction.tab)}
              className="w-full bg-[#1A3636] hover:bg-[#254d4d] text-white text-xs font-bold gap-1 h-8"
            >
              <span>{nextAction.btnText}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </Button>
          </CardContent>
        </Card>

        {/* Card 3: Vera Koren Broker Direct Contact & Recado */}
        <Card className="card-elevated border-l-4 border-l-emerald-600 flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Corretora Especialista
              </span>
              <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-bold">Online</Badge>
            </div>
            <CardTitle className="text-sm font-bold text-[#1A3636] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              Vera Lúcia Koren
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              CRECI 38415 • Foxter Imobiliária
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-1 space-y-2 text-xs">
            {client?.broker_message ? (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-lg text-[11px] text-gray-700">
                <span className="font-bold text-[#1A3636] block mb-0.5">Recado da Vera:</span>"
                {client.broker_message}"
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">
                "Estou à disposição para negociar as melhores condições de preço e conduzir a
                análise de crédito do seu novo imóvel."
              </p>
            )}

            <div className="pt-1 flex items-center justify-between">
              <a
                href={getWhatsAppUrl(
                  `Olá Vera, estou no meu Portal do Cliente referente ao imóvel ${interestedProperty?.title || ''} e gostaria de tirar uma dúvida!`,
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
              >
                <Phone className="w-3.5 h-3.5" /> Falar no WhatsApp
              </a>
              <span className="text-[11px] text-gray-400 font-mono">{BROKER_PHONE_DISPLAY}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs for All Functions */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-100 p-1.5 rounded-xl h-auto">
          <TabsTrigger
            value="overview"
            className="text-xs py-2.5 font-bold data-[state=active]:bg-[#1A3636] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5 text-[#D4AF37]" />
            Status da Negociação
          </TabsTrigger>

          <TabsTrigger
            value="proposal"
            className="text-xs py-2.5 font-bold data-[state=active]:bg-[#1A3636] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5 text-[#D4AF37]" />
            Minha Proposta
          </TabsTrigger>

          <TabsTrigger
            value="documents"
            className="text-xs py-2.5 font-bold data-[state=active]:bg-[#1A3636] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-[#D4AF37]" />
            Cofre de Documentos
          </TabsTrigger>

          <TabsTrigger
            value="simulator"
            className="text-xs py-2.5 font-bold data-[state=active]:bg-[#1A3636] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5 mr-1.5 text-[#D4AF37]" />
            Simulador de Financiamento
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & NEGOTIATION TIMELINE */}
        <TabsContent value="overview" className="space-y-6">
          <NegotiationTimeline
            currentStage={activeProposal?.negotiation_stage}
            proposalStatus={activeProposal?.status}
            lastUpdatedDate={activeProposal?.updated || client?.updated}
            propertyTitle={interestedProperty?.title}
          />

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
                    <div>
                      <span className="text-gray-400 block text-[11px]">Valor Proposto</span>
                      <span className="font-bold text-base text-[#1A3636]">
                        R$ {activeProposal.value?.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Entrada / Sinal</span>
                      <span className="font-bold text-sm text-[#1A3636]">
                        R$ {activeProposal.down_payment?.toLocaleString('pt-BR') || '--'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Saldo Financiado</span>
                      <span className="font-bold text-sm text-emerald-700">
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

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('proposal')}
                      className="text-xs text-[#1A3636] border-gray-300"
                    >
                      Ajustar Termos da Proposta
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('documents')}
                      className="bg-[#1A3636] text-white hover:bg-[#254d4d] text-xs font-bold gap-1"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-[#D4AF37]" /> Enviar Documentação
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
