import pb from '@/lib/pocketbase/client'
import type { CalendarEvent } from '@/types'

export async function syncGoogleCalendar(connectedOverride?: boolean): Promise<{
  success: boolean
  connected: boolean
  events: CalendarEvent[]
  synced_at: string
  message: string
}> {
  const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/sync-google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify({
      action: 'sync',
      connected: connectedOverride,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Falha ao sincronizar agenda')
  }

  return await res.json()
}
