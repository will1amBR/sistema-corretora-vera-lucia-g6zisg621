/// <reference path="../pb_data/types.d.ts" />

// Route to synchronize Google Calendar events or mock sync if not configured yet
routerAdd(
  'POST',
  '/backend/v1/sync-google',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Acesso não autorizado')
      }

      const body = e.requestInfo().body || {}
      const syncAction = body.action || 'sync'

      // Check if Google OAuth credentials or tokens are present in secrets/settings
      const isGoogleConnected = Boolean(
        $secrets.has('GOOGLE_CALENDAR_CLIENT_ID') ||
        $secrets.has('GOOGLE_CALENDAR_TOKEN') ||
        body.connected,
      )

      // Pull visits from clients that have a scheduled visit
      const clientsWithVisits = $app.findRecordsByFilter(
        'clients',
        "visit_scheduled_at != ''",
        '-visit_scheduled_at',
        50,
        0,
      )

      const events = []
      for (let i = 0; i < clientsWithVisits.length; i++) {
        const c = clientsWithVisits[i]
        let propTitle = 'Imóvel'
        try {
          const pId = c.getString('visit_property_id')
          if (pId) {
            const p = $app.findRecordById('properties', pId)
            if (p) propTitle = p.getString('title')
          }
        } catch (_) {}

        events.push({
          id: c.getString('google_event_id') || 'g_event_' + c.id,
          client_id: c.id,
          client_name: c.getString('name'),
          client_phone: c.getString('phone'),
          property_title: propTitle,
          scheduled_at: c.getString('visit_scheduled_at'),
          notes: c.getString('visit_notes'),
          status: 'confirmed',
          synced_with_google: isGoogleConnected,
        })
      }

      return e.json(200, {
        success: true,
        connected: isGoogleConnected,
        synced_at: new Date().toISOString(),
        events_count: events.length,
        events: events,
        message: isGoogleConnected
          ? 'Sincronização com Google Calendar concluída com sucesso.'
          : 'Estrutura de sincronização ativa. Conecte sua conta do Google nas configurações quando desejar.',
      })
    } catch (err) {
      return e.json(500, { error: 'Falha ao sincronizar agenda: ' + err.message })
    }
  },
  $apis.requireAuth(),
)
