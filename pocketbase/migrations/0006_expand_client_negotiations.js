/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Expand proposals collection if needed
    const proposals = app.findCollectionByNameOrId('proposals')

    if (!proposals.fields.getByName('simulation_data')) {
      proposals.fields.add(
        new JSONField({
          name: 'simulation_data',
        }),
      )
    }

    if (!proposals.fields.getByName('notes_client')) {
      proposals.fields.add(
        new TextField({
          name: 'notes_client',
        }),
      )
    }

    if (!proposals.fields.getByName('counter_proposal_notes')) {
      proposals.fields.add(
        new TextField({
          name: 'counter_proposal_notes',
        }),
      )
    }

    if (!proposals.fields.getByName('negotiation_stage')) {
      proposals.fields.add(
        new SelectField({
          name: 'negotiation_stage',
          values: [
            'visita_realizada',
            'proposta_enviada',
            'proposta_em_analise',
            'proposta_aprovada',
            'documentacao',
            'analise_credito',
            'contrato_assinado',
            'concluido',
          ],
          maxSelect: 1,
        }),
      )
    }

    app.save(proposals)

    // 2. Expand clients collection if needed
    const clients = app.findCollectionByNameOrId('clients')
    if (!clients.fields.getByName('broker_message')) {
      clients.fields.add(
        new TextField({
          name: 'broker_message',
        }),
      )
    }
    app.save(clients)
  },
  (app) => {
    try {
      const proposals = app.findCollectionByNameOrId('proposals')
      if (proposals.fields.getByName('simulation_data')) {
        proposals.fields.removeByName('simulation_data')
      }
      if (proposals.fields.getByName('notes_client')) {
        proposals.fields.removeByName('notes_client')
      }
      if (proposals.fields.getByName('counter_proposal_notes')) {
        proposals.fields.removeByName('counter_proposal_notes')
      }
      if (proposals.fields.getByName('negotiation_stage')) {
        proposals.fields.removeByName('negotiation_stage')
      }
      app.save(proposals)
    } catch (_) {}

    try {
      const clients = app.findCollectionByNameOrId('clients')
      if (clients.fields.getByName('broker_message')) {
        clients.fields.removeByName('broker_message')
      }
      app.save(clients)
    } catch (_) {}
  },
)
