import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Building2,
  CalendarDays,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Clock,
  Award,
  BadgeCheck,
  ChevronRight,
  Maximize,
  BedDouble,
  Bath,
  Car,
  Filter,
  Search,
  Handshake,
  Landmark,
  FileText,
  DollarSign,
  PiggyBank,
  Repeat,
  HeartHandshake,
  Star,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getProperties, getPropertyImageUrl } from '@/services/properties'
import PropertyDetailModal from '@/components/PropertyDetailModal'
import FloatingWhatsApp, {
  getWhatsAppUrl,
  BROKER_PHONE_DISPLAY,
  BROKER_CRECI,
  BROKER_AGENCY,
  BROKER_CITY,
} from '@/components/FloatingWhatsApp'
import { ClientOnboardingModal } from '@/components/ClientOnboardingModal'
import { Skeleton } from '@/components/ui/skeleton'
import { Compass, HelpCircle } from 'lucide-react'
import type { Property } from '@/types'

const SERVICES_LIST = [
  {
    icon: Building2,
    title: 'Compra e Venda de Imóveis',
    description:
      'Curadoria refinada dos melhores imóveis de Porto Alegre, com avaliação precisa de mercado e negociação justa e transparente.',
    highlight: 'Portfólio Exclusivo',
  },
  {
    icon: Landmark,
    title: 'Financiamento Bancário Completo',
    description:
      'Assessoria e aprovação ágil de crédito nos principais bancos (Itaú, Bradesco, Caixa, Santander, Banco do Brasil) com as melhores taxas.',
    highlight: 'Aprovação Ágil',
  },
  {
    icon: Repeat,
    title: 'Permuta Imobiliária Estruturada',
    description:
      'Análise técnica e negociação de imóveis ou veículos como parte do pagamento para viabilizar o negócio com segurança jurídica.',
    highlight: 'Avaliação Segura',
  },
  {
    icon: PiggyBank,
    title: 'Uso de FGTS',
    description:
      'Orientação completa e tramitação para utilizar seu Fundo de Garantia como entrada ou amortização do saldo devedor.',
    highlight: 'Liberação Rápida',
  },
  {
    icon: DollarSign,
    title: 'Cartas de Consórcio Imobiliário',
    description:
      'Planejamento de contemplação, lance embutido e uso de cartas de crédito para aquisição de imóveis sem juros bancários.',
    highlight: 'Planejamento Inteligente',
  },
  {
    icon: Handshake,
    title: 'Pagamento à Vista & Pós-Venda',
    description:
      'Descontos e condições especiais em negociações à vista, com suporte do primeiro contato até o registro em cartório e entrega das chaves.',
    highlight: 'Suporte Integral',
  },
]

const PORTO_ALEGRE_NEIGHBORHOODS = [
  'Todos os Bairros',
  'Moinhos de Vento',
  'Bela Vista',
  'Petrópolis',
  'Menino Deus',
  'Três Figueiras',
  'Auxiliadora',
  'Boa Vista',
]

