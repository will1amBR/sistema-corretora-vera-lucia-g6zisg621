import React from 'react'
import {
  CalendarDays,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  PenTool,
  PartyPopper,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Info,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { NegotiationStage, ProposalStatus } from '@/types'

export interface StageDefinition {
  key: NegotiationStage
  order: number
  title: string
  shortTitle: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  clientTip: string
  estimatedDuration: string
  remainingBusinessDays: number
  whatHappensNow: string
}

export const NEGOTIATION_STAGES: StageDefinition[] = [
  {
    key: 'visita_realizada',
    order: 1,
    title: '1. Visita Realizada',
    shortTitle: 'Visita',
    description: 'Imóvel visitado presencialmente com Vera Lúcia Koren, ficha técnica conferida.',
    icon: CalendarDays,
    clientTip:
      'Você avaliou os detalhes construtivos, incidência solar e vizinhança em Porto Alegre.',
    estimatedDuration: 'Concluído',
    remainingBusinessDays: 25,
    whatHappensNow:
      'A corretora estruturou as opções e você já pode formalizar sua proposta de compra.',
  },
  {
    key: 'proposta_enviada',
    order: 2,
    title: '2. Proposta Enviada',
    shortTitle: 'Proposta',
    description: 'Condições de pagamento, valor ofertado e percentual de entrada formulados.',
    icon: FileText,
    clientTip: 'Aguarde a apresentação dos termos ao proprietário vendedor pela corretora.',
    estimatedDuration: '1 a 2 dias úteis',
    remainingBusinessDays: 24,
    whatHappensNow:
      'A Vera Koren apresenta seus termos ao proprietário com argumentos de mercado para defender sua oferta.',
  },
  {
    key: 'proposta_em_analise',
    order: 3,
    title: '3. Proposta em Análise',
    shortTitle: 'Em Análise',
    description:
      'Proprietário vendedor está avaliando o valor, prazos e condições comerciais propostas.',
    icon: Clock,
    clientTip:
      'Vera está negociando os melhores termos com foco em fechar o melhor negócio para você.',
    estimatedDuration: '24h a 48h',
    remainingBusinessDays: 22,
    whatHappensNow:
      'Estamos alinhando o fechamento do preço e forma de pagamento com o proprietário vendedor.',
  },
  {
    key: 'proposta_aprovada',
    order: 4,
    title: '4. Proposta Aprovada',
    shortTitle: 'Aprovada',
    description: 'Valores e prazos alinhados e aceitos entre as partes. Início da fase documental.',
    icon: CheckCircle2,
    clientTip: 'Parabéns! O valor foi acordado. Agora precisamos enviar seus documentos.',
    estimatedDuration: 'Imediato',
    remainingBusinessDays: 20,
    whatHappensNow:
      'O imóvel está reservado para você! Próximo passo: envio dos documentos no cofre digital.',
  },
  {
    key: 'documentacao',
    order: 5,
    title: '5. Envio de Documentos',
    shortTitle: 'Documentos',
    description:
      'Conferência de documentos pessoais, certidões negativas e comprovantes pelo cofre seguro.',
    icon: FileCheck,
    clientTip: 'Tire fotos nítidas ou suba os PDFs pelo Cofre de Documentos abaixo.',
    estimatedDuration: '2 a 5 dias úteis',
    remainingBusinessDays: 18,
    whatHappensNow:
      'Assim que você envia cada documento, a Vera confere a nitidez e submete ao correspondente bancário.',
  },
  {
    key: 'analise_credito',
    order: 6,
    title: '6. Análise de Crédito / Engenharia',
    shortTitle: 'Crédito',
    description:
      'Validação no banco escolhido, vistoria de engenharia e emissão do laudo de avaliação.',
    icon: ShieldCheck,
    clientTip: 'Acompanhamos diretamente o correspondente bancário para agilizar o parecer.',
    estimatedDuration: '7 a 15 dias úteis',
    remainingBusinessDays: 12,
    whatHappensNow:
      'O banco faz a vistoria técnica no imóvel e emite o parecer definitivo da aprovação do financiamento.',
  },
  {
    key: 'contrato_assinado',
    order: 7,
    title: '7. Minuta e Assinatura',
    shortTitle: 'Contrato',
    description:
      'Assinatura do Compromisso de Compra e Venda / Contrato de Financiamento Bancário.',
    icon: PenTool,
    clientTip: 'Você assina o contrato e realizamos o pagamento da entrada e recolhimento de ITBI.',
    estimatedDuration: '3 a 7 dias úteis',
    remainingBusinessDays: 5,
    whatHappensNow:
      'Revisão final da minuta jurídica e agendamento da assinatura oficial com as partes.',
  },
  {
    key: 'concluido',
    order: 8,
    title: '8. Registro & Entrega de Chaves',
    shortTitle: 'Chaves na Mão',
    description: 'Escritura pública lavrada no Cartório de Registro de Imóveis e chaves entregues!',
    icon: PartyPopper,
    clientTip: 'Momento de celebrar sua conquista com toda a segurança jurídica.',
    estimatedDuration: 'Conclusão',
    remainingBusinessDays: 0,
    whatHappensNow:
      'A escritura é registrada e as chaves do seu novo lar em Porto Alegre são entregues!',
  },
]
// Fallback logic to infer stage if proposal status is used
export function inferStageFromProposal(
  proposalStatus?: ProposalStatus,
  explicitStage?: NegotiationStage,
): NegotiationStage {
  if (explicitStage) return explicitStage
  if (!proposalStatus) return 'visita_realizada'

  switch (proposalStatus) {
    case 'drafted':
      return 'proposta_enviada'
    case 'sent':
      return 'proposta_em_analise'
    case 'counter_sent':
      return 'proposta_em_analise'
    case 'docs_pending':
      return 'documentacao'
    case 'under_review':
      return 'analise_credito'
    case 'accepted':
      return 'contrato_assinado'
    case 'rejected':
      return 'proposta_em_analise'
    default:
      return 'proposta_enviada'
  }
}

interface NegotiationTimelineProps {
  currentStage?: NegotiationStage
  proposalStatus?: ProposalStatus
  lastUpdatedDate?: string
  propertyTitle?: string
}

export function NegotiationTimeline({
  currentStage,
  proposalStatus,
  lastUpdatedDate,
  propertyTitle,
}: NegotiationTimelineProps) {
  const activeStageKey = inferStageFromProposal(proposalStatus, currentStage)
  const currentStageObj =
    NEGOTIATION_STAGES.find((s) => s.key === activeStageKey) || NEGOTIATION_STAGES[0]
  const currentOrder = currentStageObj.order
  const percentComplete = Math.round((currentOrder / NEGOTIATION_STAGES.length) * 100)

  return (
    <Card className="card-elevated border-t-4 border-t-[#1A3636] overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-[#D4AF37] rounded-sm" />
              <h3 className="font-bold text-base sm:text-lg text-[#1A3636]">
                Linha do Tempo da Negociação Imobiliária
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Etapa atual:{' '}
              <strong className="text-[#1A3636] font-bold">{currentStageObj.title}</strong>
              {propertyTitle ? ` • ${propertyTitle}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-[#1A3636] text-[#D4AF37] font-bold text-xs py-1 px-3 border-none">
              Progresso: {percentComplete}%
            </Badge>
          </div>
        </div>

        {/* Horizontal Desktop Timeline (Scrollable on tablet/desktop) */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Background connecting bar */}
            <div className="absolute top-5 left-6 right-6 h-1 bg-gray-200 -z-0 rounded-full" />
            {/* Progress filled bar */}
            <div
              className="absolute top-5 left-6 h-1 bg-gradient-to-r from-[#1A3636] via-[#244848] to-[#D4AF37] -z-0 rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(
                  0,
                  ((currentOrder - 1) / (NEGOTIATION_STAGES.length - 1)) * 100,
                )}%`,
              }}
            />

            <div className="grid grid-cols-8 gap-2 relative z-10">
              {NEGOTIATION_STAGES.map((stage) => {
                const Icon = stage.icon
                const isPassed = stage.order < currentOrder
                const isCurrent = stage.order === currentOrder
                const isUpcoming = stage.order > currentOrder

                return (
                  <div
                    key={stage.key}
                    className="flex flex-col items-center text-center group cursor-default"
                  >
                    {/* Circle Node */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-xs ${
                        isCurrent
                          ? 'bg-[#1A3636] text-[#D4AF37] ring-4 ring-[#D4AF37]/40 scale-110'
                          : isPassed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-gray-400 border-2 border-gray-300'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>

                    {/* Stage Label */}
                    <span
                      className={`mt-2 text-[11px] font-bold leading-tight ${
                        isCurrent
                          ? 'text-[#1A3636]'
                          : isPassed
                            ? 'text-emerald-700'
                            : 'text-gray-400'
                      }`}
                    >
                      {stage.shortTitle}
                    </span>

                    <span className="text-[9px] text-gray-400 mt-0.5">
                      {isPassed ? 'Concluído' : isCurrent ? 'Em Andamento' : 'Próxima'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mobile Vertical Stepper View */}
        <div className="block md:hidden space-y-3">
          {NEGOTIATION_STAGES.map((stage) => {
            const Icon = stage.icon
            const isPassed = stage.order < currentOrder
            const isCurrent = stage.order === currentOrder
            const isUpcoming = stage.order > currentOrder

            return (
              <div
                key={stage.key}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  isCurrent
                    ? 'bg-amber-50/50 border-[#D4AF37] shadow-xs'
                    : isPassed
                      ? 'bg-white border-emerald-200'
                      : 'bg-gray-50/60 border-gray-200 opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-[#1A3636] text-[#D4AF37] ring-2 ring-[#D4AF37]'
                      : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-[#1A3636]'
                          : isPassed
                            ? 'text-emerald-800'
                            : 'text-gray-600'
                      }`}
                    >
                      {stage.title}
                    </h4>
                    {isCurrent && (
                      <Badge className="bg-[#D4AF37] text-[#1A3636] text-[9px] font-bold uppercase">
                        Atual
                      </Badge>
                    )}
                    {isPassed && (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        ✓ Concluído
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                    {stage.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Current Active Stage Focus Card & What happens now */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 via-amber-50/20 to-white border border-[#D4AF37]/50 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#1A3636] text-[#D4AF37] text-[10px] font-bold">
                Foco do Momento
              </Badge>
              <span className="text-xs font-bold text-[#1A3636]">{currentStageObj.title}</span>
            </div>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              {currentStageObj.clientTip}
            </p>
            <div className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap pt-1 border-t border-gray-200/60">
              <span>
                Prazo nesta etapa: <strong>{currentStageObj.estimatedDuration}</strong>
              </span>
              {currentStageObj.remainingBusinessDays > 0 ? (
                <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Faltam ~{currentStageObj.remainingBusinessDays} dias úteis até a conclusão
                </span>
              ) : null}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/50 to-white border border-emerald-200/70 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-700 text-white text-[10px] font-bold">
                O que acontece agora
              </Badge>
              <span className="text-xs font-bold text-[#1A3636]">Transparência Total</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              {currentStageObj.whatHappensNow}
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-[#1A3636] font-semibold border-t border-emerald-100">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Acompanhado por Vera Koren
              </span>
              <span className="text-gray-500 font-mono">(51) 99132-7636</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
