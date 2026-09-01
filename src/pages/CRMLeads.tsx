import React, { useEffect, useState } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Building2,
  DollarSign,
  FileCheck2,
  ChevronRight,
  Sparkles,
  Percent,
  Trash2,
  Edit,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getClients, createClient, updateClient, deleteClient } from '@/services/clients'
import { getProperties } from '@/services/properties'
import { createProposal } from '@/services/proposals'
import { Skeleton } from '@/components/ui/skeleton'
import type { Client, Property, ClientStatus, PurchaseModality, FinancialBreakdown } from '@/types'

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: 'lead', label: 'Novo Lead' },
  { value: 'contact', label: 'Contato Realizado' },
  { value: 'visit', label: 'Visita Agendada' },
  { value: 'proposal', label: 'Proposta / Em Análise' },
  { value: 'closing', label: 'Fechamento / Vendido' },
  { value: 'lost', label: 'Perdido / Desistiu' },
]

const MODALITY_OPTIONS: { value: PurchaseModality; label: string }[] = [
  { value: 'a_vista', label: '100% À Vista' },
  { value: 'financiamento', label: 'Financiamento Bancário' },
  { value: 'consorcio', label: 'Carta de Consórcio' },
  { value: 'permuta', label: 'Permuta de Imóvel / Veículo' },
  { value: 'fgts', label: 'Recursos FGTS' },
  { value: 'misto', label: 'Composição Mista (ex: 20% À Vista + 80% Financiamento)' },
]

