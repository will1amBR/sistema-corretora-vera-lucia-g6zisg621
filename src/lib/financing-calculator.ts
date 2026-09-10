export interface BankScenario {
  id: string
  name: string
  shortName: string
  logoText: string
  annualRate: number // ex: 9.99 (% a.a.)
  minDownPaymentPercent: number // ex: 20 (%)
  maxTermYears: number // ex: 35
  colorBadge: string
  features: string[]
  recommended?: boolean
  description: string
}

export const BANK_SCENARIOS: BankScenario[] = [
  {
    id: 'caixa',
    name: 'Caixa Econômica Federal',
    shortName: 'Caixa',
    logoText: 'CX',
    annualRate: 9.49,
    minDownPaymentPercent: 20,
    maxTermYears: 35,
    colorBadge: 'bg-blue-600 text-white',
    features: ['Melhor taxa para uso de FGTS', 'Linha SBPE e SBPE TR', 'Prazo de até 420 meses'],
    recommended: true,
    description:
      'Tradicionalmente as taxas nominais mais competitivas do mercado com funding de poupança/FGTS.',
  },
  {
    id: 'itau',
    name: 'Itaú Unibanco',
    shortName: 'Itaú',
    logoText: 'IT',
    annualRate: 10.19,
    minDownPaymentPercent: 20,
    maxTermYears: 30,
    colorBadge: 'bg-orange-500 text-white',
    features: [
      'Aprovação digital em até 1h',
      'Avaliação rápida de engenharia',
      'Pula parcela 1x ao ano',
    ],
    description: 'Processo ágil 100% digital com canal consultivo direto da Foxter/Vera Koren.',
  },
  {
    id: 'bradesco',
    name: 'Bradesco Prime',
    shortName: 'Bradesco',
    logoText: 'BD',
    annualRate: 10.29,
    minDownPaymentPercent: 20,
    maxTermYears: 30,
    colorBadge: 'bg-red-600 text-white',
    features: [
      'Financia até 80% do valor de avaliação',
      'Isenção de tarifas para Prime',
      'Aceita composição de renda familiar',
    ],
    description:
      'Excelente flexibilidade para composição de renda entre cônjuges ou parentes de 1º grau.',
  },
  {
    id: 'santander',
    name: 'Santander Select',
    shortName: 'Santander',
    logoText: 'SAN',
    annualRate: 10.49,
    minDownPaymentPercent: 20,
    maxTermYears: 35,
    colorBadge: 'bg-red-700 text-white',
    features: [
      'Opção de carência inicial de até 6 meses',
      'Financiamento de despesas de cartório/ITBI',
      'Pontos no cartão',
    ],
    description: 'Permite embutir ITBI e despesas cartorárias de Porto Alegre no saldo financiado.',
  },
  {
    id: 'bb',
    name: 'Banco do Brasil',
    shortName: 'BB',
    logoText: 'BB',
    annualRate: 9.89,
    minDownPaymentPercent: 20,
    maxTermYears: 35,
    colorBadge: 'bg-amber-400 text-blue-950 font-bold',
    features: [
      'Condições especiais para correntistas/servidores',
      'Menor custo efetivo total com relacionamento',
      'Amortização simplificada pelo App',
    ],
    description:
      'Descontos progressivos na taxa a partir do pacote de relacionamento e previdência.',
  },
]

export interface SimulationResult {
  propertyValue: number
  downPayment: number
  downPaymentPercent: number
  financedAmount: number
  termYears: number
  termMonths: number
  annualRate: number
  monthlyRate: number
  amortizationType: 'SAC' | 'PRICE'
  firstInstallment: number
  lastInstallment: number
  averageInstallment: number
  totalPaid: number
  totalInterest: number
  fgtsUsed: number
  ownFundsCash: number
}

/**
 * Calculates manual financing details for SAC or PRICE
 */
export function calculateFinancing(params: {
  propertyValue: number
  downPaymentPercent: number
  termYears: number
  annualRate: number
  amortizationType: 'SAC' | 'PRICE'
  fgtsAmount?: number
}): SimulationResult {
  const { propertyValue, downPaymentPercent, termYears, annualRate, amortizationType } = params
  const fgtsAmount = Math.max(0, params.fgtsAmount || 0)

  const totalDownPayment = (propertyValue * downPaymentPercent) / 100
  // Own funds is down payment minus FGTS
  const ownFundsCash = Math.max(0, totalDownPayment - fgtsAmount)
  const financedAmount = Math.max(0, propertyValue - totalDownPayment)

  const termMonths = termYears * 12
  // Monthly interest rate from annual rate: (1 + i_annual)^(1/12) - 1
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1

  let firstInstallment = 0
  let lastInstallment = 0
  let averageInstallment = 0
  let totalPaid = 0
  let totalInterest = 0

  if (financedAmount <= 0 || termMonths <= 0) {
    return {
      propertyValue,
      downPayment: totalDownPayment,
      downPaymentPercent,
      financedAmount: 0,
      termYears,
      termMonths,
      annualRate,
      monthlyRate,
      amortizationType,
      firstInstallment: 0,
      lastInstallment: 0,
      averageInstallment: 0,
      totalPaid: totalDownPayment,
      totalInterest: 0,
      fgtsUsed: Math.min(fgtsAmount, totalDownPayment),
      ownFundsCash,
    }
  }

  if (amortizationType === 'SAC') {
    // Constant amortization per month: A = PV / n
    const monthlyAmortization = financedAmount / termMonths
    // Month 1 interest = PV * i
    firstInstallment = monthlyAmortization + financedAmount * monthlyRate
    // Last month interest = monthlyAmortization * i
    lastInstallment = monthlyAmortization + monthlyAmortization * monthlyRate

    // In SAC, installments form an arithmetic progression
    averageInstallment = (firstInstallment + lastInstallment) / 2
    const totalFinancingPaid = averageInstallment * termMonths
    totalInterest = totalFinancingPaid - financedAmount
    totalPaid = totalDownPayment + totalFinancingPaid
  } else {
    // PRICE (Tabela Francesa) - constant payments
    // PMT = PV * [ i*(1+i)^n / ((1+i)^n - 1) ]
    const factor = Math.pow(1 + monthlyRate, termMonths)
    const pmt = financedAmount * ((monthlyRate * factor) / (factor - 1))
    firstInstallment = pmt
    lastInstallment = pmt
    averageInstallment = pmt
    const totalFinancingPaid = pmt * termMonths
    totalInterest = totalFinancingPaid - financedAmount
    totalPaid = totalDownPayment + totalFinancingPaid
  }

  return {
    propertyValue,
    downPayment: totalDownPayment,
    downPaymentPercent,
    financedAmount,
    termYears,
    termMonths,
    annualRate,
    monthlyRate,
    amortizationType,
    firstInstallment: Math.round(firstInstallment),
    lastInstallment: Math.round(lastInstallment),
    averageInstallment: Math.round(averageInstallment),
    totalPaid: Math.round(totalPaid),
    totalInterest: Math.round(totalInterest),
    fgtsUsed: Math.min(fgtsAmount, totalDownPayment),
    ownFundsCash: Math.round(ownFundsCash),
  }
}
