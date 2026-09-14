import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Phone,
  Mail,
  Building2,
  Calendar,
  FileCheck2,
  FileText,
  Percent,
  MessageCircle,
  ExternalLink,
  Edit,
  Trash2,
  AlertTriangle,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle2,
  User,
  ShieldCheck,
  Send,
  ArrowRight,
} from 'lucide-react'
import { getWhatsAppUrl, BROKER_PHONE_DISPLAY } from '@/components/FloatingWhatsApp'
import { getProposalsByClientId } from '@/services/proposals'
import {
  getDocumentsByClientId,
  updateDocumentStatusWithHistory,
  getDocumentDownloadUrl,
} from '@/services/documents'
import { formatRelativeTime, CHECKLIST_BY_MODALITY } from '@/components/DocumentVault'
import { NEGOTIATION_STAGES, inferStageFromProposal } from '@/components/NegotiationTimeline'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { KANBAN_STAGES } from './CRMKanbanColumn'
import { formatLeadAge, getFinancialSummary } from './CRMKanbanCard'
import type {
  Client,
  Property,
  Proposal,
  ClientStatus,
  ClientDocument,
  DocumentStatus,
} from '@/types'

interface ClientDetailDrawerProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  properties: Property[]
  onStatusChange: (clientId: string, newStatus: ClientStatus) => Promise<void>
  onEditClient: (client: Client) => void
  onDeleteClient: (clientId: string) => void
  onPropertyClick: (property: Property) => void
  onCreateProposalForClient: (client: Client) => void
}

