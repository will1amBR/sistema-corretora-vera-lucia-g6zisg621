import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Bot,
  ShieldAlert,
  FileCheck2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  X,
  Compass,
} from 'lucide-react'

export interface TourStep {
  id: string
  title: string
  subtitle: string
  description: string
  targetPath: string
  icon: React.ComponentType<{ className?: string }>
  tips: string[]
  badgeText: string
}

export const VERA_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vinda ao seu Painel de Gestão, Vera!',
    subtitle: 'Sua central completa de inteligência imobiliária',
    description:
      'Aqui você tem uma visão unificada dos seus leads, funil de vendas, imóveis exclusivos, agenda de visitas sincronizada com o Google Calendar e suporte com inteligência artificial.',
    targetPath: '/dashboard',
    icon: Sparkles,
    badgeText: 'Visão Geral',
    tips: [
      'Acompanhe KPIs de conversão em tempo real',
      'Visualize o status da sua sincronização de agenda',
      'Receba insights diários gerados pela Vera AI',
    ],
  },
  {
    id: 'dashboard',
    title: '1. Dashboard & Indicadores Estratégicos',
    subtitle: 'Controle rápido de todo o negócio',
    description:
      'Veja o total de leads aquecidos, propostas em análise, volume de imóveis disponíveis e o funil simplificado. Você também pode sincronizar sua conta do Google Calendar com apenas 1 clique.',
    targetPath: '/dashboard',
    icon: LayoutDashboard,
    badgeText: 'Módulo Dashboard',
    tips: [
      'Cards interativos para avançar leads no funil',
      'Acesso direto às próximas visitas do dia',
      'Feed de recomendações personalizadas da IA',
    ],
  },
  {
    id: 'crm',
    title: '2. CRM & Composição Financeira de Compra',
    subtitle: 'Gestão minuciosa de cada comprador e vendedor',
    description:
      'Cadastre leads com percentuais exatos de compra: à vista, financiamento (Itaú, Bradesco, Caixa, etc.), FGTS ou permuta. Crie e envie propostas comerciais formais diretamente para o portal do cliente.',
    targetPath: '/crm',
    icon: Users,
    badgeText: 'Módulo CRM',
    tips: [
      'Definição da modalidade de compra (% à vista, % banco, % permuta)',
      'Registro de objetivos de busca e objeções levantadas',
      'Botão rápido "Criar Proposta" para gerar link do portal do cliente',
    ],
  },
  {
    id: 'imoveis',
    title: '3. Catálogo & Portfólio de Imóveis',
    subtitle: 'Exclusividade nos melhores bairros de Porto Alegre',
    description:
      'Cadastre e edite coberturas, apartamentos e casas nos bairros Moinhos de Vento, Bela Vista, Petrópolis, Três Figueiras e região. Suporta galeria de fotos, métricas completas e status de disponibilidade.',
    targetPath: '/imoveis',
    icon: Building2,
    badgeText: 'Catálogo',
    tips: [
      'Filtro rápido por modalidade (Venda, Financiamento, Permuta)',
      'Abertura do modal detalhado com visualização rica de fotos',
      'Botão direto para compartilhar o imóvel no WhatsApp',
    ],
  },
  {
    id: 'admin_imoveis',
    title: '3.1 Área Administrativa de Imóveis',
    subtitle: 'Cadastro completo, upload de fotos e gestão de status',
    description:
      'Área dedicada para a Vera cadastrar novos imóveis com formulário completo, enviar fotos em lote, escolher a foto de capa e alterar status entre disponível, reservado ou vendido.',
    targetPath: '/admin/imoveis',
    icon: Building2,
    badgeText: 'Admin Imóveis',
    tips: [
      'Upload múltiplo de imagens e definição da foto de capa',
      'Edição rápida e ações em lote para alterar disponibilidade',
      'Controle de valores, modalidades e comodidades de lazer',
    ],
  },
  {
    id: 'agenda',
    title: '4. Agenda & Sincronização Google Calendar',
    subtitle: 'Pontualidade e controle de visitas',
    description:
      'Agende visitas presenciais vinculando o cliente e o imóvel. A integração com o Google Calendar mantém seus lembretes e horários sempre atualizados no celular.',
    targetPath: '/agenda',
    icon: CalendarDays,
    badgeText: 'Módulo Agenda',
    tips: [
      'Visitas solicitadas pelo site caem automaticamente aqui',
      'Adicione notas de logística de acesso e chaves da portaria',
      'Confirmação com link de WhatsApp para o cliente',
    ],
  },
  {
    id: 'assistente',
    title: '5. Vera AI — Sua Copiloto de Vendas',
    subtitle: 'Inteligência conectada ao seu portfólio',
    description:
      'Pergunte à Vera AI sobre contornos de objeções difíceis, cruze perfis de clientes com imóveis disponíveis e receba roteiros persuasivos para reuniões e negociações de fechamento.',
    targetPath: '/assistente-ia',
    icon: Bot,
    badgeText: 'Módulo IA',
    tips: [
      'Sugestões de prompts rápidos para respostas instantâneas',
      'Argumentos para negociações de juros bancários e permuta',
      'Roteiros de apresentação de imóveis de alto padrão',
    ],
  },
  {
    id: 'objecoes',
    title: '6. Base de Objeções Persuasivas',
    subtitle: 'Conhecimento prático para contornar qualquer dúvida',
    description:
      'Biblioteca estruturada de argumentos para lidar com preço, juros bancários, reformas e momento de mercado. Você pode enriquecer a base sempre que aprender uma nova abordagem de sucesso.',
    targetPath: '/objecoes',
    icon: ShieldAlert,
    badgeText: 'Base de Conhecimento',
    tips: [
      'Classificação por categoria (preço, juros, permuta, reforma)',
      'Táticas-chave em formato de tópicos objetivos',
      'Alimenta o cérebro da Vera AI automaticamente',
    ],
  },
  {
    id: 'propostas',
    title: '7. Propostas & Cofre de Documentos',
    subtitle: 'Acompanhamento seguro até o cartório',
    description:
      'Gerencie as propostas emitidas, termos negociados e aprove os documentos enviados pelos clientes (RG, Comprovante de Renda, FGTS) para dar entrada ágil no financiamento bancário.',
    targetPath: '/propostas',
    icon: FileCheck2,
    badgeText: 'Módulo Propostas',
    tips: [
      'Status visual: Aguardando Documentos, Em Análise, Aceita',
      'Aprovação ou solicitação de reenvio de arquivos com 1 clique',
      'Download seguro dos anexos para envio ao banco correspondente',
    ],
  },
]

