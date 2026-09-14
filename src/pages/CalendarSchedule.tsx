import React, { useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock,
  Building2,
  Users,
  MapPin,
  CheckCircle2,
  Phone,
  Plus,
  RefreshCw,
  ExternalLink,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useToast } from '@/hooks/use-toast'
import { getClients, scheduleClientVisit } from '@/services/clients'
import { getProperties } from '@/services/properties'
import { syncGoogleCalendar } from '@/services/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import type { Client, Property, CalendarEvent } from '@/types'

export default function CalendarSchedule() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  // Schedule visit form
  const [scheduleData, setScheduleData] = useState({
    client_id: '',
    property_id: '',
    scheduled_at: '',
    visit_notes: '',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [cData, pData] = await Promise.all([getClients(), getProperties()])
      setClients(cData)
      setProperties(pData)

      try {
        const calData = await syncGoogleCalendar()
        setEvents(calData.events || [])
        setIsGoogleConnected(calData.connected)
      } catch (_) {
        const clientVisits = cData
          .filter((c) => c.visit_scheduled_at)
          .map((c) => ({
            id: c.google_event_id || c.id,
            client_id: c.id,
            client_name: c.name,
            client_phone: c.phone,
            property_title: c.expand?.visit_property_id?.title || 'Imóvel selecionado',
            scheduled_at: c.visit_scheduled_at!,
            notes: c.visit_notes,
            status: 'confirmed',
            synced_with_google: false,
          }))
        setEvents(clientVisits)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSyncWithGoogle = async () => {
    setIsSyncing(true)
    try {
      const res = await syncGoogleCalendar(true)
      setIsGoogleConnected(true)
      setEvents(res.events || [])
      toast({
        title: 'Google Calendar Conectado com Sucesso!',
        description: 'Seus compromissos de visitas foram sincronizados.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro de sincronização',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleOpenScheduleModal = () => {
    // Default tomorrow at 14:00
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)
    const formatted = tomorrow.toISOString().slice(0, 16)

    setScheduleData({
      client_id: clients[0]?.id || '',
      property_id: properties[0]?.id || '',
      scheduled_at: formatted,
      visit_notes: '',
    })
    setIsScheduleModalOpen(true)
  }

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduleData.client_id || !scheduleData.scheduled_at) {
      toast({ title: 'Selecione o cliente e a data', variant: 'destructive' })
      return
    }

    try {
      await scheduleClientVisit(scheduleData.client_id, {
        visit_scheduled_at: new Date(scheduleData.scheduled_at).toISOString(),
        visit_property_id: scheduleData.property_id || undefined,
        visit_notes: scheduleData.visit_notes,
        google_event_id: 'gcal_' + Math.random().toString(36).substring(2, 9),
      })

      toast({
        title: 'Visita Agendada com Sucesso!',
        description: 'O evento foi registrado no CRM e na fila do Google Calendar.',
      })
      setIsScheduleModalOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao agendar', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl card-elevated">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3636] flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#D4AF37]" /> Agenda & Sincronização Google
            Calendar
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize horários de visitas a apartamentos e casas, itinerários e conecte com seu
            calendário do Google.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSyncWithGoogle}
            disabled={isSyncing}
            className="border-gray-300 text-xs text-[#1A3636]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isGoogleConnected ? 'Sincronizar Novamente' : 'Conectar Google Calendar'}
          </Button>

          <Button
            onClick={handleOpenScheduleModal}
            className="bg-[#1A3636] text-white hover:bg-[#254d4d] text-xs gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" /> Agendar Visita
          </Button>
        </div>
      </div>

      {/* Google Integration Status Card */}
      <Card className="card-elevated border-l-4 border-l-[#D4AF37] bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border flex items-center justify-center p-2">
                <img src="https://img.usecurling.com/i?q=google" alt="Google" className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[#1A3636]">Integração Google Calendar</h3>
                  <Badge
                    variant={isGoogleConnected ? 'default' : 'outline'}
                    className={
                      isGoogleConnected
                        ? 'bg-emerald-600 text-white'
                        : 'border-amber-500 text-amber-700 bg-amber-50'
                    }
                  >
                    {isGoogleConnected ? 'Ativo & Sincronizado' : 'Estrutura Pronta'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Todas as visitas agendadas por você ou pelo site público geram alertas e convites
                  para você e para o cliente.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSyncWithGoogle}
              disabled={isSyncing}
              className={`text-xs ${
                isGoogleConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                  : 'bg-[#1A3636] text-white hover:bg-[#254d4d]'
              }`}
            >
              {isGoogleConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Sincronização em
                  Tempo Real
                </>
              ) : (
                <>Conectar Minha Conta Google</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events / Visits List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#1A3636] flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#D4AF37]" /> Visitas Agendadas ({events.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-3"
              >
                <Skeleton className="h-5 w-40 bg-gray-200" />
                <Skeleton className="h-4 w-52 bg-gray-100" />
                <Skeleton className="h-16 w-full rounded bg-gray-50" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="card-elevated text-center py-12 text-gray-400">
            <CardContent>Nenhuma visita cadastrada na agenda.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((evt) => (
              <Card
                key={evt.id}
                className="card-elevated hover:shadow-md transition-shadow border-l-4 border-l-[#1A3636]"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#1A3636] break-words">
                        {evt.client_name}
                      </h4>
                      <p className="text-xs text-[#D4AF37] font-semibold flex items-center gap-1 mt-0.5 break-words">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />{' '}
                        <span className="break-words">{evt.property_title}</span>
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 shrink-0 whitespace-nowrap"
                    >
                      Confirmada
                    </Badge>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold text-[#1A3636]">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {new Date(evt.scheduled_at).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {evt.client_phone && (
                      <div className="flex items-center gap-1.5 pt-1 text-gray-500">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{evt.client_phone}</span>
                      </div>
                    )}

                    {evt.notes && (
                      <p className="text-[11px] text-gray-600 italic pt-1 border-t border-gray-200/50 mt-1">
                        "{evt.notes}"
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Visit Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1A3636]">
              Agendar Nova Visita Imobiliária
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione o cliente, o imóvel desejado e a data/horário.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleVisit} className="space-y-4 text-xs">
            <div>
              <Label htmlFor="sched_client">Cliente</Label>
              <Select
                value={scheduleData.client_id}
                onValueChange={(val) => setScheduleData({ ...scheduleData, client_id: val })}
              >
                <SelectTrigger id="sched_client">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sched_prop">Imóvel</Label>
              <Select
                value={scheduleData.property_id}
                onValueChange={(val) => setScheduleData({ ...scheduleData, property_id: val })}
              >
                <SelectTrigger id="sched_prop">
                  <SelectValue placeholder="Selecione o imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} ({p.neighborhood})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sched_date">Data e Horário</Label>
              <Input
                id="sched_date"
                type="datetime-local"
                value={scheduleData.scheduled_at}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduled_at: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="sched_notes">Observações / Logística de Acesso</Label>
              <Textarea
                id="sched_notes"
                value={scheduleData.visit_notes}
                onChange={(e) => setScheduleData({ ...scheduleData, visit_notes: e.target.value })}
                placeholder="Ex: Pegar as chaves com o zelador na portaria, levar termo de visita..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1A3636] text-white hover:bg-[#254d4d]">
                Confirmar e Sincronizar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
