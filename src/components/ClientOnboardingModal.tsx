import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Phone,
  MessageCircle,
  X,
  Lock,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { getWhatsAppUrl, BROKER_PHONE_DISPLAY } from '@/components/FloatingWhatsApp'

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
    title: 'Bem-vindo ao Portal Exclusivo do Cliente',
    tagline: 'Transparência, agilidade e segurança jurídica com a Vera Lúcia Koren',
    description:
      'Criamos este ambiente digital para que você acompanhe cada etapa da sua negociação imobiliária em Porto Alegre, desde a visita até a entrega das chaves.',
    icon: Sparkles,
    points: [
      'Ambiente 100% criptografado e privativo para seus dados',
      'Acesso direto à proposta comercial aprovada com a corretora',
      'Envio facilitado de documentos para agilizar o financiamento bancário',
    ],
  },
  {
    id: 'agendar',
    title: '1. Agendamento e Visita Presencial',
    tagline: 'Escolha os melhores dias e horários com facilidade',
    description:
      'Você pode solicitar visitas a qualquer momento pelo site oficial ou diretamente com a Vera. As visitas são confirmadas e sincronizadas na agenda oficial.',
    icon: CalendarDays,
    points: [
      'Escolha de data e turno (manhã, tarde ou final de tarde)',
      'Acompanhamento presencial exclusivo pela corretora Vera Lúcia Koren',
      'Orientação sobre detalhes construtivos, incidência solar e vizinhança',
    ],
  },
  {
    id: 'proposta',
    title: '2. Acompanhamento da Proposta Comercial',
    tagline: 'Clareza em valores, entrada e financiamento',
    description:
      'Aqui no portal você visualiza o valor formal negociado, entrada/sinal, percentual de financiamento no seu banco de preferência (Itaú, Bradesco, Santander, Caixa) ou permuta.',
    icon: FileCheck2,
    points: [
      'Detalhamento das condições e prazos combinados',
      'Histórico de status: Aguardando Documentos, Em Análise ou Aceita',
      'Suporte consultivo para encontrar as menores taxas de juros',
    ],
  },
  {
    id: 'documentos',
    title: '3. Envio Ágil de Documentos (Cofre Seguro)',
    tagline: 'Envie fotos pelo celular ou arquivos PDF com segurança',
    description:
      'Tire uma foto ou anexe seus comprovantes (RG, CPF, Comprovante de Renda, FGTS) direto pelo celular ou computador. A Vera fará a conferência para dar entrada imediata no banco ou cartório.',
    icon: UploadCloud,
    points: [
      'Aceita fotos nítidas (JPEG/PNG) e arquivos em PDF',
      'Confirmação visual instantânea do status de cada documento',
      'Sem necessidade de deslocamento ou cópias físicas antecipadas',
    ],
  },
  {
    id: 'suporte',
    title: '4. Atendimento Direto e Pós-Venda',
    tagline: 'Apoio contínuo até o registro e entrega das chaves',
    description:
      'A Vera Lúcia Koren acompanha a minuta do contrato, quitação de ITBI, certidões negativas e registro de imóveis em Porto Alegre, garantindo total tranquilidade.',
    icon: ShieldCheck,
    points: [
      'Contato direto no WhatsApp: (51) 99132-7636',
      'CRECI 38415 com mais de 12 anos de experiência consolidada na Foxter',
      'Suporte do início ao término de todo o processo patrimonial',
    ],
  },
]

const STORAGE_KEY_CLIENT = 'vera_client_onboarding_completed_v1'

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
              Guia do Cliente
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
            <span>{current.tagline}</span>
            <span className="text-[11px] text-[#D4AF37] font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/10 h-1 rounded-full mt-1 overflow-hidden">
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
              Como Funciona:
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
            Entendido
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
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Acessar Meu Portal
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