export default function CRMLeads() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [activeClientForProposal, setActiveClientForProposal] = useState<Client | null>(null)

  // Form states for Client
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'lead' as ClientStatus,
    purchase_modality: 'misto' as PurchaseModality,
    objectives: '',
    objections_notes: '',
    cash_percent: 20,
    cash_amount: 0,
    finance_percent: 80,
    finance_bank: 'Itaú',
    fgts_percent: 0,
    permuta_percent: 0,
    notes: '',
  })

  // Form states for Quick Proposal
  const [proposalData, setProposalData] = useState({
    property_id: '',
    value: 0,
    down_payment: 0,
    financing_value: 0,
    bank_partner: 'Itaú Private',
    payment_terms: '',
    conditions: '',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [clientsData, propertiesData] = await Promise.all([getClients(), getProperties()])
      setClients(clientsData)
      setProperties(propertiesData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingClient(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: 'lead',
      purchase_modality: 'misto',
      objectives: '',
      objections_notes: '',
      cash_percent: 20,
      cash_amount: 0,
      finance_percent: 80,
      finance_bank: 'Itaú',
      fgts_percent: 0,
      permuta_percent: 0,
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client)
    const fb = client.financial_breakdown || {}
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      status: client.status || 'lead',
      purchase_modality: client.purchase_modality || 'misto',
      objectives: client.objectives || '',
      objections_notes: client.objections_notes || '',
      cash_percent: fb.cash_percent ?? 20,
      cash_amount: fb.cash_amount ?? 0,
      finance_percent: fb.finance_percent ?? 80,
      finance_bank: fb.finance_bank ?? 'Itaú',
      fgts_percent: fb.fgts_percent ?? 0,
      permuta_percent: fb.permuta_percent ?? 0,
      notes: client.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast({
        title: 'Atenção',
        description: 'O nome do cliente é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    const payload: Partial<Client> = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      purchase_modality: formData.purchase_modality,
      objectives: formData.objectives,
      objections_notes: formData.objections_notes,
      notes: formData.notes,
      financial_breakdown: {
        cash_percent: Number(formData.cash_percent),
        cash_amount: Number(formData.cash_amount),
        finance_percent: Number(formData.finance_percent),
        finance_bank: formData.finance_bank,
        fgts_percent: Number(formData.fgts_percent),
        permuta_percent: Number(formData.permuta_percent),
      },
    }

    try {
      if (editingClient) {
        await updateClient(editingClient.id, payload)
        toast({ title: 'Cliente atualizado com sucesso!' })
      } else {
        await createClient(payload)
        toast({ title: 'Lead cadastrado com sucesso no CRM!' })
      }
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar cliente', description: err.message, variant: 'destructive' })
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este cliente?')) {
      try {
        await deleteClient(id)
        toast({ title: 'Cliente removido' })
        loadData()
      } catch (err: any) {
        toast({ title: 'Erro ao remover', description: err.message, variant: 'destructive' })
      }
    }
  }

  const handleOpenProposalForClient = (client: Client) => {
    setActiveClientForProposal(client)
    setProposalData({
      property_id: properties[0]?.id || '',
      value: properties[0]?.price || 0,
      down_payment: (properties[0]?.price || 0) * 0.2,
      financing_value: (properties[0]?.price || 0) * 0.8,
      bank_partner: client.financial_breakdown?.finance_bank || 'Itaú Private',
      payment_terms: `${client.financial_breakdown?.cash_percent || 20}% de entrada no ato + financiamento bancário do saldo remanescente.`,
      conditions: 'Imóvel entregue livre de quaisquer ônus, com documentação 100% regularizada.',
    })
    setIsProposalModalOpen(true)
  }

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeClientForProposal || !proposalData.property_id) {
      toast({ title: 'Selecione um imóvel válido', variant: 'destructive' })
      return
    }

    try {
      await createProposal({
        client_id: activeClientForProposal.id,
        property_id: proposalData.property_id,
        value: Number(proposalData.value),
        down_payment: Number(proposalData.down_payment),
        financing_value: Number(proposalData.financing_value),
        bank_partner: proposalData.bank_partner,
        payment_terms: proposalData.payment_terms,
        conditions: proposalData.conditions,
        status: 'docs_pending',
      })

      toast({
        title: 'Proposta Estruturada & E-mail Enviado!',
        description: 'O cliente recebeu o link seguro da área do cliente para envio de documentos.',
      })
      setIsProposalModalOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao criar proposta', description: err.message, variant: 'destructive' })
    }
  }

  const filteredClients = clients.filter((c) => {
    const matchSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.objectives?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = selectedStatus === 'all' || c.status === selectedStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl card-elevated">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3636] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#D4AF37]" /> CRM de Clientes & Modalidades de Compra
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie o funil de vendas, objetivos, objeções, percentuais de compra (à vista,
            permuta, FGTS) e emita propostas.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="bg-[#1A3636] text-white hover:bg-[#254d4d] gap-2"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          Cadastrar Novo Lead
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl card-elevated">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Buscar por nome, telefone, e-mail ou objetivos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50/50"
          />
        </div>

        <div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estágio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estágios ({clients.length})</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clients List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4"
              >
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32 bg-gray-200" />
                  <Skeleton className="h-4 w-16 bg-gray-100" />
                </div>
                <Skeleton className="h-12 w-full rounded-lg bg-gray-50" />
                <Skeleton className="h-16 w-full rounded-lg bg-gray-50" />
                <div className="flex justify-between pt-2 border-t">
                  <Skeleton className="h-8 w-16 bg-gray-100" />
                  <Skeleton className="h-8 w-24 bg-gray-200" />
                </div>
              </div>
            ))}
          </>
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl card-elevated">
            Nenhum cliente encontrado com os filtros selecionados.
          </div>
        ) : (
          filteredClients.map((client) => {
            const fb = client.financial_breakdown
            return (
              <Card
                key={client.id}
                className="card-elevated hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-bold text-[#1A3636]">
                          {client.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500 mt-0.5">
                          Cadastrado em {new Date(client.created).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold px-2 py-0.5 ${
                          client.status === 'proposal'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : client.status === 'visit'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : client.status === 'closing'
                                ? 'bg-yellow-50 text-yellow-800 border-[#D4AF37]'
                                : 'bg-blue-50 text-blue-700 border-blue-300'
                        }`}
                      >
                        {STATUS_OPTIONS.find((s) => s.value === client.status)?.label ||
                          client.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3 text-xs">
                    {/* Contacts */}
                    <div className="space-y-1 text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Modalidade de Compra e Percentuais */}
                    <div className="border border-amber-200/70 bg-amber-50/30 p-3 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#1A3636] flex items-center gap-1 text-[11px]">
                          <Percent className="w-3.5 h-3.5 text-[#D4AF37]" /> Modalidade de Compra:
                        </span>
                        <span className="font-bold text-[#1A3636]">
                          {client.purchase_modality === 'a_vista' && '100% À Vista'}
                          {client.purchase_modality === 'financiamento' && 'Financiamento'}
                          {client.purchase_modality === 'consorcio' && 'Consórcio'}
                          {client.purchase_modality === 'permuta' && 'Permuta'}
                          {client.purchase_modality === 'fgts' && 'FGTS'}
                          {client.purchase_modality === 'misto' && 'Composição Mista'}
                        </span>
                      </div>

                      {fb && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {fb.cash_percent ? (
                            <Badge className="bg-[#1A3636] text-white text-[10px]">
                              {fb.cash_percent}% À Vista
                            </Badge>
                          ) : null}
                          {fb.finance_percent ? (
                            <Badge className="bg-emerald-700 text-white text-[10px]">
                              {fb.finance_percent}% Banco {fb.finance_bank || ''}
                            </Badge>
                          ) : null}
                          {fb.fgts_percent ? (
                            <Badge className="bg-blue-700 text-white text-[10px]">
                              {fb.fgts_percent}% FGTS
                            </Badge>
                          ) : null}
                          {fb.permuta_percent ? (
                            <Badge className="bg-purple-700 text-white text-[10px]">
                              {fb.permuta_percent}% Permuta
                            </Badge>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Objectives & Objections */}
                    {client.objectives && (
                      <div>
                        <span className="font-semibold text-gray-700">Objetivo / Perfil:</span>
                        <p className="text-gray-600 line-clamp-2 mt-0.5">{client.objectives}</p>
                      </div>
                    )}

                    {client.objections_notes && (
                      <div className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200/50">
                        <span className="font-semibold">Objeções Levantadas:</span>
                        <p className="line-clamp-2 mt-0.5 text-[11px]">{client.objections_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditModal(client)}
                      className="h-8 w-8 text-gray-600 hover:text-[#1A3636]"
                      title="Editar cliente"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClient(client.id)}
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenProposalForClient(client)}
                    className="bg-[#1A3636] text-white hover:bg-[#254d4d] text-xs h-8 gap-1.5 font-medium"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Criar Proposta
                  </Button>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal: Create/Edit Client */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A3636]">
              {editingClient ? 'Editar Lead / Cliente' : 'Novo Lead no CRM'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados de contato, objetivos do cliente e a composição financeira de
              compra.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Silva"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail (para Magic Link do Portal)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="status">Estágio no Funil</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val as ClientStatus })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Modalidade de Compra e Percentuais */}
            <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
              <div className="font-semibold text-sm text-[#1A3636] flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-[#D4AF37]" /> Modalidade & Composição Financeira de
                Compra
              </div>

              <div>
                <Label htmlFor="modality">Tipo Principal de Compra</Label>
                <Select
                  value={formData.purchase_modality}
                  onValueChange={(val) =>
                    setFormData({ ...formData, purchase_modality: val as PurchaseModality })
                  }
                >
                  <SelectTrigger id="modality" className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <Label htmlFor="cash_percent">% À Vista</Label>
                  <Input
                    id="cash_percent"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.cash_percent}
                    onChange={(e) =>
                      setFormData({ ...formData, cash_percent: Number(e.target.value) })
                    }
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="finance_percent">% Financiamento</Label>
                  <Input
                    id="finance_percent"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.finance_percent}
                    onChange={(e) =>
                      setFormData({ ...formData, finance_percent: Number(e.target.value) })
                    }
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="fgts_percent">% FGTS</Label>
                  <Input
                    id="fgts_percent"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.fgts_percent}
                    onChange={(e) =>
                      setFormData({ ...formData, fgts_percent: Number(e.target.value) })
                    }
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="permuta_percent">% Permuta</Label>
                  <Input
                    id="permuta_percent"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.permuta_percent}
                    onChange={(e) =>
                      setFormData({ ...formData, permuta_percent: Number(e.target.value) })
                    }
                    className="bg-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="finance_bank">Banco Preferencial / Agência</Label>
                <Input
                  id="finance_bank"
                  value={formData.finance_bank}
                  onChange={(e) => setFormData({ ...formData, finance_bank: e.target.value })}
                  placeholder="Ex: Itaú Personnalité, Caixa, Bradesco Prime"
                  className="bg-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="objectives">Objetivos de Compra (Metas, Bairros, Família)</Label>
              <Textarea
                id="objectives"
                value={formData.objectives}
                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                placeholder="Ex: Procura apartamento de 3 suítes nos Jardins, próximo a escolas internacionais, até R$ 3.5M..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="objections_notes">Objeções ou Dúvidas Levantadas</Label>
              <Textarea
                id="objections_notes"
                value={formData.objections_notes}
                onChange={(e) => setFormData({ ...formData, objections_notes: e.target.value })}
                placeholder="Ex: Achou o condomínio alto, receio com juros bancários..."
                rows={2}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1A3636] text-white hover:bg-[#254d4d]">
                Salvar Cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Create Proposal for Client */}
      <Dialog open={isProposalModalOpen} onOpenChange={setIsProposalModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A3636] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#D4AF37]" /> Estruturar Proposta Formal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cliente: <strong>{activeClientForProposal?.name}</strong>. Ao salvar, um e-mail com
              Magic Link será emitido automaticamente para o envio dos documentos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
            <div>
              <Label htmlFor="propSelect">Selecionar Imóvel</Label>
              <Select
                value={proposalData.property_id}
                onValueChange={(val) => {
                  const selProp = properties.find((p) => p.id === val)
                  setProposalData({
                    ...proposalData,
                    property_id: val,
                    value: selProp ? selProp.price : proposalData.value,
                    down_payment: selProp ? selProp.price * 0.2 : proposalData.down_payment,
                    financing_value: selProp ? selProp.price * 0.8 : proposalData.financing_value,
                  })
                }}
              >
                <SelectTrigger id="propSelect">
                  <SelectValue placeholder="Escolha o imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} — R$ {p.price?.toLocaleString('pt-BR')} ({p.neighborhood})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="propValue">Valor da Proposta (R$)</Label>
                <Input
                  id="propValue"
                  type="number"
                  value={proposalData.value}
                  onChange={(e) =>
                    setProposalData({ ...proposalData, value: Number(e.target.value) })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="downPayment">Entrada / Sinal (R$)</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={proposalData.down_payment}
                  onChange={(e) =>
                    setProposalData({ ...proposalData, down_payment: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <Label htmlFor="financingValue">Financiamento (R$)</Label>
                <Input
                  id="financingValue"
                  type="number"
                  value={proposalData.financing_value}
                  onChange={(e) =>
                    setProposalData({ ...proposalData, financing_value: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bankPartner">Banco Parceiro</Label>
              <Input
                id="bankPartner"
                value={proposalData.bank_partner}
                onChange={(e) => setProposalData({ ...proposalData, bank_partner: e.target.value })}
                placeholder="Ex: Itaú Private, Bradesco, Caixa Econômica"
              />
            </div>

            <div>
              <Label htmlFor="paymentTerms">Condições e Prazos de Pagamento</Label>
              <Textarea
                id="paymentTerms"
                value={proposalData.payment_terms}
                onChange={(e) =>
                  setProposalData({ ...proposalData, payment_terms: e.target.value })
                }
                placeholder="Ex: 20% no ato do compromisso + 80% repasse financiamento em até 45 dias..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="conditions">Condições Especiais / Cláusulas</Label>
              <Textarea
                id="conditions"
                value={proposalData.conditions}
                onChange={(e) => setProposalData({ ...proposalData, conditions: e.target.value })}
                placeholder="Ex: Inclusão de armários planejados, pintura nova..."
                rows={2}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsProposalModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1A3636] text-white hover:bg-[#254d4d]">
                Emitir Proposta & Notificar Cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
