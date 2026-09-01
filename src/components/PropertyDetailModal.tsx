import React, { useState } from 'react'
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
  BedDouble,
  Bath,
  Car,
  Maximize,
  MapPin,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPropertyGallery } from '@/services/properties'
import { getWhatsAppUrl, BROKER_PHONE_DISPLAY, BROKER_CRECI } from '@/components/FloatingWhatsApp'
import type { Property } from '@/types'

interface PropertyDetailModalProps {
  property: Property | null
  isOpen: boolean
  onClose: () => void
}

export default function PropertyDetailModal({
  property,
  isOpen,
  onClose,
}: PropertyDetailModalProps) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0)

  if (!property) return null

  const gallery = getPropertyGallery(property)

  const handlePrevImage = () => {
    setCurrentImageIdx((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))
  }

  const waMessage = `Olá Vera Lúcia! Tenho interesse no imóvel "${property.title}" (${property.neighborhood}, R$ ${property.price?.toLocaleString('pt-BR')}). Poderia me passar mais detalhes e agendar uma visita?`
  const waUrl = getWhatsAppUrl(waMessage)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-[#D4AF37]/30 bg-white">
        {/* Gallery Hero */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full bg-black overflow-hidden group">
          <img
            src={gallery[currentImageIdx] || gallery[0]}
            alt={property.title}
            className="w-full h-full object-cover transition-all duration-300"
          />

          {/* Navigation Arrows */}
          {gallery.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                aria-label="Imagem anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-xs transition-all opacity-90 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextImage}
                aria-label="Próxima imagem"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-xs transition-all opacity-90 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Badges Over Image */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <Badge className="bg-[#1A3636] text-[#D4AF37] font-bold text-xs border border-[#D4AF37]/40 shadow-md">
              {property.modality === 'sale' && 'Venda Exclusiva'}
              {property.modality === 'financing' && 'Financiamento Facilitado'}
              {property.modality === 'permuta' && 'Aceita Permuta'}
              {property.modality === 'rent' && 'Locação'}
            </Badge>
            <Badge className="bg-black/70 backdrop-blur-xs text-white text-xs border-none">
              {property.neighborhood} • Porto Alegre
            </Badge>
          </div>

          {/* Image Counter & Price Badge */}
          <div className="absolute bottom-4 left-4">
            <span className="bg-[#1A3636]/90 backdrop-blur-md text-[#D4AF37] font-extrabold text-xl sm:text-2xl px-4 py-1.5 rounded-lg border border-[#D4AF37]/50 shadow-lg">
              R$ {property.price?.toLocaleString('pt-BR')}
            </span>
          </div>

          {gallery.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-md">
              {currentImageIdx + 1} / {gallery.length} fotos
            </div>
          )}
        </div>

        {/* Thumbnail Selector */}
        {gallery.length > 1 && (
          <div className="flex gap-2 p-3 bg-gray-100/80 overflow-x-auto border-b border-gray-200">
            {gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIdx(i)}
                className={`relative shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${
                  currentImageIdx === i
                    ? 'border-[#D4AF37] scale-105 shadow-sm'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Title and Address */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A3636] leading-snug">
              {property.title}
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              {property.address ? `${property.address}, ` : ''}
              {property.neighborhood} — {property.city || 'Porto Alegre - RS'}
            </p>
          </div>

          {/* Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F8F9FA] rounded-xl border border-gray-100 text-center">
            <div className="flex flex-col items-center">
              <Maximize className="w-5 h-5 text-[#D4AF37] mb-1" />
              <span className="font-bold text-sm text-[#1A3636]">
                {property.area_sqm || '--'} m²
              </span>
              <span className="text-[11px] text-gray-500">Área Privativa</span>
            </div>
            <div className="flex flex-col items-center">
              <BedDouble className="w-5 h-5 text-[#D4AF37] mb-1" />
              <span className="font-bold text-sm text-[#1A3636]">{property.bedrooms || '--'}</span>
              <span className="text-[11px] text-gray-500">Dormitórios</span>
            </div>
            <div className="flex flex-col items-center">
              <Bath className="w-5 h-5 text-[#D4AF37] mb-1" />
              <span className="font-bold text-sm text-[#1A3636]">{property.suites || '--'}</span>
              <span className="text-[11px] text-gray-500">Suítes</span>
            </div>
            <div className="flex flex-col items-center">
              <Car className="w-5 h-5 text-[#D4AF37] mb-1" />
              <span className="font-bold text-sm text-[#1A3636]">
                {property.parking_spots || '--'}
              </span>
              <span className="text-[11px] text-gray-500">Vagas de Garagem</span>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-[#1A3636] uppercase tracking-wider text-xs">
                Sobre este imóvel
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                {property.description}
              </p>
            </div>
          )}

          {/* Features / Amenities */}
          {property.features && property.features.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-[#1A3636] uppercase tracking-wider">
                Destaques & Infraestrutura
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {property.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Broker Guarantee Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#1A3636] to-[#254d4d] text-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="https://img.usecurling.com/ppl/128?gender=female&seed=44"
                alt="Vera Lúcia Koren"
                className="w-12 h-12 rounded-full border-2 border-[#D4AF37] object-cover shrink-0"
              />
              <div>
                <h4 className="font-bold text-sm text-white">Vera Lúcia Koren</h4>
                <p className="text-xs text-[#D4AF37]">
                  CRECI {BROKER_CRECI} • Foxter Cia. Imobiliária
                </p>
                <p className="text-[11px] text-white/80 mt-0.5">
                  Atendimento calmo, seguro e suporte integral em financiamento bancário e
                  documentação.
                </p>
              </div>
            </div>
          </div>

          {/* Actions Bottom Bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              Falar no WhatsApp sobre este Imóvel
            </a>

            <Link
              to="/agendar"
              onClick={onClose}
              className="flex-1 bg-[#1A3636] hover:bg-[#254d4d] text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] border border-[#D4AF37]/40"
            >
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              Agendar Visita com Vera Lúcia
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
