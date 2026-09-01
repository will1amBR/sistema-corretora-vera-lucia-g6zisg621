import React, { useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock,
  Building2,
  CheckCircle2,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  User,
  ShieldCheck,
  BedDouble,
  Maximize,
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
import { getProperties, getPropertyImageUrl } from '@/services/properties'
import { createClient } from '@/services/clients'
import FloatingWhatsApp, {
  getWhatsAppUrl,
  BROKER_PHONE_DISPLAY,
  BROKER_CRECI,
} from '@/components/FloatingWhatsApp'
import { ClientOnboardingModal } from '@/components/ClientOnboardingModal'
import { MessageCircle, ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Property } from '@/types'

export default function PublicSchedule() {
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    property_id: '',
    date: '',
    time: '14:00',
    objectives: '',
    notes: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const props = await getProperties('status = "available"')
        setProperties(props)
        if (props.length > 0) {
          setFormData((prev) => ({ ...prev, property_id: props[0].id }))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.phone || !formData.date) {
      toast({ title: 'Preencha seu nome, telefone e a data desejada', variant: 'destructive' })
      return
    }

    try {
      const scheduledDateTime = new Date(`${formData.date}T${formData.time}:00`).toISOString()

      await createClient({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        status: 'visit',
        visit_scheduled_at: scheduledDateTime,
        visit_property_id: formData.property_id || undefined,
        objectives: formData.objectives,
        visit_notes: formData.notes,
        purchase_modality: 'misto',
      })

      setSubmitted(true)
      toast({
        title: 'Agendamento Solicitado com Sucesso!',
        description: 'Vera Lúcia entrará em contato para confirmar todos os detalhes da visita.',
      })
    } catch (err: any) {
      toast({ title: 'Erro ao agendar', description: err.message, variant: 'destructive' })
    }
  }

  const selectedProperty = properties.find((p) => p.id === formData.property_id)

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 sm:py-12 px-4 animate-fade-in max-w-4xl mx-auto space-y-8">
      {/* Header back to site */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link
          to="/"
          className="text-xs font-bold text-[#1A3636] hover:text-[#D4AF37] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para o Site Oficial
        </Link>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGuideOpen(true)}
            className="text-xs text-[#1A3636] hover:text-[#D4AF37] gap-1 px-2"
          >
            <Compass className="w-3.5 h-3.5 text-[#D4AF37]" /> Como Funciona a Visita
          </Button>
          <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
            CRECI {BROKER_CRECI} • Foxter Cia. Imobiliária
          </span>
        </div>
      </div>

      {/* Brand Hero */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#1A3636] text-[#D4AF37] rounded-full text-xs font-semibold mb-2 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> Corretora de Imóveis — CRECI 38415
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A3636] tracking-tight">
          VERA LÚCIA KOREN
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
          Agende sua visita exclusiva aos imóveis de alto padrão mais desejados de Porto Alegre -
          RS.
        </p>
      </div>

      {submitted ? (
        <Card className="card-elevated border-t-4 border-t-emerald-600 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A3636]">Visita Agendada com Sucesso!</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Obrigado, <strong>{formData.name}</strong>. Sua solicitação de visita para o dia{' '}
            <strong>
              {new Date(formData.date).toLocaleDateString('pt-BR')} às {formData.time}
            </strong>{' '}
            foi recebida e sincronizada na agenda oficial da Vera Lúcia Koren.
          </p>
          <div className="pt-4">
            <Button
              onClick={() => {
                setSubmitted(false)
                setFormData({
                  name: '',
                  phone: '',
                  email: '',
                  property_id: properties[0]?.id || '',
                  date: '',
                  time: '14:00',
                  objectives: '',
                  notes: '',
                })
              }}
              className="bg-[#1A3636] text-white hover:bg-[#254d4d]"
            >
              Agendar Outra Visita
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form */}
          <Card className="card-elevated md:col-span-2 border-t-4 border-t-[#1A3636]">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-bold text-[#1A3636] flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#D4AF37]" /> Escolha o Imóvel e Horário
              </CardTitle>
              <CardDescription className="text-xs">
                Preencha seus dados para receber o itinerário e confirmação no seu WhatsApp.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4 text-xs">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="prop_choice">Imóvel Desejado</Label>
                  <Select
                    value={formData.property_id}
                    onValueChange={(val) => setFormData({ ...formData, property_id: val })}
                  >
                    <SelectTrigger id="prop_choice" className="bg-white">
                      <SelectValue placeholder="Selecione o imóvel" />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="c_name">Seu Nome Completo *</Label>
                    <Input
                      id="c_name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Dra. Mariana Costa"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="c_phone">WhatsApp / Telefone *</Label>
                    <Input
                      id="c_phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(51) 99999-9999"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="c_email">Seu E-mail (Opcional)</Label>
                  <Input
                    id="c_email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="mariana@exemplo.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="v_date">Data Desejada *</Label>
                    <Input
                      id="v_date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="v_time">Horário Preferencial</Label>
                    <Select
                      value={formData.time}
                      onValueChange={(val) => setFormData({ ...formData, time: val })}
                    >
                      <SelectTrigger id="v_time" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:30">09:30 Manhã</SelectItem>
                        <SelectItem value="11:00">11:00 Manhã</SelectItem>
                        <SelectItem value="14:00">14:00 Tarde</SelectItem>
                        <SelectItem value="15:30">15:30 Tarde</SelectItem>
                        <SelectItem value="17:00">17:00 Final de Tarde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="c_obj">O que você mais busca neste imóvel? (Opcional)</Label>
                  <Textarea
                    id="c_obj"
                    value={formData.objectives}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    placeholder="Ex: Busco cobertura para família com 2 filhos, aceita permuta ou financiamento..."
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#1A3636] text-white hover:bg-[#254d4d] font-bold py-3 text-sm shadow-md"
                >
                  Solicitar Agendamento de Visita
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Selected Property Preview */}
          <div className="space-y-4">
            {selectedProperty && (
              <Card className="card-elevated overflow-hidden">
                <img
                  src={getPropertyImageUrl(selectedProperty)}
                  alt={selectedProperty.title}
                  className="w-full h-40 object-cover"
                />
                <CardContent className="p-4 space-y-2 text-xs">
                  <Badge className="bg-[#1A3636] text-[#D4AF37] text-[10px]">
                    Destaque Exclusivo
                  </Badge>
                  <h4 className="font-bold text-sm text-[#1A3636]">{selectedProperty.title}</h4>
                  <p className="text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {selectedProperty.neighborhood} • {selectedProperty.city}
                  </p>
                  <p className="font-bold text-base text-[#D4AF37] pt-1">
                    R$ {selectedProperty.price?.toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="card-elevated p-4 bg-gradient-to-br from-[#1A3636] to-[#254d4d] text-white space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <h5 className="font-bold text-xs">Assessoria 100% Personalizada</h5>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed">
                A corretora Vera Lúcia acompanha pessoalmente cada visita, garantindo segurança
                jurídica, análise financeira e negociações ágeis em Porto Alegre.
              </p>
              <div className="pt-2">
                <a
                  href={getWhatsAppUrl(
                    selectedProperty
                      ? `Olá Vera Lúcia! Gostaria de falar sobre a visita no imóvel "${selectedProperty.title}".`
                      : 'Olá Vera Lúcia! Gostaria de agendar uma visita em Porto Alegre.',
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" /> Falar com a Vera no WhatsApp
                </a>
              </div>
            </Card>
          </div>
        </div>
      )}

      <ClientOnboardingModal forceOpen={guideOpen} onCloseManual={() => setGuideOpen(false)} />
      <FloatingWhatsApp />
    </div>
  )
}
