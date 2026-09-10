import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Calculator,
  Clock,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

export interface ClientStep {
  id: string
  title: string
  tagline: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  points: string[]
  actionLabel?: string
  actionUrl?: string
}

const CLIENT_ONBOARDING_STEPS: ClientStep[] = [
  {
    id: 'bem-vindo',
    title: 'Bem-vindo à Sua Área Exclusiva de Negociação',
    tagline: 'Transparência, simulação inteligente e segurança jurídica com a Vera Lúcia Koren',
    description:
      'Criamos este ambiente digital completo para você acompanhar cada etapa da aquisição do seu imóvel em Porto Alegre: desde a visita, envio e ajuste da proposta, envio de documentos e simulação bancária.',
    icon: Sparkles,
    points: [
      'Linha do tempo visual com todas as etapas da sua negociação',
      'Envio e edição direta de propostas comerciais personalizadas',
      'Cofre seguro com checklist adaptável por modalidade de compra',
      'Simulador de financiamento manual e comparativo com taxas de bancos reais',
    ],
  },
  {
    id: 'timeline',
    title: '1. Status e Linha do Tempo da Negociação',
    tagline: 'Acompanhe exatamente em qual etapa seu processo se encontra',
    description:
      'Veja o progresso em tempo real das 8 etapas fundamentais: Visita realizada → Proposta enviada → Em análise → Proposta aprovada → Documentação → Análise de crédito → Contrato assinado → Chaves na mão.',
    icon: Clock,
    points: [
      'Destaque claro da fase atual com prazos estimados em dias úteis',
      'Dicas práticas da Vera Lúcia sobre o que esperar de cada momento',
      'Histórico de contrapropostas e recados da corretora',
    ],
  },
  {
    id: 'proposta',
    title: '2. Envio e Ajuste de Propostas Comerciais',
    tagline: 'Defina seu valor de compra, sinal e forma de pagamento',
    description:
      'Você pode estruturar uma proposta formal escolhendo a forma de pagamento (À vista, Financiamento Bancário, FGTS, Consórcio ou Permuta), definindo a entrada e banco de sua preferência.',
    icon: FileCheck2,
    points: [
      'Cálculo automático de saldo devedor e percentuais de entrada',
      'Inclusão de condições especiais como prazos de mudança e mobília fixa',
      'Registro seguro no sistema com notificação imediata à corretora',
    ],
  },
  {
    id: 'simulador',
    title: '3. Simulador de Financiamento Manual e Automático',
    tagline: 'Compare taxas da Caixa, Itaú, Bradesco, Santander e Banco do Brasil',
    description:
      'Calcule com precisão a parcela inicial e final pelos sistemas SAC e PRICE. Ajuste sliders de entrada e anos, use saldo do FGTS ou avalie a alternativa com carta de consórcio.',
    icon: Calculator,
    points: [
      'Comparativo automático destacando a menor parcela entre os bancos',
      'Botão "Usar esta simulação na minha proposta" para transferir os valores num clique',
      'Aviso de taxas e suporte consultivo para análise de crédito',
    ],
  },
  {
    id: 'documentos',
    title: '4. Cofre de Documentos Criptografado',
    tagline: 'Checklist personalizado para sua modalidade de compra',
    description:
      'Envie fotos pelo celular ou arquivos em PDF dos documentos solicitados (RG/CNH, comprovante de renda, residência, FGTS). Acompanhe o status: pendente, em análise, aprovado ou ajustes solicitados.',
    icon: UploadCloud,
    points: [
      'Checklist inteligente: à vista exige menos documentos que financiamento',
      'Suporte a drag-and-drop e visualização rápida do documento enviado',
      'Barra de progresso de conclusão da documentação para agilizar a engenharia',
    ],
  },
  {
    id: 'suporte',
    title: '5. Atendimento Exclusivo da Vera Lúcia Koren',
    tagline: 'Assessoria jurídica e imobiliária completa em Porto Alegre',
    description:
      'A corretora Vera Lúcia Koren (CRECI 38415 - Foxter) acompanha você desde a visita até a lavratura da escritura pública e entrega solene das chaves.',
    icon: ShieldCheck,
    points: [
      'Canal direto no WhatsApp com um clique no portal: (51) 99132-7636',
      'Mais de 12 anos de reputação e credibilidade no mercado imobiliário gaúcho',
      'Segurança total nas minutas, vistorias e conferência de certidões',
    ],
  },
]

const STORAGE_KEY_CLIENT = 'vera_client_onboarding_portal_v2'

interface ClientOnboardingModalProps {
  forceOpen?: boolean
  onCloseManual?: () => void
}

export function ClientOnboardingModal({
  forceOpen = false,
  onCloseManual,
}: ClientOnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true)
      return
    }
    const hasSeen = localStorage.getItem(STORAGE_KEY_CLIENT)
    if (!hasSeen) {
      setIsOpen(true)
    }
  }, [forceOpen])

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY_CLIENT, 'true')
    setIsOpen(false)
    if (onCloseManual) onCloseManual()
  }

  const handleNext = () => {
    if (stepIdx < CLIENT_ONBOARDING_STEPS.length - 1) {
      setStepIdx(stepIdx + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (stepIdx > 0) {
      setStepIdx(stepIdx - 1)
    }
  }

  const current = CLIENT_ONBOARDING_STEPS[stepIdx]
  const Icon = current.icon
  const progressPercent = Math.round(((stepIdx + 1) / CLIENT_ONBOARDING_STEPS.length) * 100)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-[#D4AF37]/40 bg-white shadow-2xl rounded-2xl animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A3636] via-[#244848] to-[#142A2A] text-white p-6 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-xs border-none">
              Guia da Área do Cliente
            </Badge>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Fechar guia"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 pr-16">
            <div className="w-11 h-11 rounded-xl bg-[#D4AF37] text-[#1A3636] flex items-center justify-center shadow-md shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
                Passo {stepIdx + 1} de {CLIENT_ONBOARDING_STEPS.length}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                {current.title}
              </h2>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
            <span className="truncate max-w-[320px]">{current.tagline}</span>
            <span className="text-[11px] text-[#D4AF37] font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-[#D4AF37] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm text-gray-700 max-h-[55vh] overflow-y-auto">
          <p className="text-sm leading-relaxed text-gray-800">{current.description}</p>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
            <span className="text-xs font-bold text-[#1A3636] uppercase tracking-wider block mb-1">
              Recursos Disponíveis:
            </span>
            <ul className="space-y-2 text-xs text-gray-600">
              {current.points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            Pular Tutorial
          </Button>

          <div className="flex items-center gap-2">
            {stepIdx > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="text-xs text-[#1A3636] border-gray-300"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleNext}
              className="bg-[#1A3636] text-white hover:bg-[#254d4d] text-xs font-bold px-4 gap-1.5 shadow-md"
            >
              {stepIdx === CLIENT_ONBOARDING_STEPS.length - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Explorar Meu Portal
                </>
              ) : (
                <>
                  Próximo <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
