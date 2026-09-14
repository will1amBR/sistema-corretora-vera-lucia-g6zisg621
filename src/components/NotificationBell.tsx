import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications } from '@/hooks/use-notifications'
import type { AppNotification } from '@/types'

function getNotificationIcon(type: string) {
  switch (type) {
    case 'proposal_new':
      return <FileText className="w-4 h-4 text-[#D4AF37]" />
    case 'proposal_updated':
      return <Sparkles className="w-4 h-4 text-blue-400" />
    case 'document_uploaded':
      return <UploadCloud className="w-4 h-4 text-emerald-400" />
    case 'counter_accepted':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    case 'counter_rejected':
      return <AlertCircle className="w-4 h-4 text-red-400" />
    default:
      return <Bell className="w-4 h-4 text-[#D4AF37]" />
  }
}

function formatRelativeTime(dateString: string) {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSec < 60) return 'Agora mesmo'
    if (diffMin < 60) return `Há ${diffMin} min`
    if (diffHours < 24) return `Há ${diffHours} h`
    return `Há ${diffDays} d`
  } catch (_) {
    return ''
  }
}

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications()

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) {
      markAsRead(notif.id)
    }
    if (notif.link) {
      setOpen(false)
      navigate(notif.link)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Central de Notificações"
          className="relative text-white/80 hover:text-white hover:bg-white/10 rounded-full h-9 w-9 focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
        >
          <Bell className="w-4 h-4 text-[#D4AF37]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white shadow-md animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-32px)] max-w-sm sm:w-96 p-0 bg-white border border-[#2A4D4D]/20 shadow-2xl rounded-xl overflow-hidden z-50 text-[#1A3636]"
      >
        {/* Header */}
        <div className="bg-[#1A3636] text-white p-3.5 px-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 bg-[#D4AF37] rounded-xs" />
            <span className="font-bold text-sm tracking-wide">Notificações em Tempo Real</span>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-[10px] px-2 py-0.5">
              {unreadCount} nova{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Action bar */}
        {notifications.length > 0 && (
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1 hover:text-[#1A3636] transition-colors font-medium text-[11px]"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Marcar todas como lidas</span>
            </button>
            <button
              onClick={() => clearAll()}
              className="flex items-center gap-1 hover:text-red-600 transition-colors font-medium text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar histórico</span>
            </button>
          </div>
        )}

        {/* List */}
        <ScrollArea className="max-h-[380px] divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-gray-300 stroke-[1.5]" />
              <p className="text-xs font-medium">Nenhuma notificação recente.</p>
              <p className="text-[11px] text-gray-400">
                Você será avisada aqui e com toasts flutuantes quando clientes enviarem propostas ou
                documentos.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative hover:bg-gray-50 ${
                    !notif.read ? 'bg-amber-50/50' : 'bg-white'
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-[#1A3636] shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          !notif.read ? 'text-[#1A3636] font-bold' : 'text-gray-700'
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatRelativeTime(notif.created)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.client_name && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-semibold text-[#1A3636] bg-gray-100 px-1.5 py-0.5 rounded">
                          {notif.client_name}
                        </span>
                        {notif.link && (
                          <span className="text-[10px] text-[#D4AF37] font-semibold flex items-center gap-0.5">
                            Ver detalhes <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0 mt-1.5 ring-2 ring-white" />
                  )}
                </div>
              )
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
