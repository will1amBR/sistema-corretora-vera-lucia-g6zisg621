import React, { useMemo } from 'react'
import { CRMKanbanColumn, KANBAN_STAGES } from './CRMKanbanColumn'
import type { Client, Property, ClientStatus } from '@/types'

interface CRMKanbanBoardProps {
  clients: Client[]
  properties: Property[]
  onClientClick: (client: Client) => void
  onPropertyClick: (property: Property) => void
  onAdvanceStage: (client: Client) => void
  onDropClient: (clientId: string, newStatus: ClientStatus) => void
  onQuickAdd?: (status: ClientStatus) => void
}

export function CRMKanbanBoard({
  clients,
  properties,
  onClientClick,
  onPropertyClick,
  onAdvanceStage,
  onDropClient,
  onQuickAdd,
}: CRMKanbanBoardProps) {
  // Map properties by ID for instant O(1) lookup
  const propertiesMap = useMemo(() => {
    const map = new Map<string, Property>()
    properties.forEach((p) => map.set(p.id, p))
    return map
  }, [properties])

  // Group clients by status
  const clientsByStatus = useMemo(() => {
    const grouped: Record<ClientStatus, Client[]> = {
      lead: [],
      contact: [],
      visit: [],
      proposal: [],
      closing: [],
      lost: [],
    }

    clients.forEach((c) => {
      if (grouped[c.status]) {
        grouped[c.status].push(c)
      } else {
        grouped.lead.push(c)
      }
    })

    return grouped
  }, [clients])

  return (
    <div className="relative">
      {/* Scrollable horizontal container with custom smooth scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory md:snap-none">
        {KANBAN_STAGES.map((col) => (
          <div key={col.key} className="snap-start">
            <CRMKanbanColumn
              column={col}
              clients={clientsByStatus[col.key] || []}
              propertiesMap={propertiesMap}
              onClientClick={onClientClick}
              onPropertyClick={onPropertyClick}
              onAdvanceStage={onAdvanceStage}
              onDropClient={onDropClient}
              onQuickAdd={onQuickAdd}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
