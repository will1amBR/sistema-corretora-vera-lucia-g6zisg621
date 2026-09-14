import React, { useState, useEffect } from 'react'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Trash2,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Info,
  X,
  History,
  RotateCw,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  ArrowRight,
  UserCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import type {
  ClientDocument,
  PurchaseModality,
  Client,
  Proposal,
  DocumentEvent,
  DocumentHistoryEntry,
} from '@/types'
import {
  deleteDocument,
  getDocumentDownloadUrl,
  createOrUpdateDocumentWithHistory,
  getDocumentEventsByClientId,
} from '@/services/documents'

export interface RequiredDocItem {
  type: string
  title: string
  category: 'pessoal' | 'renda' | 'residencia' | 'bancario' | 'imovel'
  description: string
  requiredFor: PurchaseModality[]
  sampleHelp?: string
}

export const CHECKLIST_BY_MODALITY: RequiredDocItem[] = [
  {
    type: 'RG / CNH',
    title: 'Documento de Identidade com Foto',
    category: 'pessoal',
    description:
      'RG ou CNH dentro do prazo de validade (frente e verso nítidos do comprador e cônjuge).',
    requiredFor: ['a_vista', 'financiamento', 'consorcio', 'permuta', 'fgts', 'misto'],
    sampleHelp: 'Pode ser a CNH Digital em PDF exportada pelo app do Governo.',
  },
  {
    type: 'CPF',
    title: 'Comprovante de Situação Cadastral CPF',
    category: 'pessoal',
    description:
      'Caso o número do CPF não conste no RG ou para certidão cadastral da Receita Federal.',
    requiredFor: ['a_vista', 'financiamento', 'consorcio', 'permuta', 'fgts', 'misto'],
  },
  {
    type: 'Certidão de Estado Civil',
    title: 'Certidão de Nascimento ou Casamento',
    category: 'pessoal',
    description: 'Certidão atualizada de nascimento, casamento ou pacto antenupcial registrado.',
    requiredFor: ['a_vista', 'financiamento', 'consorcio', 'permuta', 'fgts', 'misto'],
    sampleHelp: 'Indispensável para averbação no Cartório de Registro de Imóveis de Porto Alegre.',
  },
  {
    type: 'Comprovante de Residência',
    title: 'Comprovante de Residência Atual',
    category: 'residencia',
    description:
      'Conta de água, luz, gás ou internet emitida nos últimos 60 dias em nome do comprador.',
    requiredFor: ['a_vista', 'financiamento', 'consorcio', 'permuta', 'fgts', 'misto'],
  },
  {
    type: 'Comprovante de Renda',
    title: 'Comprovante de Rendimentos (3 últimos holerites)',
    category: 'renda',
    description: 'Últimos 3 contracheques / holerites ou pró-labore se empresário.',
    requiredFor: ['financiamento', 'fgts', 'misto'],
    sampleHelp: 'Para autônomos ou empresários: 6 últimos extratos bancários de conta corrente.',
  },
  {
    type: 'Declaração IRPF',
    title: 'Declaração de Imposto de Renda Completa + Recibo',
    category: 'renda',
    description:
      'Última declaração de IRPF entregue à Receita Federal com recibo oficial de envio.',
    requiredFor: ['financiamento', 'fgts', 'misto'],
  },
  {
    type: 'Extrato FGTS',
    title: 'Extrato Analítico do FGTS',
    category: 'bancario',
    description: 'Extrato analítico emitido pelo App da Caixa Econômica com saldo disponível.',
    requiredFor: ['fgts', 'misto'],
    sampleHelp: 'Necessário para abater da entrada e compor o saldo no contrato de financiamento.',
  },
  {
    type: 'Carta de Consórcio',
    title: 'Comprovante de Contemplação do Consórcio',
    category: 'bancario',
    description: 'Cópia da carta de crédito emitida pela administradora com status contemplado.',
    requiredFor: ['consorcio'],
  },
  {
    type: 'Matrícula do Imóvel Permuta',
    title: 'Matrícula Atualizada do Imóvel Oferecido na Troca',
    category: 'imovel',
    description:
      'Certidão de matrícula vintenária com negativa de ônus reais do imóvel da permuta.',
    requiredFor: ['permuta'],
  },
]