export function ClientDetailDrawer({
  client,
  isOpen,
  onClose,
  properties,
  onStatusChange,
  onEditClient,
  onDeleteClient,
  onPropertyClick,
  onCreateProposalForClient,
}: ClientDetailDrawerProps) {
  const { toast } = useToast()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([])
  const [loadingProposals, setLoadingProposals] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Document review modal inside CRM
  const [reviewingDoc, setReviewingDoc] = useState<ClientDocument | null>(null)
  const [reviewAction, setReviewAction] = useState<DocumentStatus>('verified')
  const [reviewNotes, setReviewNotes] = useState<string>('')
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Find interested properties
  const interestedProps: Property[] = React.useMemo(() => {
    if (!client) return []
    const ids = new Set<string>()
    if (client.interested_property_ids) {
      client.interested_property_ids.forEach((id) => ids.add(id))
    }
    if (client.visit_property_id) {
      ids.add(client.visit_property_id)
    }
    return properties.filter((p) => ids.has(p.id))
  }, [client, properties])

  // Load client proposals & documents when drawer opens
  const loadClientDrawerData = async () => {
    if (!client) return
    try {
      setLoadingProposals(true)
      setLoadingDocs(true)
      const [props, docs] = await Promise.all([
        getProposalsByClientId(client.id),
        getDocumentsByClientId(client.id),
      ])
      setProposals(props)
      setClientDocuments(docs)
    } catch (err) {
      console.error('Erro ao carregar dados do cliente no drawer', err)
    } finally {
      setLoadingProposals(false)
      setLoadingDocs(false)
    }
  }

  useEffect(() => {
    if (client && isOpen) {
      loadClientDrawerData()
    }
  }, [client, isOpen])

  const handleOpenDocReviewModal = (doc: ClientDocument, targetStatus: DocumentStatus) => {
    setReviewingDoc(doc)
    setReviewAction(targetStatus)
    setReviewNotes(
      doc.notes ||
        (targetStatus === 'verified'
          ? 'Documento perfeitamente legível e válido para tramitação.'
          : 'Por favor reenviar com documento frente e verso nítidos.'),
    )
    setIsReviewModalOpen(true)
  }

  const handleConfirmDocReview = async () => {
    if (!reviewingDoc) return
    setIsSubmittingReview(true)
    try {
      await updateDocumentStatusWithHistory({
        id: reviewingDoc.id,
        status: reviewAction,
        notes: reviewNotes,
        actorName: 'Vera Lúcia Koren',
        currentDoc: reviewingDoc,
      })
      toast({
        title:
          reviewAction === 'verified'
            ? '✓ Documento Aprovado com Sucesso!'
            : '✕ Ajuste Solicitado ao Cliente',
        description: 'Status e observação foram sincronizados com o portal do cliente.',
      })
      setIsReviewModalOpen(false)
      if (client) {
        const docs = await getDocumentsByClientId(client.id)
        setClientDocuments(docs)
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar avaliação do documento',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (!client) return null

  const fb = client.financial_breakdown
  const financialSummary = getFinancialSummary(client)
  const leadAge = formatLeadAge(client.created)

  // Quick Negotiation Progress Metrics for Vera
  const activeProposal = proposals[0] || null
  const currentStageKey = inferStageFromProposal(
    activeProposal?.status,
    activeProposal?.negotiation_stage,
  )
  const currentStageObj =
    NEGOTIATION_STAGES.find((s) => s.key === currentStageKey) || NEGOTIATION_STAGES[0]
  const currentOrder = currentStageObj.order
  const negotiationProgressPercent = Math.round((currentOrder / NEGOTIATION_STAGES.length) * 100)

  const activeModality = client.purchase_modality || 'financiamento'
  const relevantChecklist = CHECKLIST_BY_MODALITY.filter((item) =>
    item.requiredFor.includes(activeModality),
  )
  const totalRequiredDocs = relevantChecklist.length
  const uploadedDocsCount = relevantChecklist.filter((req) =>
    clientDocuments.some((d) => d.type === req.type),
  ).length
  const verifiedDocsCount = relevantChecklist.filter((req) => {
    const doc = clientDocuments.find((d) => d.type === req.type)
    return doc && doc.status === 'verified'
  }).length
  const docCompletionPercent =
    totalRequiredDocs > 0 ? Math.round((uploadedDocsCount / totalRequiredDocs) * 100) : 0

  // Build Vera WhatsApp Message
  const primaryPropTitle = interestedProps[0]?.title || client.expand?.visit_property_id?.title
  const defaultWaText = primaryPropTitle
    ? `Olá ${client.name}! Aqui é a Vera Lúcia Koren. Estou acompanhando seu interesse no imóvel "${primaryPropTitle}". Temos novidades sobre as condições de negociação e gostaria de bater um papo rápido!`
    : `Olá ${client.name}! Aqui é a Vera Lúcia Koren, corretora. Gostaria de dar seguimento ao seu atendimento imobiliário e apresentar as melhores oportunidades em Porto Alegre!`

  const waUrl = getWhatsAppUrl(defaultWaText)

  const handleStatusSelect = async (newVal: string) => {
    if (!newVal || newVal === client.status) return
    setIsUpdatingStatus(true)
    try {
      await onStatusChange(client.id, newVal as ClientStatus)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col bg-white border-l border-gray-200 overflow-hidden"
      >
        {/* Drawer Header */}
        <SheetHeader className="p-6 pb-4 bg-gradient-to-r from-gray-50 via-white to-amber-50/20 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-[#D4AF37] rounded-sm" />
                <SheetTitle className="text-xl font-bold text-[#1A3636] truncate">
                  {client.name}
                </SheetTitle>
              </div>
              <SheetDescription className="text-xs text-gray-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                {leadAge} • Cadastrado em {new Date(client.created).toLocaleDateString('pt-BR')}
              </SheetDescription>
            </div>

            {/* Quick Edit and Delete buttons */}
            <div className="flex items-center gap-1 shrink-0 mr-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditClient(client)}
                className="h-8 px-2.5 text-xs text-gray-700 border-gray-300 hover:text-[#1A3636] hover:bg-gray-100 gap-1"
                title="Editar dados cadastrais"
              >
                <Edit className="w-3.5 h-3.5 text-[#D4AF37]" /> Editar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteClient(client.id)}
                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Excluir cliente"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Status selector directly inside drawer */}
          <div className="mt-4 pt-3 border-t border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1A3636]">Funil CRM:</span>
              <Badge className="bg-[#1A3636] text-[#D4AF37] text-xs font-semibold">
                {KANBAN_STAGES.find((s) => s.key === client.status)?.label || client.status}
              </Badge>
            </div>

            <div className="w-full sm:w-56">
              <Select
                value={client.status}
                onValueChange={handleStatusSelect}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="h-8 text-xs bg-gray-50">
                  <SelectValue placeholder="Mudar estágio" />
                </SelectTrigger>
                <SelectContent>
                  {KANBAN_STAGES.map((st) => (
                    <SelectItem key={st.key} value={st.key} className="text-xs">
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Context Summary Card for Vera (Contexto Imediato) */}
          <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50/60 via-amber-50/30 to-white rounded-xl border border-emerald-200/70 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                Etapa da Negociação
              </span>
              <span className="font-bold text-[#1A3636] block truncate">
                {currentStageObj.title}
              </span>
              <span className="text-[10px] text-emerald-800">
                Progresso: {negotiationProgressPercent}%
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                Cofre de Documentos
              </span>
              <span className="font-bold text-[#1A3636] block">
                {uploadedDocsCount}/{totalRequiredDocs} ({docCompletionPercent}%)
              </span>
              <span className="text-[10px] text-gray-500">
                {verifiedDocsCount} aprovados • {uploadedDocsCount - verifiedDocsCount} em análise
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                Proposta Ativa
              </span>
              <span className="font-bold text-emerald-800 block truncate">
                {activeProposal
                  ? `R$ ${activeProposal.value?.toLocaleString('pt-BR')}`
                  : 'Nenhuma emitida'}
              </span>
              <span className="text-[10px] text-gray-500 capitalize">
                {activeProposal ? activeProposal.status.replace('_', ' ') : 'Sem proposta'}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Drawer Scrollable Body with Tabs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* WhatsApp Direct Action Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-[#1A3636] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm flex items-center gap-1.5 text-white">
                <MessageCircle className="w-4 h-4 fill-white text-emerald-500" />
                Atendimento Vera Lúcia via WhatsApp
              </h4>
              <p className="text-[11px] text-white/90">
                Inicie uma conversa direta com mensagem contextualizada sobre a negociação.
              </p>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto shrink-0 bg-white hover:bg-emerald-50 text-emerald-800 font-bold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-emerald-700" />
              Abrir WhatsApp ({client.phone || BROKER_PHONE_DISPLAY})
            </a>
          </div>

          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4 bg-gray-100 p-1">
              <TabsTrigger value="geral" className="text-xs">
                Perfil & Contatos
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs">
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs">
                Documentos ({clientDocuments.length})
              </TabsTrigger>
              <TabsTrigger value="imoveis" className="text-xs">
                Imóveis ({interestedProps.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: GERAL (Contatos, Objetivos, Objeções, Visita) */}
            <TabsContent value="geral" className="space-y-4 m-0">
              {/* Contact Info Card */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2">
                <span className="font-bold text-[#1A3636] text-xs uppercase tracking-wider block">
                  Informações de Contato
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                    <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 block">Telefone / WhatsApp</span>
                      <span className="font-semibold text-xs">
                        {client.phone || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                    <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-gray-400 block">E-mail</span>
                      <span className="font-semibold text-xs truncate block">
                        {client.email || 'Não informado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visita Agendada Card */}
              {client.visit_scheduled_at && (
                <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1A3636] text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#D4AF37]" /> Visita Presencial Agendada
                    </span>
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                      Confirmada
                    </Badge>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-100 space-y-1">
                    <p className="font-bold text-xs text-[#1A3636]">
                      {new Date(client.visit_scheduled_at).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {client.visit_notes && (
                      <p className="text-gray-600 text-[11px] italic">"{client.visit_notes}"</p>
                    )}
                  </div>
                </div>
              )}

              {/* Objectives */}
              <div className="space-y-1.5">
                <span className="font-bold text-xs text-[#1A3636] uppercase tracking-wider">
                  Objetivos Declarados pelo Cliente
                </span>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 leading-relaxed">
                  {client.objectives || (
                    <span className="text-gray-400 italic">
                      Nenhum objetivo específico registrado ainda.
                    </span>
                  )}
                </div>
              </div>

              {/* Objections */}
              <div className="space-y-1.5">
                <span className="font-bold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Objeções ou Dúvidas Registradas
                </span>
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 text-amber-950 leading-relaxed">
                  {client.objections_notes || (
                    <span className="text-gray-400 italic">
                      Nenhuma objeção crítica levantada até o momento.
                    </span>
                  )}
                </div>
              </div>

              {/* General internal notes */}
              {client.notes && (
                <div className="space-y-1.5">
                  <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Notas Internas da Corretora
                  </span>
                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-gray-600 whitespace-pre-line">
                    {client.notes}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: FINANCEIRO (Breakdown, % à vista, bancos, FGTS, Permuta) */}
            <TabsContent value="financeiro" className="space-y-4 m-0">
              <div className="p-4 bg-gradient-to-br from-white to-amber-50/40 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1A3636] uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-[#D4AF37]" /> Composição Financeira de Compra
                  </span>
                  <Badge className="bg-[#1A3636] text-white text-[10px]">
                    {client.purchase_modality === 'a_vista' && '100% À Vista'}
                    {client.purchase_modality === 'financiamento' && 'Financiamento'}
                    {client.purchase_modality === 'consorcio' && 'Consórcio'}
                    {client.purchase_modality === 'permuta' && 'Permuta'}
                    {client.purchase_modality === 'fgts' && 'FGTS'}
                    {client.purchase_modality === 'misto' && 'Misto'}
                    {!client.purchase_modality && 'Em análise'}
                  </Badge>
                </div>

                <div className="p-3 bg-white rounded-lg border border-amber-200/60 font-semibold text-[#1A3636] text-xs">
                  {financialSummary}
                </div>

                {/* Metric grid of percentages */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-400 block">% À Vista</span>
                    <span className="font-extrabold text-sm text-[#1A3636]">
                      {fb?.cash_percent ?? 0}%
                    </span>
                    {fb?.cash_amount ? (
                      <span className="text-[9px] text-gray-500 block">
                        R$ {fb.cash_amount.toLocaleString('pt-BR')}
                      </span>
                    ) : null}
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-400 block">% Financiamento</span>
                    <span className="font-extrabold text-sm text-emerald-700">
                      {fb?.finance_percent ?? 0}%
                    </span>
                    {fb?.finance_bank && (
                      <span className="text-[9px] text-emerald-800 block truncate">
                        {fb.finance_bank}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-400 block">% FGTS</span>
                    <span className="font-extrabold text-sm text-blue-700">
                      {fb?.fgts_percent ?? 0}%
                    </span>
                    {fb?.fgts_amount ? (
                      <span className="text-[9px] text-gray-500 block">
                        R$ {fb.fgts_amount.toLocaleString('pt-BR')}
                      </span>
                    ) : null}
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-400 block">% Permuta</span>
                    <span className="font-extrabold text-sm text-purple-700">
                      {fb?.permuta_percent ?? 0}%
                    </span>
                  </div>
                </div>

                {/* Additional Notes about Finance */}
                {fb?.permuta_item_desc && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-950">
                    <span className="font-bold block text-[11px]">
                      Detalhes do Imóvel/Item de Permuta:
                    </span>
                    <p className="text-[11px] mt-0.5">{fb.permuta_item_desc}</p>
                  </div>
                )}

                {fb?.notes && (
                  <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-700">
                    <span className="font-bold block text-[11px] text-gray-500">
                      Parecer da Consultoria:
                    </span>
                    <p className="text-[11px] mt-0.5">{fb.notes}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 3: DOCUMENTOS COM HISTÓRICO VISÍVEL PARA VERA */}
            <TabsContent value="documentos" className="space-y-4 m-0">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-[#1A3636] uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-[#D4AF37]" />
                    Cofre de Documentos do Cliente
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Histórico de versões, datas de envio e observações para o cliente.
                  </p>
                </div>
                <Badge className="bg-[#1A3636] text-[#D4AF37] text-xs">
                  {uploadedDocsCount} de {totalRequiredDocs} itens
                </Badge>
              </div>

              {loadingDocs ? (
                <div className="p-4 text-center text-gray-400">Carregando documentos...</div>
              ) : clientDocuments.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center space-y-2">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-600 font-semibold">
                    Nenhum documento enviado pelo cliente ainda.
                  </p>
                  <p className="text-[11px] text-gray-400">
                    O cliente pode enviar direto pelo portal seguro em /portal.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-2.5 shadow-2xs hover:border-[#D4AF37]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-[#1A3636]">
                              {doc.type || doc.title}
                            </span>
                            {doc.version && doc.version > 1 && (
                              <Badge className="bg-[#1A3636] text-[#D4AF37] text-[9px] font-bold border-none">
                                v{doc.version} (Reenviado)
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 block truncate max-w-xs">
                            {doc.title}
                          </span>
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold ${
                            doc.status === 'verified'
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
                              : doc.status === 'rejected'
                                ? 'text-red-800 bg-red-50 border-red-300'
                                : 'text-amber-800 bg-amber-50 border-amber-300'
                          }`}
                        >
                          {doc.status === 'verified' && '✓ Aprovado'}
                          {doc.status === 'rejected' && '✕ Recusado'}
                          {doc.status === 'pending' && '⏳ Em Análise'}
                        </Badge>
                      </div>

                      {/* Timestamps */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#D4AF37]" />
                          Enviado {formatRelativeTime(doc.updated || doc.created)}
                        </span>
                        {doc.reviewed_at && (
                          <span className="text-emerald-800 font-medium">
                            Conferido em {new Date(doc.reviewed_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>

                      {/* Observação da Vera */}
                      {doc.notes && (
                        <div className="p-2 bg-amber-50/70 rounded-lg border border-amber-200/80 text-[11px] text-gray-700">
                          <strong className="text-[#1A3636] block text-[10px]">
                            Observação Registrada para o Cliente:
                          </strong>
                          <p className="italic mt-0.5">{doc.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        {doc.file ? (
                          <a
                            href={getDocumentDownloadUrl(doc)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A3636] hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" /> Abrir Arquivo
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-400">Sem anexo</span>
                        )}

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDocReviewModal(doc, 'rejected')}
                            className="h-7 text-[10px] text-red-700 border-red-200 hover:bg-red-50 px-2.5 font-semibold"
                          >
                            Recusar / Ajuste
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenDocReviewModal(doc, 'verified')}
                            className="h-7 text-[10px] bg-emerald-700 hover:bg-emerald-800 text-white px-3 font-bold"
                          >
                            Aprovar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 4: IMÓVEIS & PROPOSTAS */}
            <TabsContent value="imoveis" className="space-y-4 m-0">
              {/* Properties of Interest Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1A3636] uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#D4AF37]" /> Imóveis de Interesse / Visita
                  </span>
                  <span className="text-[10px] text-gray-400">Clique para abrir o imóvel</span>
                </div>

                {interestedProps.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-gray-400">
                    Nenhum imóvel vinculado a este cliente ainda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {interestedProps.map((prop) => (
                      <div
                        key={prop.id}
                        onClick={() => onPropertyClick(prop)}
                        className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#D4AF37] hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-[#1A3636] text-[#D4AF37] flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <h5 className="font-bold text-xs text-[#1A3636] group-hover:text-[#D4AF37] transition-colors truncate">
                              {prop.title}
                            </h5>
                            <p className="text-[11px] text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#D4AF37]" />
                              {prop.neighborhood} • {prop.area_sqm || '--'}m²
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="font-extrabold text-xs text-[#1A3636] block">
                            R$ {prop.price?.toLocaleString('pt-BR')}
                          </span>
                          <span className="text-[10px] text-[#D4AF37] font-semibold flex items-center justify-end gap-1 group-hover:underline">
                            Ver detalhes <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Proposals Section */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1A3636] uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-[#D4AF37]" /> Propostas Vinculadas
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onCreateProposalForClient(client)}
                    className="bg-[#1A3636] text-white hover:bg-[#254d4d] h-7 text-[11px] gap-1"
                  >
                    <FileCheck2 className="w-3 h-3 text-[#D4AF37]" /> Nova Proposta
                  </Button>
                </div>

                {loadingProposals ? (
                  <div className="p-4 text-center text-gray-400">Carregando propostas...</div>
                ) : proposals.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-gray-400">
                    Nenhuma proposta formal cadastrada para este lead.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proposals.map((prop) => (
                      <div
                        key={prop.id}
                        className="p-3 rounded-xl bg-white border border-gray-200 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#1A3636]">
                            Valor: R$ {prop.value?.toLocaleString('pt-BR')}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200"
                          >
                            {prop.status}
                          </Badge>
                        </div>
                        {prop.payment_terms && (
                          <p className="text-[11px] text-gray-600">{prop.payment_terms}</p>
                        )}
                        {prop.bank_partner && (
                          <p className="text-[10px] text-gray-500">
                            Banco: <strong>{prop.bank_partner}</strong>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Review Document Modal Inside Drawer */}
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="max-w-md bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#1A3636] flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#D4AF37]" />
                {reviewAction === 'verified'
                  ? 'Aprovar Documento do Cliente'
                  : 'Solicitar Ajuste / Reenvio de Documento'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Cliente: <strong>{client.name}</strong> • Documento:{' '}
                <strong>{reviewingDoc?.type}</strong> (v{reviewingDoc?.version || 1})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Decisão da Vera:</Label>
                <Select
                  value={reviewAction}
                  onValueChange={(val) => setReviewAction(val as DocumentStatus)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified" className="text-emerald-700 font-bold">
                      ✓ Aprovar Documento
                    </SelectItem>
                    <SelectItem value="rejected" className="text-red-700 font-bold">
                      ✕ Recusar / Solicitar Novo Arquivo
                    </SelectItem>
                    <SelectItem value="pending" className="text-amber-700 font-bold">
                      ⏳ Manter Em Análise
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#1A3636]">
                  Observação da Vera para o Cliente (visível no portal):
                </Label>
                <Textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ex: Documento aprovado com sucesso / Por favor envie foto com todas as bordas visíveis..."
                  className="text-xs"
                />
                <p className="text-[10px] text-gray-400">
                  Esta mensagem aparece com destaque no cofre e na timeline do cliente.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReviewModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSubmittingReview}
                onClick={handleConfirmDocReview}
                className={`text-white text-xs font-bold ${
                  reviewAction === 'verified'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-red-700 hover:bg-red-800'
                }`}
              >
                {isSubmittingReview ? 'Gravando...' : 'Confirmar Avaliação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Drawer Footer Actions */}
        <SheetFooter className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto text-xs"
          >
            Fechar Drawer
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => onCreateProposalForClient(client)}
              className="flex-1 sm:flex-initial bg-[#1A3636] text-white hover:bg-[#254d4d] text-xs gap-1.5 shadow-xs"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Emitir Proposta
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
