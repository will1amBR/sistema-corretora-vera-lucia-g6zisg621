import React, { useEffect, useState } from 'react'
import {
  FileCheck2,
  FileText,
  Building2,
  Users,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { getProposals, updateProposalStatus, deleteProposal } from '@/services/proposals'
import { getDocuments, updateDocumentStatus, getDocumentDownloadUrl } from '@/services/documents'
import { Skeleton } from '@/components/ui/skeleton'
import type { Proposal, ClientDocument, ProposalStatus, DocumentStatus } from '@/types'

const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, { label: string; color: string }> = {
  drafted: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Enviada ao Cliente', color: 'bg-blue-100 text-blue-700' },
  docs_pending: { label: 'Aguardando Documentos', color: 'bg-amber-100 text-amber-800' },
  under_review: { label: 'Documentos em Análise', color: 'bg-indigo-100 text-indigo-700' },
  accepted: { label: 'Proposta Aceita', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Recusada', color: 'bg-red-100 text-red-700' },
}

export default function ProposalsManager() {
  const { toast } = useToast()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)

  // Status Change Dialog
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [newStatus, setNewStatus] = useState<ProposalStatus>('docs_pending')
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [pData, dData] = await Promise.all([getProposals(), getDocuments()])
      setProposals(pData)
      setDocuments(dData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenStatusModal = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setNewStatus(proposal.status)
    setIsStatusModalOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedProposal) return
    try {
      await updateProposalStatus(selectedProposal.id, newStatus)
      toast({ title: 'Status da proposta atualizado!' })
      setIsStatusModalOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' })
    }
  }

  const handleDeleteProposal = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta proposta?')) {
      try {
        await deleteProposal(id)
        toast({ title: 'Proposta excluída' })
        loadData()
      } catch (err: any) {
        toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
      }
    }
  }

  const handleVerifyDoc = async (docId: string, status: DocumentStatus) => {
    try {
      await updateDocumentStatus(docId, status)
      toast({
        title: status === 'verified' ? 'Documento Aprovado!' : 'Documento Reprovado',
      })
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar documento',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl card-elevated">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3636] flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-[#D4AF37]" /> Gestão de Propostas & Documentação
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Controle de propostas comerciais emitidas, termos de pagamento e cofre de documentos
            enviados pelos clientes.
          </p>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#1A3636]">Propostas Ativas ({proposals.length})</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-3"
              >
                <Skeleton className="h-5 w-40 bg-gray-200" />
                <Skeleton className="h-4 w-32 bg-gray-100" />
                <Skeleton className="h-20 w-full rounded-lg bg-gray-50" />
                <Skeleton className="h-10 w-full rounded-lg bg-gray-50" />
              </div>
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <Card className="card-elevated text-center py-12 text-gray-400">
            <CardContent>
              Nenhuma proposta emitida ainda. Crie propostas a partir da aba CRM.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proposals.map((prop) => {
              const statusCfg = PROPOSAL_STATUS_LABELS[prop.status] || {
                label: prop.status,
                color: 'bg-gray-100',
              }
              const client = prop.expand?.client_id
              const property = prop.expand?.property_id
              const propDocs = documents.filter(
                (d) => d.proposal_id === prop.id || d.client_id === prop.client_id,
              )

              return (
                <Card
                  key={prop.id}
                  className="card-elevated border-l-4 border-l-[#1A3636] flex flex-col justify-between"
                >
                  <div>
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base font-bold text-[#1A3636]">
                            {client?.name || 'Cliente'}
                          </CardTitle>
                          <CardDescription className="text-xs text-[#D4AF37] font-semibold flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3.5 h-3.5" /> {property?.title || 'Imóvel'}
                          </CardDescription>
                        </div>

                        <Badge className={`text-[10px] font-bold ${statusCfg.color} border-none`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-3 text-xs">
                      {/* Financial Values */}
                      <div className="p-3 bg-gray-50 rounded-lg border space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Valor da Proposta:</span>
                          <span className="font-bold text-sm text-[#1A3636]">
                            R$ {prop.value?.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        {prop.down_payment ? (
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Entrada / Sinal:</span>
                            <span className="font-semibold">
                              R$ {prop.down_payment.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        ) : null}
                        {prop.financing_value ? (
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Financiamento ({prop.bank_partner || 'Banco'}):</span>
                            <span className="font-semibold">
                              R$ {prop.financing_value.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {prop.payment_terms && (
                        <div>
                          <span className="font-semibold text-gray-700">
                            Condições de Pagamento:
                          </span>
                          <p className="text-gray-600 italic mt-0.5">{prop.payment_terms}</p>
                        </div>
                      )}

                      {/* Attached Documents */}
                      <div className="pt-2 border-t border-gray-100">
                        <span className="font-semibold text-gray-700 flex items-center gap-1 mb-2">
                          <FileText className="w-3.5 h-3.5 text-[#D4AF37]" /> Documentos Enviados (
                          {propDocs.length}):
                        </span>

                        {propDocs.length === 0 ? (
                          <p className="text-[11px] text-gray-400 italic">
                            Nenhum documento anexado pelo cliente ainda.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {propDocs.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-2 rounded bg-white border border-gray-200"
                              >
                                <div>
                                  <span className="font-medium text-[#1A3636] block">
                                    {doc.type || doc.title}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] ${
                                      doc.status === 'verified'
                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                                        : doc.status === 'rejected'
                                          ? 'text-red-700 bg-red-50 border-red-300'
                                          : 'text-amber-700 bg-amber-50 border-amber-300'
                                    }`}
                                  >
                                    {doc.status === 'verified' && 'Aprovado'}
                                    {doc.status === 'rejected' && 'Reprovado'}
                                    {doc.status === 'pending' && 'Pendente'}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-1">
                                  {doc.file && (
                                    <a
                                      href={getDocumentDownloadUrl(doc)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-gray-600 hover:text-[#1A3636]"
                                      title="Visualizar documento"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleVerifyDoc(doc.id, 'verified')}
                                    className="h-6 text-[10px] text-emerald-700 hover:bg-emerald-50 px-1.5"
                                  >
                                    Aprovar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProposal(prop.id)}
                      className="text-xs text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleOpenStatusModal(prop)}
                      className="bg-[#1A3636] text-white hover:bg-[#254d4d] text-xs"
                    >
                      Alterar Status
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Change Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1A3636]">
              Atualizar Status da Proposta
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Select value={newStatus} onValueChange={(val) => setNewStatus(val as ProposalStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROPOSAL_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateStatus}
              className="bg-[#1A3636] text-white hover:bg-[#254d4d]"
            >
              Salvar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
