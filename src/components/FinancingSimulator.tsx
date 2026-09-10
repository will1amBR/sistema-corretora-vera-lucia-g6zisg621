import React, { useState, useMemo } from 'react'
import {
  Calculator,
  Building2,
  TrendingUp,
  Percent,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Coins,
  Layers,
  Award,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  BANK_SCENARIOS,
  calculateFinancing,
  BankScenario,
  SimulationResult,
} from '@/lib/financing-calculator'

interface FinancingSimulatorProps {
  propertyPrice?: number
  propertyTitle?: string
  initialDownPaymentPercent?: number
  onApplySimulationToProposal?: (simData: {
    propertyValue: number
    downPayment: number
    financingValue: number
    bankName: string
    amortizationType: 'SAC' | 'PRICE'
    termYears: number
    annualRate: number
    monthlyInstallment: number
    fgtsAmount: number
    consorcioAmount?: number
  }) => void
}

export function FinancingSimulator({
  propertyPrice = 2450000,
  propertyTitle = 'Imóvel Selecionado',
  initialDownPaymentPercent = 20,
  onApplySimulationToProposal,
}: FinancingSimulatorProps) {
  // Manual inputs
  const [propertyValue, setPropertyValue] = useState<number>(propertyPrice)
  const [downPercent, setDownPercent] = useState<number>(initialDownPaymentPercent)
  const [termYears, setTermYears] = useState<number>(30)
  const [annualRate, setAnnualRate] = useState<number>(10.19)
  const [amortizationType, setAmortizationType] = useState<'SAC' | 'PRICE'>('SAC')
  const [fgtsAmount, setFgtsAmount] = useState<number>(0)
  const [selectedBank, setSelectedBank] = useState<string>('itau')

  // Consorcio comparison state
  const [consorcioFeeAdmin, setConsorcioFeeAdmin] = useState<number>(18) // % taxa adm
  const [consorcioTermMonths, setConsorcioTermMonths] = useState<number>(180) // 15 anos

  // Update propertyValue if parent prop changes and user hasn't edited
  React.useEffect(() => {
    if (propertyPrice > 0) {
      setPropertyValue(propertyPrice)
    }
  }, [propertyPrice])

  // Calculation for manual
  const manualResult: SimulationResult = useMemo(() => {
    return calculateFinancing({
      propertyValue,
      downPaymentPercent: downPercent,
      termYears,
      annualRate,
      amortizationType,
      fgtsAmount,
    })
  }, [propertyValue, downPercent, termYears, annualRate, amortizationType, fgtsAmount])

  // Auto comparison across all banks
  const bankSimulations = useMemo(() => {
    return BANK_SCENARIOS.map((bank) => {
      const res = calculateFinancing({
        propertyValue,
        downPaymentPercent: Math.max(downPercent, bank.minDownPaymentPercent),
        termYears: Math.min(termYears, bank.maxTermYears),
        annualRate: bank.annualRate,
        amortizationType,
        fgtsAmount,
      })
      return { bank, result: res }
    })
  }, [propertyValue, downPercent, termYears, amortizationType, fgtsAmount])

  // Find lowest first installment
  const bestBank = useMemo(() => {
    if (bankSimulations.length === 0) return null
    return [...bankSimulations].sort(
      (a, b) => a.result.firstInstallment - b.result.firstInstallment,
    )[0]
  }, [bankSimulations])

  // Consórcio alternative calculations
  const consorcioFinanced = Math.max(0, propertyValue - (propertyValue * downPercent) / 100)
  const consorcioTotalCredit = consorcioFinanced
  const consorcioTotalPaid = consorcioTotalCredit * (1 + consorcioFeeAdmin / 100)
  const consorcioMonthlyInstallment =
    consorcioTermMonths > 0 ? consorcioTotalPaid / consorcioTermMonths : 0
  const consorcioTotalFeeCost = consorcioTotalPaid - consorcioTotalCredit

  // Handle Quick Select Bank from automatic table
  const handleSelectBankPreset = (bank: BankScenario) => {
    setSelectedBank(bank.id)
    setAnnualRate(bank.annualRate)
    setTermYears((prev) => Math.min(prev, bank.maxTermYears))
    setDownPercent((prev) => Math.max(prev, bank.minDownPaymentPercent))
  }

  const handleApplyToProposal = (bankName?: string) => {
    if (!onApplySimulationToProposal) return
    const chosenBankName =
      bankName || BANK_SCENARIOS.find((b) => b.id === selectedBank)?.name || 'Itaú Unibanco'

    onApplySimulationToProposal({
      propertyValue: manualResult.propertyValue,
      downPayment: manualResult.downPayment,
      financingValue: manualResult.financedAmount,
      bankName: chosenBankName,
      amortizationType,
      termYears: manualResult.termYears,
      annualRate: manualResult.annualRate,
      monthlyInstallment: manualResult.firstInstallment,
      fgtsAmount,
    })
  }

  return (
    <Card className="card-elevated border-t-4 border-t-[#D4AF37] overflow-hidden">
      <CardHeader className="p-6 pb-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#1A3636] text-[#D4AF37] shadow-xs">
                <Calculator className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-lg font-bold text-[#1A3636]">
                  Simulador de Financiamento Imobiliário
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Simule de forma manual e compare automaticamente as condições dos principais
                  bancos brasileiros para {propertyTitle}.
                </CardDescription>
              </div>
            </div>
          </div>

          <Badge className="bg-[#1A3636] text-[#D4AF37] border-none text-xs font-semibold px-3 py-1">
            SAC e PRICE • Comparativo Bancário
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <Tabs defaultValue="automatic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 mb-6">
            <TabsTrigger
              value="automatic"
              className="text-xs font-bold data-[state=active]:bg-[#1A3636] data-[state=active]:text-white"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#D4AF37]" /> Comparador Automático de
              Bancos
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="text-xs font-bold data-[state=active]:bg-[#1A3636] data-[state=active]:text-white"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5 text-[#D4AF37]" /> Ajuste Manual Personalizado
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: AUTOMATIC COMPARATOR */}
          <TabsContent value="automatic" className="space-y-6">
            {/* Quick Baseline Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
              <div>
                <Label className="text-gray-600 font-semibold text-[11px]">Valor do Imóvel</Label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-2 text-gray-400 font-semibold text-xs">
                    R$
                  </span>
                  <Input
                    type="number"
                    value={propertyValue || ''}
                    onChange={(e) => setPropertyValue(Number(e.target.value) || 0)}
                    className="pl-8 text-xs font-bold text-[#1A3636]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label className="text-gray-600 font-semibold text-[11px]">Entrada Total</Label>
                  <span className="text-[11px] font-bold text-[#1A3636]">{downPercent}%</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Slider
                    value={[downPercent]}
                    min={20}
                    max={80}
                    step={5}
                    onValueChange={(val) => setDownPercent(val[0])}
                    className="flex-1"
                  />
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    R$ {((propertyValue * downPercent) / 100).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label className="text-gray-600 font-semibold text-[11px]">Amortização</Label>
                  <span className="text-[10px] text-gray-400">
                    {amortizationType === 'SAC' ? 'Parcelas Decrescentes' : 'Parcelas Fixas'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={amortizationType === 'SAC' ? 'default' : 'outline'}
                    onClick={() => setAmortizationType('SAC')}
                    className={`text-xs h-8 ${
                      amortizationType === 'SAC'
                        ? 'bg-[#1A3636] text-white hover:bg-[#254d4d]'
                        : 'text-gray-700'
                    }`}
                  >
                    SAC (Mais Usado)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={amortizationType === 'PRICE' ? 'default' : 'outline'}
                    onClick={() => setAmortizationType('PRICE')}
                    className={`text-xs h-8 ${
                      amortizationType === 'PRICE'
                        ? 'bg-[#1A3636] text-white hover:bg-[#254d4d]'
                        : 'text-gray-700'
                    }`}
                  >
                    PRICE (Fixa)
                  </Button>
                </div>
              </div>
            </div>

            {/* Optional FGTS pill */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#D4AF37]" />
                <span className="font-semibold text-gray-700">
                  Quer abater saldo do FGTS na sua entrada?
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-gray-500 text-[11px]">Saldo FGTS: R$</span>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={fgtsAmount || ''}
                  onChange={(e) => setFgtsAmount(Number(e.target.value) || 0)}
                  className="w-32 h-8 text-xs font-semibold bg-white"
                />
              </div>
            </div>

            {/* Bank Comparison Grid / Cards */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#1A3636] flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#D4AF37]" /> Comparativo de Instituições
                  Financeiras
                </h3>
                <span className="text-[11px] text-gray-500">
                  Prazo simulado: {termYears} anos (360 meses)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankSimulations.map(({ bank, result }) => {
                  const isBest = bestBank?.bank.id === bank.id
                  return (
                    <Card
                      key={bank.id}
                      className={`relative transition-all border-2 flex flex-col justify-between ${
                        isBest
                          ? 'border-[#D4AF37] shadow-md bg-gradient-to-b from-amber-50/20 to-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isBest && (
                        <div className="absolute -top-3 right-4 bg-[#D4AF37] text-[#1A3636] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <Award className="w-3 h-3" /> Menor Parcela Inicial
                        </div>
                      )}

                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs ${bank.colorBadge}`}
                            >
                              {bank.logoText}
                            </span>
                            <div>
                              <h4 className="font-bold text-sm text-[#1A3636] leading-tight">
                                {bank.name}
                              </h4>
                              <span className="text-[11px] font-bold text-emerald-700">
                                Taxa: {bank.annualRate}% a.a. + TR
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 pt-1 space-y-3 text-xs">
                        <div className="p-3 bg-gray-50 rounded-lg space-y-1.5 border border-gray-100">
                          <div className="flex justify-between items-baseline">
                            <span className="text-gray-500 text-[11px]">
                              {amortizationType === 'SAC' ? '1ª Parcela (SAC):' : 'Parcela Fixa:'}
                            </span>
                            <span className="font-black text-base text-[#1A3636]">
                              R$ {result.firstInstallment.toLocaleString('pt-BR')}
                            </span>
                          </div>

                          {amortizationType === 'SAC' && (
                            <div className="flex justify-between text-[11px] text-gray-500">
                              <span>Última Parcela:</span>
                              <span className="font-semibold text-emerald-700">
                                R$ {result.lastInstallment.toLocaleString('pt-BR')}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200">
                            <span>Entrada Requerida:</span>
                            <span className="font-semibold text-gray-700">
                              R$ {result.downPayment.toLocaleString('pt-BR')} ({downPercent}%)
                            </span>
                          </div>

                          {fgtsAmount > 0 && (
                            <div className="flex justify-between text-[10px] text-amber-700 bg-amber-50 p-1 rounded">
                              <span>Recurso Próprio (dinheiro):</span>
                              <span className="font-bold">
                                R$ {result.ownFundsCash.toLocaleString('pt-BR')}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between text-[11px] text-gray-500">
                            <span>Saldo Financiado:</span>
                            <span className="font-semibold text-gray-700">
                              R$ {result.financedAmount.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-gray-500 uppercase">
                            Destaques do Banco:
                          </span>
                          <ul className="space-y-0.5 text-[11px] text-gray-600">
                            {bank.features.map((feat, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              handleSelectBankPreset(bank)
                              handleApplyToProposal(bank.name)
                            }}
                            className="w-full bg-[#1A3636] hover:bg-[#254d4d] text-white text-xs font-bold gap-1 shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Usar esta simulação
                            na proposta
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Consórcio Alternative Comparison Banner */}
            <Card className="border border-blue-200 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white">
              <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-white text-[10px] font-bold">
                      Alternativa Inteligente
                    </Badge>
                    <span className="font-bold text-sm text-[#1A3636]">
                      Carta de Crédito de Consórcio Imobiliário
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed max-w-2xl">
                    Se você possui flexibilidade no prazo de mudança ou planeja dar lance com
                    recursos próprios ou FGTS, o consórcio não cobra taxa de juros bancária, apenas
                    taxa de administração ({consorcioFeeAdmin}% total diluída no prazo).
                  </p>
                  <div className="flex flex-wrap gap-4 pt-1 text-gray-700">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Crédito:</span>
                      <strong className="text-blue-900">
                        R$ {consorcioTotalCredit.toLocaleString('pt-BR')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">
                        Parcela Média Estimada:
                      </span>
                      <strong className="text-emerald-700">
                        R$ {Math.round(consorcioMonthlyInstallment).toLocaleString('pt-BR')} /mês
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Custo Total Taxa Adm:</span>
                      <strong className="text-gray-800">
                        R$ {Math.round(consorcioTotalFeeCost).toLocaleString('pt-BR')}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (onApplySimulationToProposal) {
                        onApplySimulationToProposal({
                          propertyValue,
                          downPayment: (propertyValue * downPercent) / 100,
                          financingValue: consorcioTotalCredit,
                          bankName: 'Consórcio Imobiliário Foxter',
                          amortizationType: 'PRICE',
                          termYears: Math.round(consorcioTermMonths / 12),
                          annualRate: 0,
                          monthlyInstallment: Math.round(consorcioMonthlyInstallment),
                          fgtsAmount,
                          consorcioAmount: consorcioTotalCredit,
                        })
                      }
                    }}
                    className="border-blue-300 text-blue-900 hover:bg-blue-100 text-xs font-bold"
                  >
                    Usar Cenário de Consórcio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: MANUAL SIMULATOR WITH DETAILED SLIDERS */}
          <TabsContent value="manual" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sliders Form */}
              <div className="p-5 bg-gray-50/80 rounded-xl border border-gray-200 space-y-5 text-xs">
                <h3 className="font-bold text-sm text-[#1A3636] flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#D4AF37]" /> Parâmetros de Simulação
                </h3>

                {/* Property Value */}
                <div className="space-y-2">
                  <div className="flex justify-between font-semibold">
                    <Label className="text-gray-700">Valor de Avaliação do Imóvel</Label>
                    <span className="text-[#1A3636] font-bold">
                      R$ {propertyValue.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={propertyValue || ''}
                    onChange={(e) => setPropertyValue(Number(e.target.value) || 0)}
                    className="bg-white text-xs font-semibold"
                  />
                </div>

                {/* Down Payment Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-gray-700 font-semibold">
                      Percentual de Entrada: <strong>{downPercent}%</strong>
                    </Label>
                    <span className="text-gray-500 font-medium">
                      R$ {manualResult.downPayment.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <Slider
                    value={[downPercent]}
                    min={10}
                    max={90}
                    step={1}
                    onValueChange={(val) => setDownPercent(val[0])}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Mínimo 10%</span>
                    <span>Recomendado 20-30%</span>
                    <span>Máximo 90%</span>
                  </div>
                </div>

                {/* FGTS Deduction from Down Payment */}
                <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-700 font-semibold flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-[#D4AF37]" /> Usar FGTS na Entrada (R$)
                    </Label>
                    <span className="text-[11px] text-amber-700 font-bold">
                      {fgtsAmount > 0
                        ? `R$ ${fgtsAmount.toLocaleString('pt-BR')}`
                        : 'Nenhum valor informado'}
                    </span>
                  </div>
                  <Input
                    type="number"
                    placeholder="Ex: 50000"
                    value={fgtsAmount || ''}
                    onChange={(e) => setFgtsAmount(Number(e.target.value) || 0)}
                    className="text-xs bg-gray-50"
                  />
                  {fgtsAmount > 0 && (
                    <p className="text-[10px] text-gray-500">
                      Entrada com recursos próprios em espécie:{' '}
                      <strong className="text-emerald-700">
                        R$ {manualResult.ownFundsCash.toLocaleString('pt-BR')}
                      </strong>
                    </p>
                  )}
                </div>

                {/* Term Years Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-gray-700 font-semibold">
                      Prazo do Financiamento: <strong>{termYears} anos</strong> ({termYears * 12}{' '}
                      meses)
                    </Label>
                  </div>
                  <Slider
                    value={[termYears]}
                    min={5}
                    max={35}
                    step={1}
                    onValueChange={(val) => setTermYears(val[0])}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>5 anos (60m)</span>
                    <span>20 anos (240m)</span>
                    <span>35 anos (420m)</span>
                  </div>
                </div>

                {/* Annual Interest Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-gray-700 font-semibold">
                      Taxa de Juros Anual Nominal: <strong>{annualRate}% a.a.</strong>
                    </Label>
                    <span className="text-[11px] text-gray-500">
                      ~{(manualResult.monthlyRate * 100).toFixed(2)}% a.m.
                    </span>
                  </div>
                  <Slider
                    value={[annualRate]}
                    min={7.5}
                    max={14.0}
                    step={0.1}
                    onValueChange={(val) => setAnnualRate(parseFloat(val[0].toFixed(2)))}
                  />
                </div>

                {/* Amortization System */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-gray-700 font-semibold">Sistema de Amortização</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={amortizationType === 'SAC' ? 'default' : 'outline'}
                      onClick={() => setAmortizationType('SAC')}
                      className={`text-xs ${
                        amortizationType === 'SAC' ? 'bg-[#1A3636] text-white' : ''
                      }`}
                    >
                      SAC (Decrescente)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={amortizationType === 'PRICE' ? 'default' : 'outline'}
                      onClick={() => setAmortizationType('PRICE')}
                      className={`text-xs ${
                        amortizationType === 'PRICE' ? 'bg-[#1A3636] text-white' : ''
                      }`}
                    >
                      PRICE (Fixa)
                    </Button>
                  </div>
                </div>
              </div>

              {/* Simulation Result Presentation Card */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="p-5 bg-white rounded-xl border border-gray-200 card-elevated space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-[#1A3636]">Resumo do Financiamento</h3>
                    <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-[10px]">
                      {amortizationType} • {annualRate}% a.a.
                    </Badge>
                  </div>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                        {amortizationType === 'SAC' ? 'Primeira Parcela' : 'Parcela Fixa'}
                      </span>
                      <span className="text-xl font-black text-emerald-900">
                        R$ {manualResult.firstInstallment.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold block">
                        {amortizationType === 'SAC' ? 'Última Parcela' : 'Parcela Média'}
                      </span>
                      <span className="text-lg font-bold text-[#1A3636]">
                        R$ {manualResult.lastInstallment.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Valor do Imóvel:</span>
                      <span className="font-semibold text-gray-900">
                        R$ {manualResult.propertyValue.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Total de Entrada ({downPercent}%):</span>
                      <span className="font-semibold text-gray-900">
                        R$ {manualResult.downPayment.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {fgtsAmount > 0 && (
                      <div className="flex justify-between text-amber-800 bg-amber-50 p-1.5 rounded">
                        <span>• Saldo FGTS aplicado:</span>
                        <span className="font-bold">
                          R$ {manualResult.fgtsUsed.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600">
                      <span>Saldo Total Financiado:</span>
                      <span className="font-semibold text-emerald-700">
                        R$ {manualResult.financedAmount.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Total Estimado de Juros:</span>
                      <span className="font-semibold text-gray-700">
                        R$ {manualResult.totalInterest.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-700 font-bold pt-2 border-t border-gray-200">
                      <span>Total Pago ao Término:</span>
                      <span className="text-[#1A3636]">
                        R$ {manualResult.totalPaid.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Visual Composition Bar */}
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                      Composição do Custo Total
                    </span>
                    <div className="h-4 rounded-full overflow-hidden flex bg-gray-100 border border-gray-200 text-[9px] font-bold text-white text-center leading-4">
                      <div
                        style={{
                          width: `${Math.round(
                            (manualResult.downPayment / manualResult.totalPaid) * 100,
                          )}%`,
                        }}
                        className="bg-[#D4AF37] text-[#1A3636] truncate"
                        title="Entrada"
                      >
                        Entrada
                      </div>
                      <div
                        style={{
                          width: `${Math.round(
                            (manualResult.financedAmount / manualResult.totalPaid) * 100,
                          )}%`,
                        }}
                        className="bg-[#1A3636] truncate"
                        title="Principal Financiado"
                      >
                        Principal
                      </div>
                      <div
                        style={{
                          width: `${Math.round(
                            (manualResult.totalInterest / manualResult.totalPaid) * 100,
                          )}%`,
                        }}
                        className="bg-amber-600 truncate"
                        title="Juros Financiamento"
                      >
                        Juros
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#D4AF37]" /> Entrada
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#1A3636]" /> Principal
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-600" /> Juros
                      </span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <Button
                  onClick={() => handleApplyToProposal()}
                  className="w-full bg-[#1A3636] hover:bg-[#254d4d] text-white font-bold text-xs py-5 gap-2 shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Usar esta simulação na minha
                  proposta comercial
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Legal Disclaimer */}
        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-500 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Aviso de Estimativa e Transparência:</strong> Os valores simulados acima são
            estimativas baseadas nas taxas médias de mercado (SBPE / TR) e servem para planejamento
            financeiro prévio. As condições definitivas, seguros obrigatórios (MIP e DFI) e taxas
            efetivas exatas estão sujeitas à análise de crédito individual e aprovação formal pela
            instituição financeira escolhida. A corretora Vera Lúcia Koren acompanha e assessora
            todo o envio processual para obtenção da melhor condição jurídica e bancária em Porto
            Alegre.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
