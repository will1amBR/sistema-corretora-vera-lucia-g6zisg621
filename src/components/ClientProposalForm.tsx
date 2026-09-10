import React, { useState, useEffect } from 'react'
import {
  Send,
  Building2,
  DollarSign,
  Percent,
  Coins,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { Property, Proposal, PurchaseModality, Client } from '@/types'
import { createProposal, updateProposal } from '@/services/proposals'
import { updateClientFinancials } from '@/services/clients'

interface ClientProposalFormProps {
  client: Client
  properties: Property[]
  activeProposal?: Proposal | null
  initialSimulationData?: {
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
  } | null
  onProposalSubmitted: (createdProposal: Proposal) => void
}

export function ClientProposalForm({
  client,
  properties,
  activeProposal,
  initialSimulationData,
  onProposalSubmitted,
}: ClientProposalFormProps) {
  const { toast } = useToast()

  // Selected property
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    activeProposal?.property_id ||
      client.visit_property_id ||
      (properties[0] ? properties[0].id : ''),
  )

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId)

  // Form values
  const [offeredValue, setOfferedValue] = useState<number>(
    activeProposal?.value || selectedProperty?.price || 2450000,
  )
  const [paymentModality, setPaymentModality] = useState<PurchaseModality>(
    client.purchase_modality || 'financiamento',
  )
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20)
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(
    activeProposal?.down_payment || (offeredValue * 20) / 100,
  )
  const [financingAmount, setFinancingAmount] = useState<number>(
    activeProposal?.financing_value || offeredValue - (offeredValue * 20) / 100,
  )
  const [selectedBank, setSelectedBank] = useState<string>(
    activeProposal?.bank_partner || client.financial_breakdown?.finance_bank || 'Itaú Unibanco',
  )
  const [fgtsAmount, setFgtsAmount] = useState<number>(client.financial_breakdown?.fgts_amount || 0)
  const [paymentTerms, setPaymentTerms] = useState<string>(
    activeProposal?.payment_terms ||
      'Entrada de 20% no ato do compromisso de compra e venda + saldo via financiamento bancário com interveniência quitativa se aplicável.',
  )
  const [conditions, setConditions] = useState<string>(
    activeProposal?.conditions ||
      'Proposta válida por 5 dias úteis. Sujeita a vistoria técnica e aprovação da documentação.',
  )
  const [clientNotes, setClientNotes] = useState<string>(activeProposal?.notes_client || '')

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update values if selected property changes
  const handlePropertyChange = (newPropId: string) => {
    setSelectedPropertyId(newPropId)
    const prop = properties.find((p) => p.id === newPropId)
    if (prop) {
      setOfferedValue(prop.price)
      const down = (prop.price * downPaymentPercent) / 100
      setDownPaymentAmount(down)
      setFinancingAmount(prop.price - down)
    }
  }

  // Recalculate down / finance when offeredValue or downPercent changes
  const handleOfferedValueChange = (val: number) => {
    setOfferedValue(val)
    if (paymentModality === 'a_vista') {
      setDownPaymentAmount(val)
      setFinancingAmount(0)
    } else {
      const down = (val * downPaymentPercent) / 100
      setDownPaymentAmount(down)
      setFinancingAmount(Math.max(0, val - down))
    }
  }

  const handleDownPercentChange = (pct: number) => {
    setDownPaymentPercent(pct)
    const down = (offeredValue * pct) / 100
    setDownPaymentAmount(down)
    setFinancingAmount(Math.max(0, offeredValue - down))
  }

  // Effect to load simulation data when injected by the simulator
  useEffect(() => {
    if (initialSimulationData) {
      if (initialSimulationData.propertyValue) {
        setOfferedValue(initialSimulationData.propertyValue)
      }
      if (initialSimulationData.downPayment !== undefined) {
        setDownPaymentAmount(initialSimulationData.downPayment)
        const pct = initialSimulationData.propertyValue
          ? Math.round(
              (initialSimulationData.downPayment / initialSimulationData.propertyValue) * 100,
            )
          : 20
        setDownPaymentPercent(pct)
      }
      if (initialSimulationData.financingValue !== undefined) {
        setFinancingAmount(initialSimulationData.financingValue)
      }
      if (initialSimulationData.bankName) {
        setSelectedBank(initialSimulationData.bankName)
      }
      if (initialSimulationData.fgtsAmount !== undefined) {
        setFgtsAmount(initialSimulationData.fgtsAmount)
      }
      toast({
        title: 'Simulação aplicada!',
        description: 'Os valores do simulador foram transferidos para o formulário da proposta.',
      })
    }
  }, [initialSimulationData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client || !selectedPropertyId) {
      toast({
        title: 'Dados incompletos',
        description: 'Selecione um imóvel para emitir a proposta.',
        variant: 'destructive',
      })
      return
    }

    if (offeredValue <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor de proposta positivo.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)

      const proposalPayload: Partial<Proposal> = {
        client_id: client.id,
        property_id: selectedPropertyId,
        value: offeredValue,
        down_payment: downPaymentAmount,
        financing_value: paymentModality === 'a_vista' ? 0 : financingAmount,
        bank_partner: paymentModality === 'a_vista' ? 'À Vista (TED/PIX)' : selectedBank,
        payment_terms: paymentTerms,
        conditions: conditions,
        status: 'sent',
        negotiation_stage: 'proposta_enviada',
        notes_client: clientNotes,
        simulation_data: initialSimulationData || undefined,
      }

      let savedProposal: Proposal
      if (activeProposal && activeProposal.id) {
        savedProposal = await updateProposal(activeProposal.id, proposalPayload)
        toast({
          title: 'Proposta comercial atualizada!',
          description: 'Sua proposta foi registrada e enviada à corretora Vera Lúcia Koren.',
        })
      } else {
        savedProposal = await createProposal(proposalPayload)
        toast({
          title: 'Proposta comercial enviada!',
          description:
            'Parabéns! Sua proposta formal foi protocolada com sucesso. Vera Koren foi notificada.',
        })
      }

      // Also update client purchase modality & financial breakdown
      await updateClientFinancials(client.id, paymentModality, {
        cash_amount: downPaymentAmount,
        cash_percent: downPaymentPercent,
        finance_bank: selectedBank,
        fgts_amount: fgtsAmount,
        fgts_percent:
          fgtsAmount > 0 && offeredValue > 0 ? Math.round((fgtsAmount / offeredValue) * 100) : 0,
        notes: clientNotes,
      })

      onProposalSubmitted(savedProposal)
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao enviar proposta',
        description: err.message || 'Ocorreu um erro ao salvar sua proposta.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="card-elevated border-t-4 border-t-[#D4AF37] overflow-hidden">
      <CardHeader className="p-6 pb-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#1A3636] text-[#D4AF37] shadow-xs">
                <FileCheck className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-lg font-bold text-[#1A3636]">
                  {activeProposal
                    ? 'Minha Proposta Comercial Ativa'
                    : 'Enviar Nova Proposta de Compra'}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Estruture os valores, percentual de entrada e condições de pagamento para o
                  proprietário.
                </CardDescription>
              </div>
            </div>
          </div>

          <Badge className="bg-emerald-100 text-emerald-800 font-bold text-xs py-1 px-3">
            Garantia Foxter & Vera Lúcia Koren
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#D4AF37]" /> Imóvel Objeto da Proposta
            </Label>
            <Select value={selectedPropertyId} onValueChange={handlePropertyChange}>
              <SelectTrigger className="text-xs bg-white">
                <SelectValue placeholder="Selecione o imóvel desejado" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.title} — {prop.neighborhood} (R$ {prop.price.toLocaleString('pt-BR')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedProperty && (
              <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 flex flex-wrap justify-between items-center gap-2 border border-gray-200">
                <span>
                  Pedida Original:{' '}
                  <strong className="text-[#1A3636]">
                    R$ {selectedProperty.price?.toLocaleString('pt-BR')}
                  </strong>
                </span>
                <span>
                  Localização: {selectedProperty.address}, {selectedProperty.neighborhood}
                </span>
                <span>Área: {selectedProperty.area_sqm} m²</span>
              </div>
            )}
          </div>

          {/* Value & Modality Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Offered Value */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700">
                Valor Ofertado pelo Imóvel (R$)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">R$</span>
                <Input
                  type="number"
                  value={offeredValue || ''}
                  onChange={(e) => handleOfferedValueChange(Number(e.target.value) || 0)}
                  className="pl-9 font-bold text-base text-[#1A3636]"
                  placeholder="Ex: 2400000"
                  required
                />
              </div>
              {selectedProperty && offeredValue < selectedProperty.price && (
                <p className="text-[11px] text-amber-700">
                  Desconto proposto:{' '}
                  <strong>
                    {(
                      ((selectedProperty.price - offeredValue) / selectedProperty.price) *
                      100
                    ).toFixed(1)}
                    %
                  </strong>{' '}
                  (R$ {(selectedProperty.price - offeredValue).toLocaleString('pt-BR')})
                </p>
              )}
            </div>

            {/* Payment Modality */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700">
                Forma Principal de Pagamento
              </Label>
              <Select
                value={paymentModality}
                onValueChange={(val) => {
                  setPaymentModality(val as PurchaseModality)
                  if (val === 'a_vista') {
                    setDownPaymentAmount(offeredValue)
                    setFinancingAmount(0)
                  }
                }}
              >
                <SelectTrigger className="text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financiamento">
                    Financiamento Bancário (Entrada + Banco)
                  </SelectItem>
                  <SelectItem value="a_vista">À Vista (Recursos Próprios / Liquidez)</SelectItem>
                  <SelectItem value="fgts">Financiamento com Uso de FGTS</SelectItem>
                  <SelectItem value="consorcio">Carta de Consórcio Contemplada</SelectItem>
                  <SelectItem value="permuta">Composição com Permuta de Imóvel</SelectItem>
                  <SelectItem value="misto">Composição Mista Flexível</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Breakdown: Down payment & Financing */}
          {paymentModality !== 'a_vista' && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
              <h4 className="text-xs font-bold text-[#1A3636] uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#D4AF37]" /> Estrutura da Entrada e Financiamento
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Down payment % */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-600 font-semibold">
                    Entrada Proposta (%)
                  </Label>
                  <Select
                    value={downPaymentPercent.toString()}
                    onValueChange={(val) => handleDownPercentChange(Number(val))}
                  >
                    <SelectTrigger className="text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15%</SelectItem>
                      <SelectItem value="20">20% (Padrão Bancário)</SelectItem>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="40">40%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Down payment in R$ */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-600 font-semibold">
                    Entrada / Sinal (R$)
                  </Label>
                  <Input
                    type="number"
                    value={downPaymentAmount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0
                      setDownPaymentAmount(val)
                      setFinancingAmount(Math.max(0, offeredValue - val))
                    }}
                    className="text-xs bg-white font-bold text-[#1A3636]"
                  />
                </div>

                {/* Financed Amount */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-600 font-semibold">
                    Saldo Financiado (R$)
                  </Label>
                  <Input
                    type="number"
                    value={financingAmount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0
                      setFinancingAmount(val)
                      setDownPaymentAmount(Math.max(0, offeredValue - val))
                    }}
                    className="text-xs bg-white font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Bank & FGTS row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-600 font-semibold">
                    Banco de Preferência para Financiamento
                  </Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger className="text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Caixa Econômica Federal">
                        Caixa Econômica Federal
                      </SelectItem>
                      <SelectItem value="Itaú Unibanco">Itaú Unibanco</SelectItem>
                      <SelectItem value="Bradesco Prime">Bradesco Prime</SelectItem>
                      <SelectItem value="Santander Select">Santander Select</SelectItem>
                      <SelectItem value="Banco do Brasil">Banco do Brasil</SelectItem>
                      <SelectItem value="Outro Banco / Cooperativa">
                        Outro Banco / Cooperativa (Sicredi/Sicoob)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-600 font-semibold">
                    Saldo FGTS / Consórcio Utilizado (R$)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={fgtsAmount || ''}
                    onChange={(e) => setFgtsAmount(Number(e.target.value) || 0)}
                    className="text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Terms and Special Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700">Prazos e Forma de Pagamento</Label>
              <Textarea
                rows={3}
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="text-xs leading-relaxed bg-white"
                placeholder="Ex: 20% no contrato de promessa, 80% via repasse do banco Itaú em até 45 dias."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700">
                Condições Adicionais / Benfeitorias
              </Label>
              <Textarea
                rows={3}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="text-xs leading-relaxed bg-white"
                placeholder="Ex: Permanência de todos os móveis planejados, climatizadores e luminárias."
              />
            </div>
          </div>

          {/* Observations to Broker Vera */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Mensagem ou Observações Especiais para
              a Vera Lúcia
            </Label>
            <Textarea
              rows={2}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              className="text-xs leading-relaxed bg-white"
              placeholder="Conte-nos o que é indispensável para você, prazo desejado de mudança ou qualquer dúvida sobre a negociação."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-gray-500 text-center sm:text-left">
              Ao enviar, a corretora Vera Lúcia Koren revisará a minuta comercial para apresentação
              formal ao vendedor.
            </p>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#1A3636] hover:bg-[#254d4d] text-white font-bold text-xs px-6 py-5 gap-2 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Enviando Proposta...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    {activeProposal
                      ? 'Atualizar e Reenviar Proposta'
                      : 'Enviar Minha Proposta Formal'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
