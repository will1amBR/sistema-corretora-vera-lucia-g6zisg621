import React, { useState } from 'react'
import { MessageCircle, X, Sparkles, Send } from 'lucide-react'

interface FloatingWhatsAppProps {
  phone?: string
  defaultMessage?: string
}

export const BROKER_PHONE_DISPLAY = '(51) 99132-7636'
export const BROKER_PHONE_RAW = '5551991327636'
export const BROKER_CRECI = '38415'
export const BROKER_AGENCY = 'Foxter Cia. Imobiliária'
export const BROKER_CITY = 'Porto Alegre - RS'

export function getWhatsAppUrl(customMessage?: string) {
  const text =
    customMessage ||
    'Olá Vera Lúcia! Gostaria de mais informações sobre os imóveis em Porto Alegre.'
  return `https://wa.me/${BROKER_PHONE_RAW}?text=${encodeURIComponent(text)}`
}

export default function FloatingWhatsApp({
  phone = BROKER_PHONE_RAW,
  defaultMessage = 'Olá Vera Lúcia! Gostaria de atendimento para encontrar meu imóvel em Porto Alegre.',
}: FloatingWhatsAppProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState(defaultMessage)

  const handleSend = () => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none">
      {/* Popover Bubble */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-[#25D366]/30 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="bg-[#1A3636] text-white p-4 flex items-center justify-between border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="https://img.usecurling.com/ppl/128?gender=female&seed=44"
                  alt="Vera Lúcia Koren"
                  className="w-10 h-10 rounded-full border-2 border-[#D4AF37] object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1A3636]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Vera Lúcia Koren
                  <span className="text-[10px] bg-[#D4AF37] text-[#1A3636] font-extrabold px-1.5 py-0.2 rounded">
                    CRECI 38415
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-300 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online no WhatsApp • Foxter Cia. Imobiliária
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-gray-50/80 space-y-3">
            <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-xs border border-gray-100 text-xs text-gray-700 leading-relaxed space-y-1">
              <p className="font-semibold text-[#1A3636]">Olá! Seja muito bem-vindo(a). 👋</p>
              <p className="text-gray-600">
                Sou a Vera Lúcia Koren, corretora especialista em Porto Alegre com mais de 12 anos
                de experiência. Como posso te ajudar hoje?
              </p>
              <span className="block text-[10px] text-gray-400 text-right">Agora</span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wa-custom-msg" className="text-[11px] font-semibold text-gray-600">
                Sua mensagem:
              </label>
              <textarea
                id="wa-custom-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#25D366] bg-white text-gray-800 resize-none shadow-xs"
                placeholder="Digite sua mensagem..."
              />
            </div>

            <button
              onClick={handleSend}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" /> Iniciar Conversa no WhatsApp
            </button>

            <div className="text-center">
              <span className="text-[10px] text-gray-400">Atendimento direto: (51) 99132-7636</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Falar no WhatsApp com Vera Lúcia Koren"
        className="group relative flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-4 py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6 fill-white" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4AF37]" />
          </span>
        </div>
        <span className="text-sm font-semibold tracking-wide hidden sm:inline">
          Falar no WhatsApp
        </span>
      </button>
    </div>
  )
}