const STORAGE_KEY = 'vera_broker_onboarding_completed_v1'

interface BrokerOnboardingModalProps {
  forceOpen?: boolean
  onCloseManual?: () => void
}

export function BrokerOnboardingModal({
  forceOpen = false,
  onCloseManual,
}: BrokerOnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true)
      return
    }
    const hasSeen = localStorage.getItem(STORAGE_KEY)
    if (!hasSeen) {
      // Auto-open for first-time visitors in management area
      const isPublic = location.pathname === '/' || location.pathname === '/agendar'
      if (!isPublic) {
        setIsOpen(true)
      }
    }
  }, [forceOpen, location.pathname])

  const currentStep = VERA_TOUR_STEPS[currentStepIndex]
  const progressPercent = Math.round(((currentStepIndex + 1) / VERA_TOUR_STEPS.length) * 100)

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsOpen(false)
    if (onCloseManual) onCloseManual()
  }

  const handleNext = () => {
    if (currentStepIndex < VERA_TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1
      setCurrentStepIndex(nextIdx)
      const nextStep = VERA_TOUR_STEPS[nextIdx]
      // navigate optionally if user wants to follow along
      if (nextStep.targetPath && location.pathname !== nextStep.targetPath) {
        navigate(nextStep.targetPath)
      }
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1
      setCurrentStepIndex(prevIdx)
      const prevStep = VERA_TOUR_STEPS[prevIdx]
      if (prevStep.targetPath && location.pathname !== prevStep.targetPath) {
        navigate(prevStep.targetPath)
      }
    }
  }

  const handleNavigateDirect = (idx: number) => {
    setCurrentStepIndex(idx)
    const step = VERA_TOUR_STEPS[idx]
    if (step.targetPath && location.pathname !== step.targetPath) {
      navigate(step.targetPath)
    }
  }

  const StepIcon = currentStep.icon

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-[#D4AF37]/40 bg-white shadow-2xl rounded-2xl animate-scale-up">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#1A3636] via-[#244848] to-[#142A2A] text-white p-6 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-xs border-none">
              Tour Guiado
            </Badge>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Fechar tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 pr-20">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] text-[#1A3636] flex items-center justify-center shadow-lg shrink-0">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#D4AF37]">
                {currentStep.badgeText} • Passo {currentStepIndex + 1} de {VERA_TOUR_STEPS.length}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {currentStep.title}
              </h2>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/75">
            <span>Progresso do tour: {progressPercent}%</span>
            <span className="text-[11px] text-[#D4AF37] font-medium">{currentStep.subtitle}</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#D4AF37] to-amber-300 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm text-gray-700 max-h-[60vh] overflow-y-auto">
          <p className="text-sm sm:text-base leading-relaxed text-gray-800 font-normal">
            {currentStep.description}
          </p>

          {/* Key Tips Box */}
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-xs text-[#1A3636] uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Destaques & Como Usar:
            </div>
            <ul className="space-y-2 text-xs text-gray-700">
              {currentStep.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step Pill Navigator */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Navegar pelos módulos:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {VERA_TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => handleNavigateDirect(idx)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                    currentStepIndex === idx
                      ? 'bg-[#1A3636] text-[#D4AF37] font-bold shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {idx === 0 ? 'Início' : s.title.split('.')[0] || s.badgeText}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            Pular Tour
          </Button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
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
              {currentStepIndex === VERA_TOUR_STEPS.length - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Concluir e Começar
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
