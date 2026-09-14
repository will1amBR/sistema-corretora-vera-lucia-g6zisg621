import React, { useState } from 'react'
import {
  Building2,
  Phone,
  Clock,
  Percent,
  MapPin,
  ExternalLink,
  ChevronRight,
  GripVertical,
  CheckCircle2,
  FileCheck2,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Client, Property, ClientStatus } from '@/types'

interface CRMKanbanCardProps {
  client: Client
  property?: Property | null
  onClientClick: (client: Client) => void
  onPropertyClick: (property: Property) => void
  onAdvanceStage?: (client: Client) => void
  isDragging?: boolean
}

// Helper to format lead age (e.g. "Hoje", "Há 2 dias", "Há 3 semanas")
export function formatLeadAge(dateStr?: string): string {
  if (!dateStr) return 'Recente'
  const created = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Criado hoje'
  if (diffDays === 1) return 'Há 1 dia'
  if (diffDays < 7) return `Há ${diffDays} dias`
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks === 1) return 'Há 1 sem'
  if (diffWeeks < 5) return `Há ${diffWeeks} sem`
  const diffMonths = Math.floor(diffDays / 30)
  return diffMonths <= 1 ? 'Há 1 mês' : `Há ${diffMonths} meses`
}

// Summary text for financial breakdown
export function getFinancialSummary(client: Client, property?: Property | null): string {
  const fb = client.financial_breakdown
  const modality = client.purchase_modality

  if (!fb && !modality) return 'Composição a definir'

  if (modality === 'a_vista') {
    return '100% Recursos Próprios / À Vista'
  }

  const parts: string[] = []
  if (fb?.cash_percent) parts.push(`${fb.cash_percent}% à vista`)
  if (fb?.finance_percent) {
    const bank = fb.finance_bank ? ` ${fb.finance_bank}` : ''
    parts.push(`${fb.finance_percent}% fin.${bank}`)
  }
  if (fb?.fgts_percent) parts.push(`${fb.fgts_percent}% FGTS`)
  if (fb?.permuta_percent) parts.push(`${fb.permuta_percent}% permuta`)
  if (fb?.consorcio_percent) parts.push(`${fb.consorcio_percent}% consórcio`)

  if (parts.length > 0) {
    return parts.join(' + ')
  }

  if (modality === 'financiamento') return 'Financiamento bancário'
  if (modality === 'permuta') return 'Permuta como parte'
  if (modality === 'consorcio') return 'Carta de consórcio'
  if (modality === 'fgts') return 'Recursos FGTS'
  return 'Composição mista'
}

// Calculate potential lead value
export function getClientPotentialValue(client: Client, property?: Property | null): number {
  if (property?.price) return property.price
  if (client.financial_breakdown?.cash_amount) {
    const cash = client.financial_breakdown.cash_amount
    const pct = client.financial_breakdown.cash_percent || 20
    if (pct > 0 && pct < 100) {
      return Math.round((cash / pct) * 100)
    }
    return cash
  }
  return 0
}

