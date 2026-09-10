import React, { useEffect, useState, useMemo } from 'react'
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
  LayoutGrid,
  ListFilter,
  Kanban,
  Table as TableIcon,
  RefreshCw,
  TrendingUp,
  MapPin,
  ExternalLink,
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  updateClientStatus,
} from '@/services/clients'
import { getProperties } from '@/services/properties'
import { createProposal } from '@/services/proposals'
import { CRMKanbanBoard } from '@/components/crm/CRMKanbanBoard'
import { KANBAN_STAGES } from '@/components/crm/CRMKanbanColumn'
import { ClientDetailDrawer } from '@/components/crm/ClientDetailDrawer'
import PropertyDetailModal from '@/components/PropertyDetailModal'
import { getClientPotentialValue, getFinancialSummary } from '@/components/crm/CRMKanbanCard'
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
  { value: 'a_vista', label: '100% Recursos Próprios / À Vista' },
  { value: 'financiamento', label: 'Financiamento Bancário' },
  { value: 'consorcio', label: 'Carta de Consórcio' },
  { value: 'permuta', label: 'Permuta de Imóvel / Veículo' },
  { value: 'fgts', label: 'Recursos FGTS' },
  { value: 'misto', label: 'Composição Mista (ex: Entrada + Financiamento + FGTS)' },
]