// Helper: format relative time in Portuguese ("Enviado há 2 dias", "Aprovado ontem")
export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Data não informada'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 2) return 'agora mesmo'
    if (diffMins < 60) return `há ${diffMins} min`
    if (diffHours === 1) return 'há 1 hora'
    if (diffHours < 24) return `há ${diffHours} horas`
    if (diffDays === 1) return 'ontem'
    if (diffDays < 7) return `há ${diffDays} dias`
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
    }
    return date.toLocaleDateString('pt-BR')
  } catch (_) {
    return dateString
  }
}

// Action label helper
export function getActionMeta(action: string): { label: string; color: string; icon: any } {
  switch (action) {
    case 'uploaded':
      return {
        label: 'Enviado',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        icon: UploadCloud,
      }
    case 'resubmitted':
      return {
        label: 'Reenviado (Nova Versão)',
        color: 'text-amber-800 bg-amber-50 border-amber-300',
        icon: RotateCw,
      }
    case 'approved':
      return {
        label: 'Aprovado pela Vera',
        color: 'text-emerald-800 bg-emerald-50 border-emerald-300',
        icon: CheckCircle2,
      }
    case 'rejected':
      return {
        label: 'Recusado / Ajuste Solicitado',
        color: 'text-red-800 bg-red-50 border-red-300',
        icon: AlertTriangle,
      }
    case 'commented':
      return {
        label: 'Observação da Corretora',
        color: 'text-gray-800 bg-gray-50 border-gray-300',
        icon: MessageSquare,
      }
    case 'deleted':
      return {
        label: 'Arquivo Excluído',
        color: 'text-gray-600 bg-gray-100 border-gray-200',
        icon: Trash2,
      }
    default:
      return {
        label: 'Movimentação',
        color: 'text-gray-700 bg-gray-50 border-gray-200',
        icon: Clock,
      }
  }
}

interface DocumentVaultProps {
  client: Client
  proposal?: Proposal | null
  documents: ClientDocument[]
  onDocumentsChange: () => void
  readOnly?: boolean
  brokerMode?: boolean
}