export function CRMKanbanCard({
  client,
  property,
  onClientClick,
  onPropertyClick,
  onAdvanceStage,
  isDragging = false,
}: CRMKanbanCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const potentialVal = getClientPotentialValue(client, property)
  const financialSummary = getFinancialSummary(client, property)
  const leadAge = formatLeadAge(client.created)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', client.id)
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ id: client.id, status: client.status }),
    )
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClientClick(client)}
      className={`group relative rounded-xl bg-white p-3.5 border transition-all cursor-pointer shadow-xs select-none ${
        isDragging
          ? 'opacity-40 scale-95 border-dashed border-[#D4AF37]'
          : 'hover:shadow-md hover:border-[#D4AF37]/70 active:scale-[0.99] border-gray-200/80'
      }`}
    >
      {/* Top Header: Client Name, Age badge & Grip Handle */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-3.5 rounded-full bg-[#D4AF37] shrink-0"
              title="Prioridade Vera Lúcia"
            />
            <h4 className="font-bold text-xs sm:text-sm text-[#1A3636] truncate group-hover:text-[#D4AF37] transition-colors">
              {client.name}
            </h4>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>{leadAge}</span>
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          <span
            className="p-1 text-gray-300 group-hover:text-gray-500 cursor-grab active:cursor-grabbing"
            title="Arraste para mudar de etapa"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Property of Interest Pill (Clickable) */}
      {property ? (
        <div
          onClick={(e) => {
            e.stopPropagation()
            onPropertyClick(property)
          }}
          className="mt-2.5 p-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 transition-colors flex items-center justify-between gap-1.5 text-left group/prop"
          title="Ver detalhes deste apartamento/imóvel"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <div className="truncate">
              <span className="text-[11px] font-semibold text-emerald-950 truncate block group-hover/prop:underline">
                {property.title}
              </span>
              <span className="text-[9px] text-emerald-700 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {property.neighborhood || 'Porto Alegre'}
              </span>
            </div>
          </div>
          <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0 opacity-70 group-hover/prop:opacity-100" />
        </div>
      ) : client.expand?.visit_property_id ? (
        <div
          onClick={(e) => {
            e.stopPropagation()
            onPropertyClick(client.expand!.visit_property_id!)
          }}
          className="mt-2.5 p-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 transition-colors flex items-center justify-between gap-1.5 text-left group/prop"
          title="Ver detalhes deste imóvel"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <div className="truncate">
              <span className="text-[11px] font-semibold text-emerald-950 truncate block group-hover/prop:underline">
                {client.expand.visit_property_id.title}
              </span>
              <span className="text-[9px] text-emerald-700">
                {client.expand.visit_property_id.neighborhood || 'Porto Alegre'}
              </span>
            </div>
          </div>
          <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0" />
        </div>
      ) : null}

      {/* Financial Composition Badge */}
      <div className="mt-2.5 space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-500 font-medium flex items-center gap-1 text-[10px]">
            <Percent className="w-3 h-3 text-[#D4AF37]" /> Modalidade:
          </span>
          <span className="font-semibold text-[#1A3636] text-[10px]">
            {client.purchase_modality === 'a_vista' && 'À Vista'}
            {client.purchase_modality === 'financiamento' && 'Financiamento'}
            {client.purchase_modality === 'consorcio' && 'Consórcio'}
            {client.purchase_modality === 'permuta' && 'Permuta'}
            {client.purchase_modality === 'fgts' && 'FGTS'}
            {client.purchase_modality === 'misto' && 'Misto'}
            {!client.purchase_modality && 'Em análise'}
          </span>
        </div>

        <div
          className="p-1.5 rounded-md bg-amber-50/60 border border-amber-200/50 text-[10px] text-amber-900 font-medium truncate"
          title={financialSummary}
        >
          {financialSummary}
        </div>
      </div>

      {/* Value & Phone Footer */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 text-[11px] min-w-0">
        {potentialVal > 0 ? (
          <div className="min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold leading-none">
              Potencial
            </span>
            <span className="font-extrabold text-[#1A3636] text-xs break-all sm:break-normal">
              R$ {potentialVal.toLocaleString('pt-BR')}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-gray-400 italic">Ticket em definição</span>
        )}

        {client.phone && (
          <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono shrink-0 truncate">
            <Phone className="w-3 h-3 text-[#D4AF37] shrink-0" />
            <span className="truncate">{client.phone}</span>
          </span>
        )}
      </div>

      {/* Quick Advance hover button */}
      {onAdvanceStage && client.status !== 'closing' && client.status !== 'lost' && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">Ver ficha completa →</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onAdvanceStage(client)
            }}
            className="h-6 px-2 text-[10px] font-semibold text-[#1A3636] hover:bg-[#1A3636] hover:text-white rounded gap-1 transition-colors"
            title="Avançar para o próximo estágio"
          >
            Avançar <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