export default function CRMLeads() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedModality, setSelectedModality] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [loading, setLoading] = useState(true)

  // Drawer & Modals state
  const [activeDrawerClient, setActiveDrawerClient] = useState<Client | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [activePropertyModal, setActivePropertyModal] = useState<Property | null>(null)
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false)

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
    permuta_item_desc: '',
    visit_property_id: '',
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

      // Refresh drawer client if currently open
      if (activeDrawerClient) {
        const refreshed = clientsData.find((c) => c.id === activeDrawerClient.id)
        if (refreshed) setActiveDrawerClient(refreshed)
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao carregar CRM',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Property Map lookup
  const propertiesMap = useMemo(() => {
    const map = new Map<string, Property>()
    properties.forEach((p) => map.set(p.id, p))
    return map
  }, [properties])

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.objectives?.toLowerCase().includes(search.toLowerCase()) ||
        c.objections_notes?.toLowerCase().includes(search.toLowerCase()) ||
        (c.expand?.visit_property_id?.title || '').toLowerCase().includes(search.toLowerCase())

      const matchStatus = selectedStatus === 'all' || c.status === selectedStatus
      const matchModality = selectedModality === 'all' || c.purchase_modality === selectedModality

      return matchSearch && matchStatus && matchModality
    })
  }, [clients, search, selectedStatus, selectedModality])

  // Overall Financial Pipeline Total
  const totalPipelineValue = useMemo(() => {
    return clients.reduce((acc, c) => {
      if (c.status === 'lost') return acc
      const propId = c.interested_property_ids?.[0] || c.visit_property_id
      const prop = propId ? propertiesMap.get(propId) : null
      return acc + getClientPotentialValue(c, prop)
    }, 0)
  }, [clients, propertiesMap])

  // DRAG AND DROP STATUS HANDLER (with optimistic update & rollback)
  const handleDropClientStatus = async (clientId: string, newStatus: ClientStatus) => {
    const targetClient = clients.find((c) => c.id === clientId)
    if (!targetClient || targetClient.status === newStatus) return

    const previousStatus = targetClient.status

    // 1. Optimistic UI update
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, status: newStatus } : c)))
    if (activeDrawerClient && activeDrawerClient.id === clientId) {
      setActiveDrawerClient((prev) => (prev ? { ...prev, status: newStatus } : null))
    }

    const stageLabel = KANBAN_STAGES.find((s) => s.key === newStatus)?.label || newStatus
    toast({
      title: 'Etapa atualizada!',
      description: `"${targetClient.name}" movido para "${stageLabel}".`,
    })

    // 2. Persist to PocketBase
    try {
      await updateClientStatus(clientId, newStatus)
    } catch (err: any) {
      // Rollback on error
      console.error(err)
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, status: previousStatus } : c)),
      )
      if (activeDrawerClient && activeDrawerClient.id === clientId) {
        setActiveDrawerClient((prev) => (prev ? { ...prev, status: previousStatus } : null))
      }
      toast({
        title: 'Erro ao salvar alteração de etapa',
        description: err.message || 'Houve uma falha de conexão. O estágio foi revertido.',
        variant: 'destructive',
      })
    }
  }

  // Handle click on Client -> open full details drawer
  const handleOpenClientDrawer = (client: Client) => {
    setActiveDrawerClient(client)
    setIsDrawerOpen(true)
  }

  // Handle click on Property -> open Property Detail Modal
  const handleOpenPropertyModal = (property: Property) => {
    setActivePropertyModal(property)
    setIsPropertyModalOpen(true)
  }

  // Advance client by one stage helper
  const handleAdvanceStage = async (client: Client) => {
    const stageKeys: ClientStatus[] = ['lead', 'contact', 'visit', 'proposal', 'closing']
    const idx = stageKeys.indexOf(client.status)
    if (idx >= 0 && idx < stageKeys.length - 1) {
      await handleDropClientStatus(client.id, stageKeys[idx + 1])
    }
  }

  // Open Create Modal
  const handleOpenCreateModal = (defaultStatus: ClientStatus = 'lead') => {
    setEditingClient(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: defaultStatus,
      purchase_modality: 'misto',
      objectives: '',
      objections_notes: '',
      cash_percent: 20,
      cash_amount: 0,
      finance_percent: 80,
      finance_bank: 'Itaú Personalité',
      fgts_percent: 0,
      permuta_percent: 0,
      permuta_item_desc: '',
      visit_property_id: properties[0]?.id || '',
      notes: '',
    })
    setIsModalOpen(true)
  }

  // Open Edit Modal
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
      finance_bank: fb.finance_bank ?? 'Itaú Personalité',
      fgts_percent: fb.fgts_percent ?? 0,
      permuta_percent: fb.permuta_percent ?? 0,
      permuta_item_desc: fb.permuta_item_desc || '',
      visit_property_id: client.visit_property_id || client.interested_property_ids?.[0] || '',
      notes: client.notes || '',
    })
    setIsModalOpen(true)
  }

  // Save / Update Client
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

    const interestedIds = formData.visit_property_id ? [formData.visit_property_id] : []

    const payload: Partial<Client> = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      purchase_modality: formData.purchase_modality,
      objectives: formData.objectives,
      objections_notes: formData.objections_notes,
      notes: formData.notes,
      visit_property_id: formData.visit_property_id || undefined,
      interested_property_ids: interestedIds,
      financial_breakdown: {
        cash_percent: Number(formData.cash_percent),
        cash_amount: Number(formData.cash_amount),
        finance_percent: Number(formData.finance_percent),
        finance_bank: formData.finance_bank,
        fgts_percent: Number(formData.fgts_percent),
        permuta_percent: Number(formData.permuta_percent),
        permuta_item_desc: formData.permuta_item_desc,
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

  // Delete Client
  const handleDeleteClient = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este cliente do CRM?')) {
      try {
        await deleteClient(id)
        toast({ title: 'Cliente removido' })
        if (activeDrawerClient && activeDrawerClient.id === id) {
          setIsDrawerOpen(false)
        }
        loadData()
      } catch (err: any) {
        toast({ title: 'Erro ao remover', description: err.message, variant: 'destructive' })
      }
    }
  }

  // Open Proposal modal for client
  const handleOpenProposalForClient = (client: Client) => {
    setActiveClientForProposal(client)
    const clientPropId =
      client.visit_property_id || client.interested_property_ids?.[0] || properties[0]?.id || ''
    const clientProp = propertiesMap.get(clientPropId) || properties[0]

    const propPrice = clientProp?.price || 2000000
    const cashPct = (client.financial_breakdown?.cash_percent || 20) / 100

    setProposalData({
      property_id: clientPropId,
      value: propPrice,
      down_payment: Math.round(propPrice * cashPct),
      financing_value: Math.round(propPrice * (1 - cashPct)),
      bank_partner: client.financial_breakdown?.finance_bank || 'Itaú Private',
      payment_terms: `${client.financial_breakdown?.cash_percent || 20}% de entrada no ato + financiamento bancário do saldo remanescente.`,
      conditions:
        'Imóvel entregue livre de quaisquer ônus, com documentação 100% regularizada pela corretora Vera Lúcia Koren.',
    })
    setIsProposalModalOpen(true)
  }

  // Create Proposal
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

      // Update client to proposal stage automatically
      await updateClientStatus(activeClientForProposal.id, 'proposal')

      toast({
        title: 'Proposta Estruturada com Sucesso!',
        description: 'O cliente avançou para a etapa "Proposta / Em Análise".',
      })
      setIsProposalModalOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao criar proposta', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & KPI Summary */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl card-elevated">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1A3636] flex items-center gap-2 tracking-tight">
              <Users className="w-6 h-6 text-[#D4AF37]" /> CRM Comercial da Vera Lúcia
            </h1>
            <Badge className="bg-[#1A3636] text-[#D4AF37] font-semibold">Funil Ativo</Badge>
          </div>
          <p className="text-sm text-gray-500">
            Kanban comercial com drag-and-drop de etapas, composição financeira detalhada e
            navegação rápida por cliente ou apartamento de interesse.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Pipeline Total Pill */}
          <div className="bg-amber-50/70 border border-[#D4AF37]/50 rounded-xl px-4 py-2 text-left">
            <span className="text-[10px] text-amber-800 uppercase tracking-wider font-bold block">
              Volume do Funil
            </span>
            <span className="text-base font-extrabold text-[#1A3636]">
              R$ {(totalPipelineValue / 1000000).toFixed(2)} Milhões
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-gray-200 text-[#1A3636] hover:bg-gray-50 text-xs h-10"
            title="Atualizar lista de clientes"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            onClick={() => handleOpenCreateModal('lead')}
            className="bg-[#1A3636] text-white hover:bg-[#254d4d] gap-2 text-xs font-semibold h-10 shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            Novo Lead no Funil
          </Button>
        </div>
      </div>

      {/* Filter, Search & View Toggle Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 rounded-xl card-elevated items-center">
        {/* Search */}
        <div className="relative md:col-span-5">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Buscar por nome, telefone, e-mail, metas ou imóvel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50/50 text-xs h-10"
          />
        </div>

        {/* Filter: Modality */}
        <div className="md:col-span-3">
          <Select value={selectedModality} onValueChange={setSelectedModality}>
            <SelectTrigger className="text-xs h-10 bg-gray-50/50">
              <SelectValue placeholder="Modalidade de Compra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Modalidades</SelectItem>
              {MODALITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter: Stage */}
        <div className="md:col-span-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="text-xs h-10 bg-gray-50/50">
              <SelectValue placeholder="Estágio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estágios ({clients.length})</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle: Kanban vs List */}
        <div className="md:col-span-2 flex justify-end">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#1A3636] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Visualização em Colunas Kanban"
            >
              <Kanban className="w-3.5 h-3.5 text-[#D4AF37]" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#1A3636] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Visualização em Lista / Tabela"
            >
              <TableIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Kanban or List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 bg-white rounded-2xl border space-y-3">
              <Skeleton className="h-6 w-24 bg-gray-200" />
              <Skeleton className="h-32 w-full rounded-xl bg-gray-100" />
              <Skeleton className="h-32 w-full rounded-xl bg-gray-100" />
            </div>
          ))}
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <CRMKanbanBoard
          clients={filteredClients}
          properties={properties}
          onClientClick={handleOpenClientDrawer}
          onPropertyClick={handleOpenPropertyModal}
          onAdvanceStage={handleAdvanceStage}
          onDropClient={handleDropClientStatus}
          onQuickAdd={(st) => handleOpenCreateModal(st)}
        />
      ) : (
        /* LIST / TABLE VIEW */
        <Card className="card-elevated overflow-hidden">
          <CardHeader className="p-5 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-[#1A3636]">
              Lista Completa de Clientes no Funil ({filteredClients.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Clique no cliente para abrir a ficha completa ou no imóvel para abrir o catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Cliente / Contato</th>
                    <th className="py-3 px-4">Estágio no Funil</th>
                    <th className="py-3 px-4">Imóvel de Interesse</th>
                    <th className="py-3 px-4">Modalidade de Compra</th>
                    <th className="py-3 px-4">Composição Financeira</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        Nenhum cliente encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                      const propId = client.interested_property_ids?.[0] || client.visit_property_id
                      const prop = propId ? propertiesMap.get(propId) : null
                      const summary = getFinancialSummary(client, prop)

                      return (
                        <tr
                          key={client.id}
                          onClick={() => handleOpenClientDrawer(client)}
                          className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#1A3636] block hover:text-[#D4AF37]">
                              {client.name}
                            </span>
                            <span className="text-[11px] text-gray-500 font-mono">
                              {client.phone || client.email || '--'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                client.status === 'proposal'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : client.status === 'visit'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : client.status === 'closing'
                                      ? 'bg-yellow-50 text-yellow-900 border-[#D4AF37]'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {STATUS_OPTIONS.find((s) => s.value === client.status)?.label ||
                                client.status}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4">
                            {prop ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenPropertyModal(prop)
                                }}
                                className="text-left group flex items-center gap-1.5"
                              >
                                <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <div>
                                  <span className="font-semibold text-emerald-950 block group-hover:underline">
                                    {prop.title}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {prop.neighborhood} • R$ {prop.price?.toLocaleString('pt-BR')}
                                  </span>
                                </div>
                              </button>
                            ) : (
                              <span className="text-gray-400 italic">Em definição</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-gray-700">
                              {client.purchase_modality === 'a_vista' && 'À Vista'}
                              {client.purchase_modality === 'financiamento' && 'Financiamento'}
                              {client.purchase_modality === 'consorcio' && 'Consórcio'}
                              {client.purchase_modality === 'permuta' && 'Permuta'}
                              {client.purchase_modality === 'fgts' && 'FGTS'}
                              {client.purchase_modality === 'misto' && 'Misto'}
                              {!client.purchase_modality && '--'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs truncate" title={summary}>
                            <span className="p-1 px-2 rounded bg-gray-100 text-[11px] text-gray-800 truncate block">
                              {summary}
                            </span>
                          </td>

                          <td
                            className="py-3.5 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditModal(client)}
                                className="h-7 w-7 text-gray-500 hover:text-[#1A3636]"
                                title="Editar dados"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClient(client.id)}
                                className="h-7 w-7 text-gray-400 hover:text-red-600"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CLIENT DETAIL DRAWER */}
      <ClientDetailDrawer
        client={activeDrawerClient}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        properties={properties}
        onStatusChange={async (clientId, newStatus) => {
          await handleDropClientStatus(clientId, newStatus)
        }}
        onEditClient={handleOpenEditModal}
        onDeleteClient={handleDeleteClient}
        onPropertyClick={handleOpenPropertyModal}
        onCreateProposalForClient={handleOpenProposalForClient}
      />

      {/* PROPERTY DETAIL MODAL */}
      <PropertyDetailModal
        property={activePropertyModal}
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
      />

      {/* MODAL: CREATE / EDIT CLIENT */}
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
                  placeholder="(51) 99999-9999"
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

            {/* Imóvel de Interesse Principal */}
            <div>
              <Label htmlFor="propPref">Imóvel de Interesse / Visita</Label>
              <Select
                value={formData.visit_property_id}
                onValueChange={(val) => setFormData({ ...formData, visit_property_id: val })}
              >
                <SelectTrigger id="propPref" className="bg-white">
                  <SelectValue placeholder="Selecione um imóvel do catálogo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Nenhum imóvel vinculado --</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} — R$ {p.price?.toLocaleString('pt-BR')} ({p.neighborhood})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="finance_bank">Banco Preferencial / Agência</Label>
                  <Input
                    id="finance_bank"
                    value={formData.finance_bank}
                    onChange={(e) => setFormData({ ...formData, finance_bank: e.target.value })}
                    placeholder="Ex: Itaú Personalité, Caixa, Bradesco Prime"
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="permuta_item">Descrição da Permuta (se houver)</Label>
                  <Input
                    id="permuta_item"
                    value={formData.permuta_item_desc}
                    onChange={(e) =>
                      setFormData({ ...formData, permuta_item_desc: e.target.value })
                    }
                    placeholder="Ex: Imóvel na Cidade Baixa R$ 500k"
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="objectives">Objetivos de Compra (Metas, Bairros, Família)</Label>
              <Textarea
                id="objectives"
                value={formData.objectives}
                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                placeholder="Ex: Procura apartamento de 3 dormitórios no Moinhos de Vento ou Petrópolis..."
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

      {/* MODAL: CREATE PROPOSAL FOR CLIENT */}
      <Dialog open={isProposalModalOpen} onOpenChange={setIsProposalModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A3636] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#D4AF37]" /> Estruturar Proposta Formal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cliente: <strong>{activeClientForProposal?.name}</strong>. Ao emitir, a proposta será
              salva e o lead avançará no funil.
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
                    down_payment: selProp
                      ? Math.round(selProp.price * 0.2)
                      : proposalData.down_payment,
                    financing_value: selProp
                      ? Math.round(selProp.price * 0.8)
                      : proposalData.financing_value,
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
                Emitir Proposta & Avançar Funil
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
