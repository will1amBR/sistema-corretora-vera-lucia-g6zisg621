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
  Sparkles,
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
import {
  getProposals,
  updateProposalStatus,
  deleteProposal,
  sendCounterProposal,
} from '@/services/proposals'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getDocuments, updateDocumentStatus, getDocumentDownloadUrl } from '@/services/documents'
import { Skeleton } from '@/components/ui/skeleton'
import type { Proposal, ClientDocument, ProposalStatus, DocumentStatus } from '@/types'

const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, { label: string; color: string }> = {
  drafted: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Enviada ao Cliente', color: 'bg-blue-100 text-blue-700' },
  docs_pending: { label: 'Aguardando Documentos', color: 'bg-amber-100 text-amber-800' },
  under_review: { label: 'Documentos em Análise', color: 'bg-indigo-100 text-indigo-700' },
  counter_sent: {
    label: 'Contraproposta Enviada',
    color: 'bg-[#D4AF37]/20 text-[#1A3636] font-bold border border-[#D4AF37]/50',
  },
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

  // Counter Proposal Modal
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false)
  const [counterProp, setCounterProp] = useState<Proposal | null>(null)
  const [counterValue, setCounterValue] = useState<number>(0)
  const [counterDown, setCounterDown] = useState<number>(0)
  const [counterFinance, setCounterFinance] = useState<number>(0)
  const [counterBank, setCounterBank] = useState<string>('')
  const [counterTerms, setCounterTerms] = useState<string>('')
  const [counterConditions, setCounterConditions] = useState<string>('')
  const [counterValidUntil, setCounterValidUntil] = useState<string>('')
  const [counterNotes, setCounterNotes] = useState<string>('')
  const [isSendingCounter, setIsSendingCounter] = useState(false)

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

  const handleOpenCounterModal = (proposal: Proposal) => {
    setCounterProp(proposal)
    const originalVal = proposal.value || 0
    // Pre-fill with reasonable counteroffer values
    setCounterValue(originalVal)
    setCounterDown(proposal.down_payment || Math.round(originalVal * 0.2))
    setCounterFinance(proposal.financing_value || Math.round(originalVal * 0.8))
    setCounterBank(proposal.bank_partner || 'Itaú Unibanco')
    setCounterTerms(
      proposal.payment_terms ||
        'Entrada de 20% no ato do compromisso + saldo via financiamento bancário.',
    )
    setCounterConditions(
      proposal.conditions || 'Manutenção dos móveis planejados e luminárias fixas.',
    )
    // Default 5 days validity
    const d = new Date()
    d.setDate(d.getDate() + 5)
    setCounterValidUntil(d.toISOString().split('T')[0])
    setCounterNotes('')
    setIsCounterModalOpen(true)
  }

  const handleSendCounter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!counterProp) return
    if (counterValue <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor para a contraproposta.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSendingCounter(true)
      await sendCounterProposal(counterProp.id, {
        value: counterValue,
        down_payment: counterDown,
        financing_value: counterFinance,
        bank_partner: counterBank,
        payment_terms: counterTerms,
        conditions: counterConditions,
        valid_until: counterValidUntil,
        notes: counterNotes,
      })

      toast({
        title: 'Contraproposta enviada com sucesso!',
        description:
          'O cliente agora vê a contraproposta destacada no portal e pode aceitar ou negociar.',
      })
      setIsCounterModalOpen(false)
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar contraproposta',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSendingCounter(false)
    }
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

                      {/* Display active counteroffer if present */}
                      {prop.counter_offer && (
                        <div className="p-3 bg-amber-50/70 border border-[#D4AF37]/50 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#1A3636] uppercase tracking-wide flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Contraproposta da
                              Vera
                            </span>
                            {prop.status === 'counter_sent' && (
                              <Badge className="bg-[#D4AF37] text-[#1A3636] text-[9px] font-bold">
                                Aguardando Cliente
                              </Badge>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600">Valor Contraproposto:</span>
                            <span className="font-bold text-sm text-[#1A3636]">
                              R$ {prop.counter_offer.value?.toLocaleString('pt-BR')}
                            </span>
                          </div>
                          {prop.counter_offer.valid_until && (
                            <p className="text-[10px] text-gray-500">
                              Validade até:{' '}
                              <strong>
                                {new Date(
                                  prop.counter_offer.valid_until + 'T23:59:59',
                                ).toLocaleDateString('pt-BR')}
                              </strong>
                            </p>
                          )}
                          {prop.counter_offer.notes && (
                            <p className="text-[11px] text-gray-700 italic border-t border-amber-200/50 pt-1 mt-1">
                              "{prop.counter_offer.notes}"
                            </p>
                          )}
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
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProposal(prop.id)}
                      className="text-xs text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCounterModal(prop)}
                        className="border-[#D4AF37] text-[#1A3636] hover:bg-[#D4AF37]/10 text-xs font-semibold gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Contraproposta</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleOpenStatusModal(prop)}
                        className="bg-[#1A3636] text-white hover:bg-[#254d4d] text-xs"
                      >
                        Alterar Status
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Counter Proposal Modal */}
      <Dialog open={isCounterModalOpen} onOpenChange={setIsCounterModalOpen}>
        <DialogContent className="max-w-lg p-6 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1A3636] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              Enviar Contraproposta ao Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {counterProp?.expand?.client_id?.name} • {counterProp?.expand?.property_id?.title}
              <br />
              Proposta original do cliente: R${' '}
              <strong>{counterProp?.value?.toLocaleString('pt-BR')}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendCounter} className="space-y-4 py-2 text-xs">
            {/* New Offered Value */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1A3636]">
                Novo Valor da Contraproposta (R$)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">R$</span>
                <Input
                  type="number"
                  value={counterValue || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0
                    setCounterValue(val)
                    const down = Math.round(val * 0.2)
                    setCounterDown(down)
                    setCounterFinance(Math.max(0, val - down))
                  }}
                  className="pl-9 font-bold text-sm text-[#1A3636]"
                  required
                />
              </div>
            </div>

            {/* Down Payment & Financing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-700 font-semibold">
                  Entrada Sugerida (R$)
                </Label>
                <Input
                  type="number"
                  value={counterDown || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0
                    setCounterDown(val)
                    setCounterFinance(Math.max(0, counterValue - val))
                  }}
                  className="text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-gray-700 font-semibold">
                  Saldo Financiado (R$)
                </Label>
                <Input
                  type="number"
                  value={counterFinance || ''}
                  onChange={(e) => setCounterFinance(Number(e.target.value) || 0)}
                  className="text-xs font-semibold"
                />
              </div>
            </div>

            {/* Bank partner & validity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-700 font-semibold">
                  Banco / Financiador
                </Label>
                <Input
                  type="text"
                  value={counterBank}
                  onChange={(e) => setCounterBank(e.target.value)}
                  className="text-xs"
                  placeholder="Ex: Itaú Unibanco / Caixa"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-gray-700 font-semibold">Prazo de Validade</Label>
                <Input
                  type="date"
                  value={counterValidUntil}
                  onChange={(e) => setCounterValidUntil(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-1">
              <Label className="text-[11px] text-gray-700 font-semibold">
                Forma de Pagamento e Prazos
              </Label>
              <Textarea
                rows={2}
                value={counterTerms}
                onChange={(e) => setCounterTerms(e.target.value)}
                className="text-xs leading-relaxed"
                placeholder="Ex: 20% no compromisso de compra e venda + saldo via repasse bancário em até 45 dias."
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-gray-700 font-semibold">
                Condições Adicionais / Benfeitorias
              </Label>
              <Textarea
                rows={2}
                value={counterConditions}
                onChange={(e) => setCounterConditions(e.target.value)}
                className="text-xs leading-relaxed"
                placeholder="Ex: Inclusos ar-condicionados split e armários planejados da suíte."
              />
            </div>

            {/* Recado da Vera para o cliente */}
            <div className="space-y-1">
              <Label className="text-[11px] text-[#1A3636] font-bold">
                Mensagem Pessoal da Vera ao Cliente (Aparecerá com destaque no Portal)
              </Label>
              <Textarea
                rows={2}
                value={counterNotes}
                onChange={(e) => setCounterNotes(e.target.value)}
                className="text-xs leading-relaxed border-amber-300 bg-amber-50/40"
                placeholder="Ex: Prezado Rodrigo, conversamos com o proprietário e conseguimos chegar neste ponto de equilíbrio que atende ambas as partes."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCounterModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSendingCounter}
                className="bg-[#1A3636] hover:bg-[#254d4d] text-white font-bold text-xs gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                {isSendingCounter ? 'Enviando...' : 'Enviar Contraproposta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