export default function LandingPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Todos os Bairros')
  const [selectedModality, setSelectedModality] = useState('all')
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<Property | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [clientGuideOpen, setClientGuideOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getProperties('status = "available"')
        setProperties(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredProperties = properties.filter((p) => {
    const matchNeighborhood =
      selectedNeighborhood === 'Todos os Bairros' || p.neighborhood === selectedNeighborhood
    const matchModality = selectedModality === 'all' || p.modality === selectedModality
    const matchSearch =
      !searchQuery ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.neighborhood?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchNeighborhood && matchModality && matchSearch
  })

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A3636] flex flex-col selection:bg-[#D4AF37] selection:text-[#1A3636]">
      {/* Top Notice Bar */}
      <div className="bg-[#142A2A] text-white py-2 px-4 text-center text-xs border-b border-[#D4AF37]/30 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        <span className="flex items-center gap-1 text-[#D4AF37] font-semibold">
          <Award className="w-3.5 h-3.5" /> CRECI 38415 — Corretora Vera Lúcia Koren
        </span>
        <span className="hidden sm:inline text-white/50">•</span>
        <span className="text-white/80">Foxter Cia. Imobiliária — Porto Alegre - RS</span>
        <span className="hidden sm:inline text-white/50">•</span>
        <a
          href={getWhatsAppUrl(
            'Olá Vera Lúcia! Gostaria de conversar sobre imóveis em Porto Alegre.',
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#25D366] hover:underline flex items-center gap-1 font-semibold"
        >
          <MessageCircle className="w-3.5 h-3.5" /> (51) 99132-7636
        </a>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-[#1A3636]/95 backdrop-blur-md border-b border-[#2A4D4D] text-white py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-white/10 shrink-0">
              <img
                src="https://img.usecurling.com/ppl/128?gender=female&seed=44"
                alt="Vera Lúcia Koren"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-white">
                  VERA LÚCIA KOREN
                </span>
                <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-[10px] px-1.5 py-0">
                  CRECI 38415
                </Badge>
              </div>
              <p className="text-[11px] text-[#D4AF37] font-medium tracking-wide">
                Foxter Cia. Imobiliária • Porto Alegre - RS
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/80">
            <a href="#imoveis" className="hover:text-[#D4AF37] transition-colors">
              Imóveis em Destaque
            </a>
            <a href="#sobre" className="hover:text-[#D4AF37] transition-colors">
              Sobre a Vera
            </a>
            <a href="#servicos" className="hover:text-[#D4AF37] transition-colors">
              Serviços & Financiamento
            </a>
            <a href="#contato" className="hover:text-[#D4AF37] transition-colors">
              Contato
            </a>
            <button
              onClick={() => setClientGuideOpen(true)}
              className="text-xs text-[#D4AF37] hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              <Compass className="w-3.5 h-3.5" /> Como Comprar
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClientGuideOpen(true)}
              className="md:hidden text-[#D4AF37] hover:bg-white/10 text-xs px-2"
            >
              <Compass className="w-4 h-4 mr-1" /> Guia
            </Button>
            <Link to="/agendar">
              <Button
                size="sm"
                className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#1A3636] font-bold text-xs shadow-md gap-1.5"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Agendar Visita
              </Button>
            </Link>
            <Link to="/crm" className="hidden lg:inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 text-xs"
              >
                Painel Gestão
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-[#1A3636] via-[#204242] to-[#1A3636] text-white py-16 sm:py-24 px-4 sm:px-8 overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Text / Info */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              Atendimento Imobiliário de Alto Padrão em Porto Alegre
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Vera Lúcia Koren
              </h1>
              <p className="text-lg sm:text-xl font-medium text-[#D4AF37] flex flex-wrap items-center gap-2">
                <span>Corretora de Imóveis — CRECI 38415</span>
                <span className="text-white/40">•</span>
                <span className="text-white">Foxter Cia. Imobiliária</span>
              </p>
              <p className="text-sm sm:text-base text-white/70 flex items-center gap-1.5 font-normal">
                <MapPin className="w-4 h-4 text-[#D4AF37]" /> Porto Alegre - RS (Moinhos de Vento,
                Bela Vista, Petrópolis, Três Figueiras e região)
              </p>
            </div>

            <p className="text-base sm:text-lg text-white/90 leading-relaxed font-light max-w-2xl">
              Atendimento excelente, calmo e coeso. Ajuda dedicada em todas as partes do seu negócio
              imobiliário: desde a busca refinada, negociação estratégica, financiamento bancário
              descomplicado, até a conferência jurídica documental e pós-venda completo.
            </p>

            {/* Experience Badge */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-2 border-y border-white/15">
              <div className="space-y-0.5">
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#D4AF37]">
                  +12 Anos
                </span>
                <span className="text-xs text-white/75 font-medium">De experiência no mercado</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#D4AF37]">
                  100%
                </span>
                <span className="text-xs text-white/75 font-medium">Segurança jurídica</span>
              </div>
              <div className="space-y-0.5 col-span-2 sm:col-span-1">
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#D4AF37]">
                  POA
                </span>
                <span className="text-xs text-white/75 font-medium">
                  Bairros nobres selecionados
                </span>
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
              <Link to="/agendar" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#c49f2e] text-[#1A3636] font-extrabold text-base px-7 py-6 shadow-xl rounded-xl gap-2 active:scale-95 transition-all"
                >
                  <CalendarDays className="w-5 h-5" />
                  Agendar uma Visita
                </Button>
              </Link>

              <a
                href={getWhatsAppUrl(
                  'Olá Vera Lúcia! Gostaria de conversar sobre imóveis em Porto Alegre.',
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-base px-7 py-6 shadow-xl rounded-xl gap-2 active:scale-95 transition-all border-none"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  Falar no WhatsApp
                </Button>
              </a>
            </div>
          </div>

          {/* Right Card: Broker Profile Spotlight */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm sm:max-w-md">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-amber-200 rounded-3xl blur-md opacity-40 animate-pulse" />
              <Card className="relative bg-[#142A2A] border border-[#D4AF37]/40 text-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-[#1A3636]">
                  <img
                    src="https://img.usecurling.com/ppl/512?gender=female&seed=44"
                    alt="Vera Lúcia Koren - Corretora"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#142A2A] via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white">Vera Lúcia Koren</h3>
                      <p className="text-xs text-[#D4AF37] font-semibold">
                        CRECI 38415 • Foxter Imobiliária
                      </p>
                    </div>
                    <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-xs py-1 px-2.5">
                      12+ Anos Exp.
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5 space-y-3.5 text-xs text-white/80">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>
                      Assessoria técnica integral em financiamento, FGTS, consórcios e permutas.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>
                      Transparência total, ética inegociável e atenção minuciosa aos detalhes do
                      contrato.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                    <span className="font-semibold text-white">
                      Telefone Direto / WhatsApp: {BROKER_PHONE_DISPLAY}
                    </span>
                  </div>

                  <div className="pt-2">
                    <a
                      href={getWhatsAppUrl(
                        'Olá Vera Lúcia! Quero conhecer os imóveis disponíveis em Porto Alegre.',
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block"
                    >
                      <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs py-2.5 rounded-xl gap-2">
                        <MessageCircle className="w-4 h-4 fill-white" />
                        Conversar com a Vera Agora
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS & CREDENTIALS BANNER */}
      <section className="bg-white border-y border-gray-100 py-6 px-4 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1A3636]">CRECI 38415</span>
            <p className="text-xs text-gray-500 mt-0.5">Registro Oficial Regularizado</p>
          </div>
          <div className="p-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37]">12+ Anos</span>
            <p className="text-xs text-gray-500 mt-0.5">Experiência Imobiliária em POA</p>
          </div>
          <div className="p-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1A3636]">Foxter</span>
            <p className="text-xs text-gray-500 mt-0.5">Cia. Imobiliária Tradicional</p>
          </div>
          <div className="p-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#25D366]">100%</span>
            <p className="text-xs text-gray-500 mt-0.5">Acompanhamento do Início ao Fim</p>
          </div>
        </div>
      </section>

      {/* PROPERTY SHOWCASE SECTION */}
      <section
        id="imoveis"
        className="py-16 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-[#1A3636] border border-amber-200 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Catálogo Selecionado
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1A3636] tracking-tight">
              Imóveis Exclusivos em Porto Alegre - RS
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
              Confira coberturas, casas em condomínio e apartamentos de alto padrão nos bairros mais
              valorizados da capital gaúcha.
            </p>
          </div>

          <Link to="/agendar">
            <Button className="bg-[#1A3636] hover:bg-[#254d4d] text-white text-xs sm:text-sm font-bold gap-2">
              <CalendarDays className="w-4 h-4 text-[#D4AF37]" /> Agendar Visita em Qualquer Imóvel
            </Button>
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar por bairro, condomínio ou palavra-chave (ex: lareira, piscina, Encol)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50/70 border-gray-200 text-xs sm:text-sm h-10"
            />
          </div>

          <div>
            <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
              <SelectTrigger className="bg-gray-50/70 border-gray-200 text-xs sm:text-sm h-10">
                <SelectValue placeholder="Bairro" />
              </SelectTrigger>
              <SelectContent>
                {PORTO_ALEGRE_NEIGHBORHOODS.map((nb) => (
                  <SelectItem key={nb} value={nb}>
                    {nb}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedModality} onValueChange={setSelectedModality}>
              <SelectTrigger className="bg-gray-50/70 border-gray-200 text-xs sm:text-sm h-10">
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Condições</SelectItem>
                <SelectItem value="sale">Venda Direta</SelectItem>
                <SelectItem value="financing">Aceita Financiamento / FGTS</SelectItem>
                <SelectItem value="permuta">Aceita Permuta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((sk) => (
                <div
                  key={sk}
                  className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-xs"
                >
                  <Skeleton className="h-56 w-full rounded-xl bg-gray-200" />
                  <Skeleton className="h-5 w-3/4 bg-gray-200" />
                  <Skeleton className="h-4 w-1/2 bg-gray-100" />
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <Skeleton className="h-10 rounded-lg bg-gray-100" />
                    <Skeleton className="h-10 rounded-lg bg-gray-100" />
                    <Skeleton className="h-10 rounded-lg bg-gray-100" />
                    <Skeleton className="h-10 rounded-lg bg-gray-100" />
                  </div>
                </div>
              ))}
            </>
          ) : filteredProperties.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 p-8 space-y-3">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="font-bold text-lg text-gray-700">
                Nenhum imóvel encontrado para este filtro
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Tente ajustar os termos de busca ou fale diretamente com a Vera Lúcia para
                encomendar o imóvel desejado em Porto Alegre.
              </p>
              <a
                href={getWhatsAppUrl(
                  'Olá Vera Lúcia! Busco um imóvel específico em Porto Alegre e gostaria de ajuda.',
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="mt-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold gap-2">
                  <MessageCircle className="w-4 h-4" /> Encomendar Imóvel no WhatsApp
                </Button>
              </a>
            </div>
          ) : (
            filteredProperties.map((prop) => {
              const imageUrl = getPropertyImageUrl(prop)
              const cardWaMessage = `Olá Vera Lúcia! Gostei do imóvel "${prop.title}" (${prop.neighborhood}, R$ ${prop.price?.toLocaleString('pt-BR')}) e gostaria de mais informações e agendar uma visita.`
              const cardWaUrl = getWhatsAppUrl(cardWaMessage)

              return (
                <Card
                  key={prop.id}
                  className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Card Header */}
                    <div
                      className="relative h-56 sm:h-60 w-full overflow-hidden bg-gray-100 cursor-pointer"
                      onClick={() => setSelectedPropertyForModal(prop)}
                    >
                      <img
                        src={imageUrl}
                        alt={prop.title}
                        loading="lazy"
                        width="640"
                        height="400"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <Badge className="bg-[#1A3636] text-[#D4AF37] font-bold text-[10px] border border-[#D4AF37]/30 shadow-md">
                          {prop.modality === 'sale' && 'Venda'}
                          {prop.modality === 'financing' && 'Aceita Financiamento'}
                          {prop.modality === 'permuta' && 'Aceita Permuta'}
                          {prop.modality === 'rent' && 'Locação'}
                        </Badge>
                        <Badge className="bg-black/60 backdrop-blur-xs text-white text-[10px] border-none">
                          {prop.neighborhood}
                        </Badge>
                      </div>

                      {/* Bottom Price Tag */}
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-[#1A3636]/90 backdrop-blur-md text-[#D4AF37] font-extrabold text-base sm:text-lg px-3 py-1 rounded-md border border-[#D4AF37]/40 shadow-md">
                          R$ {prop.price?.toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="absolute bottom-3 right-3 text-[11px] text-white/90 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded font-medium">
                        Ver Detalhes ↗
                      </div>
                    </div>

                    <CardHeader className="p-5 pb-2">
                      <CardTitle
                        onClick={() => setSelectedPropertyForModal(prop)}
                        className="text-base font-bold text-[#1A3636] line-clamp-1 hover:text-[#D4AF37] transition-colors cursor-pointer"
                      >
                        {prop.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {prop.neighborhood} • Porto Alegre - RS
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-3">
                      {/* Key Metric Icons */}
                      <div className="grid grid-cols-4 gap-1 py-2.5 border-y border-gray-100 text-center text-gray-600">
                        <div className="flex flex-col items-center">
                          <Maximize className="w-4 h-4 text-[#D4AF37] mb-0.5" />
                          <span className="text-xs font-bold text-[#1A3636]">
                            {prop.area_sqm || '--'} m²
                          </span>
                          <span className="text-[10px] text-gray-400">Área</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <BedDouble className="w-4 h-4 text-[#D4AF37] mb-0.5" />
                          <span className="text-xs font-bold text-[#1A3636]">
                            {prop.bedrooms || '--'}
                          </span>
                          <span className="text-[10px] text-gray-400">Dorms</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Bath className="w-4 h-4 text-[#D4AF37] mb-0.5" />
                          <span className="text-xs font-bold text-[#1A3636]">
                            {prop.suites || '--'}
                          </span>
                          <span className="text-[10px] text-gray-400">Suítes</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Car className="w-4 h-4 text-[#D4AF37] mb-0.5" />
                          <span className="text-xs font-bold text-[#1A3636]">
                            {prop.parking_spots || '--'}
                          </span>
                          <span className="text-[10px] text-gray-400">Vagas</span>
                        </div>
                      </div>

                      {prop.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {prop.description}
                        </p>
                      )}

                      {prop.features && prop.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {prop.features.slice(0, 2).map((feat, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px] bg-gray-100 text-gray-700 font-normal"
                            >
                              {feat}
                            </Badge>
                          ))}
                          {prop.features.length > 2 && (
                            <span className="text-[10px] text-gray-400 self-center">
                              +{prop.features.length - 2} mais
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                    <a
                      href={cardWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      Falar no WhatsApp
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPropertyForModal(prop)}
                      className="border-gray-300 text-[#1A3636] hover:bg-[#1A3636] hover:text-white text-xs rounded-xl"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </section>

      {/* ABOUT VERA SECTION */}
      <section
        id="sobre"
        className="py-16 sm:py-24 bg-[#142A2A] text-white px-4 sm:px-8 border-y border-[#2A4D4D]"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm">
              <div className="absolute -inset-2 bg-[#D4AF37]/30 rounded-3xl blur-lg" />
              <img
                src="https://img.usecurling.com/ppl/512?gender=female&seed=44"
                alt="Corretora Vera Lúcia Koren"
                className="relative w-full rounded-2xl shadow-2xl border-2 border-[#D4AF37]/50 object-cover"
              />
              <div className="absolute -bottom-4 -right-4 bg-[#D4AF37] text-[#1A3636] p-4 rounded-xl shadow-xl font-bold text-center border border-white/20">
                <span className="block text-2xl font-black">12+</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold">
                  Anos de Mercado
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D4AF37] text-xs font-semibold">
              <Award className="w-3.5 h-3.5" /> Sobre a Corretora
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              Atendimento de excelência, calmo e coeso para decisões patrimoniais seguras.
            </h2>

            <p className="text-white/85 text-sm sm:text-base leading-relaxed font-light">
              Com mais de uma década atuando no mercado imobiliário gaúcho pela{' '}
              <strong>Foxter Cia. Imobiliária</strong>, a corretora{' '}
              <strong>Vera Lúcia Koren (CRECI 38415)</strong> consolidou uma trajetória fundamentada
              em ética, conhecimento técnico aprofundado dos bairros nobres de Porto Alegre e uma
              assessoria personalizada incomparável.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <h4 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" /> Busca Refinada
                </h4>
                <p className="text-xs text-white/70">
                  Filtro minucioso alinhado ao seu estilo de vida, orçamento e necessidades
                  familiares.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <h4 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                  <Handshake className="w-4 h-4" /> Negociação Coesa
                </h4>
                <p className="text-xs text-white/70">
                  Condução serena e firme entre comprador e vendedor, garantindo o melhor valor
                  justo.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <h4 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                  <Landmark className="w-4 h-4" /> Financiamento & Bancos
                </h4>
                <p className="text-xs text-white/70">
                  Apoio na simulação, enquadramento e escolha da instituição bancária mais
                  vantajosa.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <h4 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Pós-Venda Completo
                </h4>
                <p className="text-xs text-white/70">
                  Acompanhamento até a entrega das chaves e certidões cartorárias 100% finalizadas.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link to="/agendar">
                <Button className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#1A3636] font-bold text-sm px-6 py-5 rounded-xl">
                  Agendar Consulta / Visita
                </Button>
              </Link>
              <a
                href={getWhatsAppUrl(
                  'Olá Vera Lúcia! Gostaria de conversar sobre compra/venda de imóvel.',
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm px-6 py-5 rounded-xl gap-2">
                  <MessageCircle className="w-4 h-4 fill-white" /> Falar com Vera no WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES & MODALITIES SECTION */}
      <section
        id="servicos"
        className="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-12"
      >
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-[#1A3636] border border-amber-200 rounded-full text-xs font-bold">
            <Handshake className="w-3.5 h-3.5 text-[#D4AF37]" /> Modalidades & Soluções
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1A3636] tracking-tight">
            Assessoria Completa para Todas as Formas de Compra
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Seja à vista, com financiamento bancário, utilização de FGTS, carta de consórcio ou
            permuta por outro imóvel, tenha segurança do início ao fim.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES_LIST.map((service, idx) => {
            const Icon = service.icon
            return (
              <Card
                key={idx}
                className="card-elevated hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between p-6 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#1A3636] text-[#D4AF37] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge className="bg-amber-100 text-amber-900 border-none text-[10px] font-bold">
                      {service.highlight}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-[#1A3636]">{service.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mt-2">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100">
                  <a
                    href={getWhatsAppUrl(
                      `Olá Vera Lúcia! Gostaria de entender mais sobre ${service.title}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#1A3636] hover:text-[#D4AF37] flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  >
                    Tirar Dúvidas sobre esta Modalidade <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* WHY CHOOSE VERA / TESTIMONIALS & TRUST */}
      <section className="bg-gray-50 py-16 px-4 sm:px-8 border-t border-gray-200/80">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-[#1A3636]">
              Por que confiar na Vera Lúcia Koren?
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
              A tranquilidade de quem negocia com uma profissional credenciada, experiente e focada
              na sua satisfação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-1 text-[#D4AF37]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-gray-600 italic leading-relaxed">
                "A Vera foi fundamental na compra da nossa cobertura em Bela Vista. O processo de
                financiamento no Itaú foi tranquilo e sem surpresas. Atendimento calmo e pontual!"
              </p>
              <div className="pt-2 border-t border-gray-100 text-xs font-bold text-[#1A3636]">
                Dr. Marcelo Silveira & Família
                <span className="block font-normal text-[11px] text-gray-400">
                  Comprador no Bairro Bela Vista
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-1 text-[#D4AF37]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-gray-600 italic leading-relaxed">
                "Vendemos nosso apartamento no Moinhos de Vento em tempo recorde com avaliação
                justa. A Vera cuidou de toda a documentação com extremo rigor e segurança."
              </p>
              <div className="pt-2 border-t border-gray-100 text-xs font-bold text-[#1A3636]">
                Renata & Carlos Eduardo
                <span className="block font-normal text-[11px] text-gray-400">
                  Vendedores no Moinhos de Vento
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-1 text-[#D4AF37]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-gray-600 italic leading-relaxed">
                "Fizemos uma composição mista com entrada, FGTS e carta de consórcio. A Vera
                estruturou a proposta de forma brilhante perante o proprietário."
              </p>
              <div className="pt-2 border-t border-gray-100 text-xs font-bold text-[#1A3636]">
                Felipe e Mariana
                <span className="block font-normal text-[11px] text-gray-400">
                  Compradores no Petrópolis
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & SCHEDULE CTA SECTION */}
      <section
        id="contato"
        className="py-16 sm:py-20 bg-gradient-to-br from-[#1A3636] to-[#142A2A] text-white px-4 sm:px-8"
      >
        <div className="max-w-5xl mx-auto rounded-3xl bg-white/5 border border-[#D4AF37]/30 p-8 sm:p-12 backdrop-blur-md shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-left">
              <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-xs py-1 px-3">
                Agendamento & Contato Direto
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                Pronto para encontrar o seu próximo imóvel em Porto Alegre?
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
                Agende uma visita presencial ou tire suas dúvidas diretamente com a Vera Lúcia Koren
                no WhatsApp.
              </p>

              <div className="space-y-2.5 pt-2 text-xs sm:text-sm text-white/90">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#25D366]" />
                  <span>
                    <strong>Telefone:</strong> {BROKER_PHONE_DISPLAY}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>
                    <strong>WhatsApp:</strong> (51) 99132-7636
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    <strong>CRECI:</strong> 38415 — RS
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    <strong>Imobiliária:</strong> Foxter Cia. Imobiliária
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white text-[#1A3636] p-6 sm:p-8 rounded-2xl shadow-xl space-y-4">
              <h3 className="font-bold text-lg text-[#1A3636]">Agende sua Visita Oficial</h3>
              <p className="text-xs text-gray-600">
                Escolha o melhor dia e horário para visitar os imóveis de seu interesse com a
                corretora.
              </p>

              <div className="space-y-3 pt-2">
                <Link to="/agendar" className="block w-full">
                  <Button className="w-full bg-[#1A3636] hover:bg-[#254d4d] text-white font-bold py-3 text-sm rounded-xl gap-2 shadow-md">
                    <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
                    Ir para Agendamento Online
                  </Button>
                </Link>

                <a
                  href={getWhatsAppUrl(
                    'Olá Vera Lúcia! Gostaria de agendar uma visita em um imóvel de Porto Alegre.',
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 text-sm rounded-xl gap-2 shadow-md">
                    <MessageCircle className="w-4 h-4 fill-white" />
                    Chamar no WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0D1D1D] text-white/70 py-10 px-4 sm:px-8 border-t border-white/10 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-extrabold text-sm text-white tracking-wider">
              VERA LÚCIA KOREN • CORRETORA DE IMÓVEIS
            </h4>
            <p className="text-xs text-[#D4AF37]">
              CRECI 38415 • Foxter Cia. Imobiliária • Porto Alegre - RS
            </p>
            <p className="text-[11px] text-white/50">
              © {new Date().getFullYear()} Todos os direitos reservados. Atendimento de alto padrão
              em Porto Alegre.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/80">
            <Link to="/agendar" className="hover:text-[#D4AF37] transition-colors">
              Agendar Visita
            </Link>
            <Link to="/portal" className="hover:text-[#D4AF37] transition-colors">
              Portal do Cliente
            </Link>
            <Link to="/crm" className="hover:text-[#D4AF37] transition-colors">
              Acesso Gestão
            </Link>
            <a
              href={getWhatsAppUrl('Olá Vera Lúcia!')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] font-semibold flex items-center gap-1 hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5" /> (51) 99132-7636
            </a>
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      <PropertyDetailModal
        property={selectedPropertyForModal}
        isOpen={!!selectedPropertyForModal}
        onClose={() => setSelectedPropertyForModal(null)}
      />

      {/* Interactive Buyer Guide Modal */}
      <ClientOnboardingModal
        forceOpen={clientGuideOpen}
        onCloseManual={() => setClientGuideOpen(false)}
      />

      {/* Floating WhatsApp on All Views */}
      <FloatingWhatsApp />
    </div>
  )
}