export function DocumentVault({
  client,
  proposal,
  documents,
  onDocumentsChange,
  readOnly = false,
  brokerMode = false,
}: DocumentVaultProps) {
  const { toast } = useToast()
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [dragOverType, setDragOverType] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<ClientDocument | null>(null)

  // Timeline / History Modal for a specific document
  const [historyDoc, setHistoryDoc] = useState<ClientDocument | null>(null)

  // Replace / Resubmit Dialog
  const [resubmitDoc, setResubmitDoc] = useState<{
    doc: ClientDocument
    reqDoc: RequiredDocItem
  } | null>(null)
  const [resubmitFile, setResubmitFile] = useState<File | null>(null)
  const [resubmitNote, setResubmitNote] = useState('')
  const [isResubmitting, setIsResubmitting] = useState(false)

  // Immediate Friendly Confirmation Dialog
  const [confirmationData, setConfirmationData] = useState<{
    docType: string
    isResubmit: boolean
    version: number
  } | null>(null)

  // Document Events Feed
  const [eventsFeed, setEventsFeed] = useState<DocumentEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [expandedDocHistories, setExpandedDocHistories] = useState<Record<string, boolean>>({})

  const activeModality: PurchaseModality = client.purchase_modality || 'financiamento'

  // Load document events feed
  const loadEventsFeed = async () => {
    if (!client?.id) return
    try {
      setLoadingEvents(true)
      const res = await getDocumentEventsByClientId(client.id, 30)
      setEventsFeed(res.items || [])
    } catch (err) {
      console.warn('Erro ao carregar feed de eventos:', err)
    } finally {
      setLoadingEvents(false)
    }
  }

  useEffect(() => {
    loadEventsFeed()
  }, [client?.id, documents.length])

  // Filter checklist for the active modality
  const relevantChecklist = CHECKLIST_BY_MODALITY.filter((item) =>
    item.requiredFor.includes(activeModality),
  )

  // Calculate completion percentage & stats
  const totalRequired = relevantChecklist.length
  const verifiedCount = relevantChecklist.filter((req) => {
    const doc = documents.find((d) => d.type === req.type)
    return doc && doc.status === 'verified'
  }).length
  const uploadedCount = relevantChecklist.filter((req) => {
    return documents.some((d) => d.type === req.type)
  }).length
  const rejectedCount = relevantChecklist.filter((req) => {
    const doc = documents.find((d) => d.type === req.type)
    return doc && doc.status === 'rejected'
  }).length
  const pendingCount = uploadedCount - verifiedCount - rejectedCount
  const remainingCount = Math.max(0, totalRequired - uploadedCount)

  const completionPercent =
    totalRequired > 0 ? Math.round((uploadedCount / totalRequired) * 100) : 0

  const toggleDocHistory = (docId: string) => {
    setExpandedDocHistories((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }))
  }

  // Handle direct file upload (v1)
  const handleUploadFile = async (file: File, docType: string) => {
    if (!file || !client) return
    setUploadingType(docType)
    try {
      const formData = new FormData()
      formData.append('client_id', client.id)
      if (proposal?.id) {
        formData.append('proposal_id', proposal.id)
      }
      formData.append('type', docType)
      formData.append('title', `${docType} - ${client.name}`)
      formData.append('file', file)

      await createOrUpdateDocumentWithHistory({
        formData,
        existingDoc: null,
        actorName: client.name,
        actorRole: 'client',
        note: `Primeiro envio de ${docType} pelo cofre seguro.`,
      })

      // Show immediate reassuring confirmation modal
      setConfirmationData({
        docType,
        isResubmit: false,
        version: 1,
      })

      toast({
        title: '✓ Documento recebido com segurança!',
        description: `O arquivo de ${docType} foi salvo no cofre criptografado. A Vera já foi notificada.`,
      })

      onDocumentsChange()
      loadEventsFeed()
    } catch (err: any) {
      toast({
        title: 'Falha no envio',
        description: err.message || 'Verifique o formato do arquivo e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUploadingType(null)
    }
  }

  // Handle Re-submitting a replacement document (v2, v3, etc.)
  const handleConfirmResubmit = async () => {
    if (!resubmitDoc || !resubmitFile || !client) return
    setIsResubmitting(true)
    try {
      const nextVersion = (resubmitDoc.doc.version || 1) + 1
      const formData = new FormData()
      formData.append('client_id', client.id)
      if (proposal?.id) {
        formData.append('proposal_id', proposal.id)
      }
      formData.append('type', resubmitDoc.doc.type)
      formData.append('title', `${resubmitDoc.doc.type} - ${client.name} (v${nextVersion})`)
      formData.append('file', resubmitFile)

      await createOrUpdateDocumentWithHistory({
        formData,
        existingDoc: resubmitDoc.doc,
        actorName: client.name,
        actorRole: 'client',
        note: resubmitNote.trim() || `Substituição por nova versão v${nextVersion}.`,
      })

      setResubmitDoc(null)
      setResubmitFile(null)
      setResubmitNote('')

      // Friendly confirmation
      setConfirmationData({
        docType: resubmitDoc.doc.type,
        isResubmit: true,
        version: nextVersion,
      })

      toast({
        title: `✓ Nova versão (v${nextVersion}) enviada com sucesso!`,
        description: 'Seu documento atualizado foi encaminhado para análise da Vera.',
      })

      onDocumentsChange()
      loadEventsFeed()
    } catch (err: any) {
      toast({
        title: 'Erro ao reenviar documento',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsResubmitting(false)
    }
  }

  const handleDelete = async (docId: string, docTitle: string) => {
    if (confirm(`Deseja realmente remover este arquivo (${docTitle})?`)) {
      try {
        await deleteDocument(docId)
        toast({ title: 'Documento removido do cofre' })
        onDocumentsChange()
        loadEventsFeed()
      } catch (err: any) {
        toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
      }
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, docType: string) => {
    e.preventDefault()
    setDragOverType(null)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const existing = documents.find((d) => d.type === docType)
      if (existing) {
        // Open resubmit modal
        const reqDoc = relevantChecklist.find((r) => r.type === docType) || {
          type: docType,
          title: docType,
          category: 'pessoal' as const,
          description: '',
          requiredFor: [activeModality],
        }
        setResubmitDoc({ doc: existing, reqDoc })
        setResubmitFile(files[0])
      } else {
        handleUploadFile(files[0], docType)
      }
    }
  }

  return (
    <Card className="card-elevated border-t-4 border-t-[#1A3636] overflow-hidden">
      {/* Header Banner */}
      <CardHeader className="p-5 sm:p-6 pb-4 bg-gradient-to-r from-gray-50 via-white to-amber-50/20 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#1A3636] text-[#D4AF37] shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-lg font-bold text-[#1A3636] flex items-center gap-2">
                  Cofre Digital de Documentos
                  <Badge className="bg-[#1A3636] text-[#D4AF37] text-[10px] font-bold border-none">
                    Auditoria Completa
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Modalidade ativa:{' '}
                  <strong className="text-[#1A3636] capitalize">
                    {activeModality.replace('_', ' ')}
                  </strong>
                  . Cada envio fica registrado com data, hora e histórico de análise da Vera.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-[#1A3636] text-[#D4AF37] text-xs font-bold px-3 py-1.5 border-none shadow-xs">
              {uploadedCount} de {totalRequired} enviados ({completionPercent}%)
            </Badge>
          </div>
        </div>

        {/* Progress & Stat Chips */}
        <div className="pt-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 font-semibold">
            <span className="text-gray-600">Progresso Geral do Checklist:</span>
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ {verifiedCount} aprovados
              </span>
              {pendingCount > 0 && (
                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ⏳ {pendingCount} em análise
                </span>
              )}
              {rejectedCount > 0 && (
                <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  ✕ {rejectedCount} requer ajuste
                </span>
              )}
              {remainingCount > 0 && (
                <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  Faltam {remainingCount} documentos
                </span>
              )}
            </div>
          </div>
          <Progress value={completionPercent} className="h-2.5 bg-gray-100" />
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Anti-Anxiety Assurance Banner */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-[#1A3636] text-xs">
                Seus Documentos Estão Seguros e Sob Sigilo
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed max-w-2xl">
                Você não precisa se preocupar: todos os envios são arquivados com controle de
                versão. Se algum documento precisar de complementação, a Vera Lúcia avisará
                detalhadamente a observação e você poderá reenviar sem recomeçar do zero.
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-white px-3 py-1.5 rounded-lg border border-emerald-200/70 text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Prazo de análise: até 1 dia útil</span>
          </div>
        </div>

        {/* FEED DE ÚLTIMAS MOVIMENTAÇÕES (Pedido Central) */}
        {eventsFeed.length > 0 && (
          <div className="bg-gradient-to-br from-gray-50/80 to-amber-50/20 rounded-xl p-4 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#1A3636]">
                  Feed de Movimentações Recentes ({eventsFeed.length})
                </h3>
              </div>
              <span className="text-[10px] text-gray-500 italic">Atualizado em tempo real</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {eventsFeed.slice(0, 5).map((ev) => {
                const meta = getActionMeta(ev.action)
                const IconComponent = meta.icon
                return (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-lg bg-white border border-gray-100 flex items-start justify-between gap-3 shadow-2xs hover:border-[#D4AF37]/50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-md border shrink-0 mt-0.5 ${meta.color}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#1A3636] truncate">
                            {ev.document_type}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-semibold ${meta.color}`}
                          >
                            {meta.label}
                            {ev.version && ev.version > 1 ? ` (v${ev.version})` : ''}
                          </Badge>
                        </div>
                        {ev.note && (
                          <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 leading-snug">
                            "{ev.note}"
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Por <strong>{ev.actor_name || 'Vera Lúcia'}</strong>
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-[10px] font-medium text-gray-500 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded">
                      {formatRelativeTime(ev.created)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CHECKLIST GRID COM HISTÓRICO INDIVIDUALIZADO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#1A3636] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#D4AF37]" />
              Checklist Obrigatório por Modalidade
            </h3>
            <span className="text-[11px] text-gray-500">
              {uploadedCount} de {totalRequired} enviados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relevantChecklist.map((reqDoc, idx) => {
              const uploaded = documents.find((d) => d.type === reqDoc.type)
              const isUploadingThis = uploadingType === reqDoc.type
              const isDragOver = dragOverType === reqDoc.type

              // Parse history entries if present
              const docHistory: DocumentHistoryEntry[] =
                uploaded && Array.isArray(uploaded.history) ? uploaded.history : []
              const hasHistory = docHistory.length > 0
              const isExpanded = uploaded ? !!expandedDocHistories[uploaded.id] : false
              const currentVersion = uploaded?.version || (uploaded ? 1 : 0)

              return (
                <div
                  key={idx}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverType(reqDoc.type)
                  }}
                  onDragLeave={() => setDragOverType(null)}
                  onDrop={(e) => handleDrop(e, reqDoc.type)}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    uploaded
                      ? uploaded.status === 'verified'
                        ? 'bg-emerald-50/25 border-emerald-300 shadow-2xs'
                        : uploaded.status === 'rejected'
                          ? 'bg-red-50/30 border-red-300 shadow-2xs'
                          : 'bg-amber-50/25 border-amber-300 shadow-2xs'
                      : isDragOver
                        ? 'bg-amber-50 border-2 border-[#D4AF37] scale-[1.01]'
                        : 'bg-gray-50/60 border-dashed border-gray-300 hover:border-[#D4AF37]'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header Row: Title & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs sm:text-sm text-[#1A3636] flex items-center gap-1.5 leading-snug">
                          <FileText className="w-4 h-4 text-[#D4AF37] shrink-0" />
                          {reqDoc.type}
                        </h4>
                        <span className="text-[10px] text-gray-500 font-medium block">
                          {reqDoc.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {uploaded && currentVersion > 1 && (
                          <Badge className="text-[9px] bg-[#1A3636] text-[#D4AF37] border-none font-bold">
                            v{currentVersion} (Reenviado)
                          </Badge>
                        )}

                        {uploaded ? (
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              uploaded.status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : uploaded.status === 'rejected'
                                  ? 'bg-red-100 text-red-800 border-red-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {uploaded.status === 'verified' && '✓ Aprovado'}
                            {uploaded.status === 'rejected' && '✕ Recusado'}
                            {uploaded.status === 'pending' && '⏳ Em Análise'}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-gray-200 text-gray-700 font-semibold"
                          >
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 leading-snug">{reqDoc.description}</p>

                    {reqDoc.sampleHelp && (
                      <p className="text-[11px] text-[#1A3636]/80 italic flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" /> {reqDoc.sampleHelp}
                      </p>
                    )}

                    {/* Metadata & "Enviado há X dias" */}
                    {uploaded && (
                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#D4AF37]" />
                          Enviado {formatRelativeTime(uploaded.updated || uploaded.created)}
                        </span>
                        {uploaded.reviewed_at && (
                          <span className="text-[10px] text-emerald-800 font-medium">
                            Conferido em{' '}
                            {new Date(uploaded.reviewed_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Observação da Vera com destaque */}
                    {uploaded?.notes && (
                      <div
                        className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                          uploaded.status === 'rejected'
                            ? 'bg-red-50 text-red-950 border-red-200'
                            : uploaded.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                              : 'bg-amber-50 text-amber-950 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-bold">
                          <UserCheck className="w-3.5 h-3.5 text-[#1A3636]" />
                          <span>Observação da Vera Lúcia:</span>
                        </div>
                        <p className="leading-relaxed">{uploaded.notes}</p>
                      </div>
                    )}

                    {/* Collapsible Mini History Timeline per Document */}
                    {uploaded && hasHistory && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleDocHistory(uploaded.id)}
                          className="text-[11px] font-bold text-[#1A3636] hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                        >
                          <History className="w-3 h-3 text-[#D4AF37]" />
                          <span>
                            {isExpanded
                              ? 'Ocultar histórico'
                              : `Ver histórico (${docHistory.length} eventos)`}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 pl-3 border-l-2 border-[#D4AF37]/50 space-y-2 text-[11px] py-1 animate-fade-in">
                            {docHistory.map((item, hIdx) => {
                              const meta = getActionMeta(item.action)
                              return (
                                <div key={hIdx} className="space-y-0.5">
                                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                                    <span className="font-bold text-gray-700">
                                      {item.actor_name || 'Usuário'} • {meta.label}
                                      {item.version ? ` (v${item.version})` : ''}
                                    </span>
                                    <span>{formatRelativeTime(item.date)}</span>
                                  </div>
                                  {item.note && (
                                    <p className="text-gray-600 italic bg-white/70 p-1.5 rounded border border-gray-100">
                                      "{item.note}"
                                    </p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Upload or View Action Row */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    {uploaded ? (
                      <div className="flex items-center justify-between w-full flex-wrap gap-2">
                        <span className="text-[11px] text-gray-500 truncate max-w-[150px]">
                          {uploaded.title}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {uploaded.file && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewDoc(uploaded)}
                              className="h-7 text-xs text-[#1A3636] border-gray-300 gap-1 px-2 hover:border-[#D4AF37]"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#D4AF37]" /> Ver
                            </Button>
                          )}

                          {!readOnly && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setResubmitDoc({ doc: uploaded, reqDoc })
                                setResubmitFile(null)
                                setResubmitNote('')
                              }}
                              className="h-7 text-xs text-[#1A3636] border-gray-300 gap-1 px-2 hover:bg-amber-50"
                              title="Reenviar nova versão substituindo a atual"
                            >
                              <RotateCw className="w-3 h-3 text-[#D4AF37]" /> Substituir
                            </Button>
                          )}

                          {!readOnly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(uploaded.id, uploaded.title)}
                              className="h-7 text-xs text-gray-400 hover:text-red-600 p-1"
                              title="Remover documento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : !readOnly ? (
                      <div className="w-full">
                        <label className="cursor-pointer flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-[#1A3636] text-[#1A3636] px-3 py-2.5 rounded-lg text-xs font-semibold shadow-2xs hover:shadow-xs transition-all">
                          <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
                          <span>
                            {isUploadingThis
                              ? 'Enviando arquivo...'
                              : isDragOver
                                ? 'Solte o arquivo aqui'
                                : 'Tirar Foto ou Anexar PDF'}
                          </span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={isUploadingThis}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUploadFile(file, reqDoc.type)
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">
                        Documento não enviado
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>

      {/* MODAL 1: Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1A3636] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#D4AF37]" /> {previewDoc?.type || 'Documento'}
            </DialogTitle>
          </DialogHeader>

          {previewDoc && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                <div>
                  <strong>Arquivo:</strong> {previewDoc.title}
                </div>
                <div>
                  <strong>Versão Atual:</strong> v{previewDoc.version || 1}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className="capitalize font-bold text-[#1A3636]">{previewDoc.status}</span>
                </div>
                {previewDoc.notes && (
                  <div>
                    <strong>Observações da Vera:</strong> {previewDoc.notes}
                  </div>
                )}
              </div>

              {previewDoc.file ? (
                <div className="border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[220px]">
                  {previewDoc.file.toLowerCase().endsWith('.pdf') ? (
                    <div className="p-6 text-center space-y-3">
                      <FileText className="w-12 h-12 text-[#1A3636] mx-auto" />
                      <p className="text-xs text-gray-600">Arquivo em formato PDF</p>
                      <a
                        href={getDocumentDownloadUrl(previewDoc)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#1A3636] text-white px-4 py-2 rounded-lg text-xs font-semibold"
                      >
                        <Download className="w-4 h-4 text-[#D4AF37]" /> Baixar / Abrir PDF
                      </a>
                    </div>
                  ) : (
                    <img
                      src={getDocumentDownloadUrl(previewDoc)}
                      alt={previewDoc.title}
                      className="max-h-[350px] w-auto object-contain mx-auto"
                    />
                  )}
                </div>
              ) : null}

              <div className="flex justify-between items-center pt-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewDoc(null)}>
                  Fechar
                </Button>
                {previewDoc.file && (
                  <a
                    href={getDocumentDownloadUrl(previewDoc)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A3636] hover:underline"
                  >
                    <Download className="w-4 h-4 text-[#D4AF37]" /> Abrir no Navegador
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Resubmit / Replace Document Dialog */}
      <Dialog open={!!resubmitDoc} onOpenChange={(open) => !open && setResubmitDoc(null)}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1A3636] flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-[#D4AF37]" />
              Reenviar {resubmitDoc?.doc.type} (v{(resubmitDoc?.doc.version || 1) + 1})
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              O arquivo anterior será preservado no histórico de versões para fins de auditoria.
            </DialogDescription>
          </DialogHeader>

          {resubmitDoc && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-gray-700 space-y-1">
                <span className="font-bold text-[#1A3636] block">
                  Documento Atual: v{resubmitDoc.doc.version || 1} • {resubmitDoc.doc.status}
                </span>
                {resubmitDoc.doc.notes && (
                  <p className="text-[11px] text-gray-600 italic">
                    Último recado da Vera: "{resubmitDoc.doc.notes}"
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">
                  Novo Arquivo (PDF ou Foto nítida):
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setResubmitFile(e.target.files?.[0] || null)}
                  className="text-xs border rounded-lg p-2 w-full bg-gray-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">
                  Mensagem para a Vera (opcional):
                </label>
                <Textarea
                  rows={2}
                  value={resubmitNote}
                  onChange={(e) => setResubmitNote(e.target.value)}
                  placeholder="Ex: Segue o contracheque de agosto conforme solicitado."
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResubmitDoc(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!resubmitFile || isResubmitting}
                  onClick={handleConfirmResubmit}
                  className="bg-[#1A3636] hover:bg-[#254d4d] text-white font-bold text-xs gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {isResubmitting ? 'Enviando...' : 'Confirmar Reenvio'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Reassuring Confirmation Modal After Upload (Diminui Ansiedade) */}
      <Dialog open={!!confirmationData} onOpenChange={(open) => !open && setConfirmationData(null)}>
        <DialogContent className="max-w-md p-6 bg-white border-2 border-emerald-500 text-center animate-scale-up">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A3636] text-center">
              Recebemos seu documento!
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 text-center mt-1">
              <strong>{confirmationData?.docType}</strong> salvo com sucesso no cofre seguro.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-950 text-left space-y-2 mt-2">
            <div className="flex items-center gap-2 font-bold text-[#1A3636]">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>O que acontece agora?</span>
            </div>
            <p className="leading-relaxed text-[11px] text-gray-700">
              A corretora <strong>Vera Lúcia Koren</strong> vai analisar o arquivo em até{' '}
              <strong>1 dia útil</strong>. Assim que for verificado ou caso haja alguma dúvida de
              legibilidade, o status será atualizado aqui no seu portal.
            </p>
          </div>

          <div className="pt-3 flex justify-center">
            <Button
              onClick={() => setConfirmationData(null)}
              className="bg-[#1A3636] hover:bg-[#254d4d] text-white text-xs font-bold px-6"
            >
              Entendido, continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
