import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CRMKanbanCard, getClientPotentialValue } from './CRMKanbanCard'
import type { Client, Property, ClientStatus } from '@/types'

export interface KanbanColumnDef {
  key: ClientStatus
  label: string
  sublabel: string
  colorBadge: string
  borderColor: string
  accentColor: string
}

export const KANBAN_STAGES: KanbanColumnDef[] = [
  {
    key: 'lead',
    label: 'Novo Lead',
    sublabel: 'Chegada / Primeiro contato',
    colorBadge: 'bg-blue-100 text-blue-800 border-blue-200',
    borderColor: 'border-t-blue-500',
    accentColor: '#3b82f6',
  },
  {
    key: 'contact',
    label: 'Contato Realizado',
    sublabel: 'Qualificação & Sondagem',
    colorBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    borderColor: 'border-t-indigo-500',
    accentColor: '#6366f1',
  },
  {
    key: 'visit',
    label: 'Visita Agendada',
    sublabel: 'Apresentação presencial',
    colorBadge: 'bg-amber-100 text-amber-800 border-amber-200',
    borderColor: 'border-t-amber-500',
    accentColor: '#f59e0b',
  },
  {
    key: 'proposal',
    label: 'Proposta / Em Análise',
    sublabel: 'Valores, docs & negociação',
    colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    borderColor: 'border-t-emerald-600',
    accentColor: '#059669',
  },
  {
    key: 'closing',
    label: 'Fechamento / Vendido',
    sublabel: 'Minuta assinada & ganho',
    colorBadge: 'bg-yellow-100 text-yellow-900 border-[#D4AF37]',
    borderColor: 'border-t-[#D4AF37]',
    accentColor: '#D4AF37',
  },
  {
    key: 'lost',
    label: 'Perdido / Desistiu',
    sublabel: 'Arquivado ou sem fit atual',
    colorBadge: 'bg-gray-100 text-gray-700 border-gray-200',
    borderColor: 'border-t-gray-400',
    accentColor: '#9ca3af',
  },
]

interface CRMKanbanColumnProps {
  column: KanbanColumnDef
  clients: Client[]
  propertiesMap: Map<string, Property>
  onClientClick: (client: Client) => void
  onPropertyClick: (property: Property) => void
  onAdvanceStage: (client: Client) => void
  onDropClient: (clientId: string, newStatus: ClientStatus) => void
  onQuickAdd?: (status: ClientStatus) => void
}

export function CRMKanbanColumn({
  column,
  clients,
  propertiesMap,
  onClientClick,
  onPropertyClick,
  onAdvanceStage,
  onDropClient,
  onQuickAdd,
}: CRMKanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  // Total column potential value sum
  const totalColumnValue = clients.reduce((acc, c) => {
    const propId = c.interested_property_ids?.[0] || c.visit_property_id
    const prop = propId ? propertiesMap.get(propId) : null
    return acc + getClientPotentialValue(c, prop)
  }, 0)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only toggle if leaving column bounds
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const clientId = e.dataTransfer.getData('text/plain')
    if (clientId) {
      onDropClient(clientId, column.key)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col min-w-[280px] sm:min-w-[310px] max-w-[340px] flex-1 bg-[#F9FAFB] rounded-2xl border transition-all duration-200 border-t-4 ${
        column.borderColor
      } ${
        isDragOver
          ? 'bg-amber-50/60 border-[#D4AF37] ring-2 ring-[#D4AF37]/30 scale-[1.01]'
          : 'border-gray-200 shadow-2xs'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 pb-2.5 border-b border-gray-200/70 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#1A3636] tracking-tight">{column.label}</h3>
            <Badge
              variant="outline"
              className={`text-[11px] font-extrabold px-2 py-0 h-5 rounded-full ${column.colorBadge}`}
            >
              {clients.length}
            </Badge>
          </div>

          {onQuickAdd && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onQuickAdd(column.key)}
              className="h-6 w-6 text-gray-400 hover:text-[#1A3636] hover:bg-white rounded-md"
              title={`Adicionar lead nesta etapa (${column.label})`}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Sublabel & Potential Total */}
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span className="truncate">{column.sublabel}</span>
          {totalColumnValue > 0 && (
            <span className="font-bold text-[#1A3636] shrink-0 bg-white px-1.5 py-0.5 rounded border border-gray-200">
              R$ {(totalColumnValue / 1000000).toFixed(1)}M
            </span>
          )}
        </div>
      </div>

      {/* Cards List Area */}
      <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto min-h-[380px] max-h-[calc(100vh-280px)]">
        {clients.length === 0 ? (
          <div
            className={`h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-colors ${
              isDragOver
                ? 'border-[#D4AF37] bg-white text-[#1A3636]'
                : 'border-gray-200 text-gray-400 bg-white/40'
            }`}
          >
            <p className="text-xs font-medium">Nenhum cliente nesta etapa</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Arraste um card para cá</p>
          </div>
        ) : (
          clients.map((client) => {
            const propId = client.interested_property_ids?.[0] || client.visit_property_id
            const prop = propId ? propertiesMap.get(propId) : null
            return (
              <CRMKanbanCard
                key={client.id}
                client={client}
                property={prop}
                onClientClick={onClientClick}
                onPropertyClick={onPropertyClick}
                onAdvanceStage={onAdvanceStage}
              />
            )
          })
        )}
      </div>

      {/* Column Footer: Total footer count summary */}
      <div className="p-2 px-3 bg-white/80 border-t border-gray-200/70 rounded-b-2xl text-[10px] text-gray-500 flex items-center justify-between">
        <span>
          {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
        </span>
        {totalColumnValue > 0 ? (
          <span className="font-semibold text-gray-700">
            Total: R$ {totalColumnValue.toLocaleString('pt-BR')}
          </span>
        ) : (
          <span>Sem valor alocado</span>
        )}
      </div>
    </div>
  )
}
