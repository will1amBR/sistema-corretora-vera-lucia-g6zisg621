/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const clients = app.findCollectionByNameOrId('clients')
    const proposals = app.findCollectionByNameOrId('proposals')
    const documents = app.findCollectionByNameOrId('documents')

    // 1. Add fields to documents collection to support versioning, resubmission and audit
    if (!documents.fields.getByName('version')) {
      documents.fields.add(
        new NumberField({
          name: 'version',
          min: 1,
          onlyInt: true,
        }),
      )
    }

    if (!documents.fields.getByName('history')) {
      documents.fields.add(
        new JSONField({
          name: 'history',
        }),
      )
    }

    if (!documents.fields.getByName('reviewed_at')) {
      documents.fields.add(
        new DateField({
          name: 'reviewed_at',
        }),
      )
    }

    if (!documents.fields.getByName('reviewed_by')) {
      documents.fields.add(
        new TextField({
          name: 'reviewed_by',
        }),
      )
    }

    app.save(documents)

    // 2. Create document_events collection for formal append-only event stream
    let docEvents
    try {
      docEvents = app.findCollectionByNameOrId('document_events')
    } catch (_) {
      docEvents = new Collection({
        name: 'document_events',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'document_id',
            type: 'relation',
            collectionId: documents.id,
            maxSelect: 1,
          },
          {
            name: 'client_id',
            type: 'relation',
            collectionId: clients.id,
            required: true,
            maxSelect: 1,
          },
          {
            name: 'proposal_id',
            type: 'relation',
            collectionId: proposals.id,
            maxSelect: 1,
          },
          { name: 'document_type', type: 'text', required: true },
          { name: 'document_title', type: 'text' },
          {
            name: 'action',
            type: 'select',
            values: ['uploaded', 'resubmitted', 'approved', 'rejected', 'commented', 'deleted'],
            required: true,
            maxSelect: 1,
          },
          { name: 'actor_name', type: 'text' },
          {
            name: 'actor_role',
            type: 'select',
            values: ['client', 'broker', 'system'],
            maxSelect: 1,
          },
          { name: 'note', type: 'text' },
          { name: 'version', type: 'number' },
          { name: 'metadata', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_doc_events_client ON document_events (client_id, created DESC)',
          'CREATE INDEX idx_doc_events_doc ON document_events (document_id, created DESC)',
          'CREATE INDEX idx_doc_events_action ON document_events (action)',
        ],
      })
      app.save(docEvents)
    }

    // 3. Seed some initial events for Camila Torres & Rodrigo Mendes so the client and Vera have rich initial history
    try {
      const camila = app.findFirstRecordByData('clients', 'portal_token', 'token_camila_torres_88b')
      const camilaProposal = app.findFirstRecordByData('proposals', 'client_id', camila.id)

      // Create a couple of seeded documents if none exist for Camila
      const existingDocs = app.findRecordsByFilter(
        'documents',
        `client_id = "${camila.id}"`,
        '-created',
        1,
        0,
      )
      if (existingDocs.length === 0) {
        // Doc 1: RG (Aprovado pela Vera)
        const d1 = new Record(documents)
        d1.set('client_id', camila.id)
        if (camilaProposal) d1.set('proposal_id', camilaProposal.id)
        d1.set('type', 'RG / CNH')
        d1.set('title', 'RG Frente e Verso - Dra. Camila Torres.pdf')
        d1.set('status', 'verified')
        d1.set('version', 1)
        d1.set('notes', 'Documento perfeitamente legível. Conferido com certidão.')
        d1.set('reviewed_by', 'Vera Lúcia Koren')
        d1.set('reviewed_at', '2026-09-02 14:15:00.000Z')
        d1.set('history', [
          {
            action: 'uploaded',
            actor_name: 'Dra. Camila Torres',
            actor_role: 'client',
            version: 1,
            date: '2026-09-02 10:20:00.000Z',
            note: 'Primeiro envio do RG digital.',
          },
          {
            action: 'approved',
            actor_name: 'Vera Lúcia Koren',
            actor_role: 'broker',
            version: 1,
            date: '2026-09-02 14:15:00.000Z',
            note: 'Documento perfeitamente legível. Conferido com certidão.',
          },
        ])
        app.save(d1)

        // Events for d1
        const ev1 = new Record(docEvents)
        ev1.set('document_id', d1.id)
        ev1.set('client_id', camila.id)
        if (camilaProposal) ev1.set('proposal_id', camilaProposal.id)
        ev1.set('document_type', 'RG / CNH')
        ev1.set('document_title', 'RG Frente e Verso - Dra. Camila Torres.pdf')
        ev1.set('action', 'uploaded')
        ev1.set('actor_name', 'Dra. Camila Torres')
        ev1.set('actor_role', 'client')
        ev1.set('version', 1)
        ev1.set('note', 'Documento enviado pelo cofre seguro do portal.')
        app.save(ev1)

        const ev2 = new Record(docEvents)
        ev2.set('document_id', d1.id)
        ev2.set('client_id', camila.id)
        if (camilaProposal) ev2.set('proposal_id', camilaProposal.id)
        ev2.set('document_type', 'RG / CNH')
        ev2.set('document_title', 'RG Frente e Verso - Dra. Camila Torres.pdf')
        ev2.set('action', 'approved')
        ev2.set('actor_name', 'Vera Lúcia Koren')
        ev2.set('actor_role', 'broker')
        ev2.set('version', 1)
        ev2.set('note', 'Documento perfeitamente legível. Conferido com certidão.')
        app.save(ev2)

        // Doc 2: Comprovante de Renda (v2 - Reenviado e em análise)
        const d2 = new Record(documents)
        d2.set('client_id', camila.id)
        if (camilaProposal) d2.set('proposal_id', camilaProposal.id)
        d2.set('type', 'Comprovante de Renda')
        d2.set('title', 'Holerites Recentes Moinhos de Vento - V2.pdf')
        d2.set('status', 'pending')
        d2.set('version', 2)
        d2.set('notes', 'Aguardando conferência do último mês anexado na v2.')
        d2.set('history', [
          {
            action: 'uploaded',
            actor_name: 'Dra. Camila Torres',
            actor_role: 'client',
            version: 1,
            date: '2026-09-02 11:00:00.000Z',
            note: 'Envio dos holerites anteriores.',
          },
          {
            action: 'rejected',
            actor_name: 'Vera Lúcia Koren',
            actor_role: 'broker',
            version: 1,
            date: '2026-09-03 09:30:00.000Z',
            note: 'Faltou o contracheque do mês mais recente (agosto). Favor reenviar com os 3 meses completos.',
          },
          {
            action: 'resubmitted',
            actor_name: 'Dra. Camila Torres',
            actor_role: 'client',
            version: 2,
            date: '2026-09-03 14:00:00.000Z',
            note: 'Reenvio com contracheques de junho, julho e agosto atualizados.',
          },
        ])
        app.save(d2)

        const ev3 = new Record(docEvents)
        ev3.set('document_id', d2.id)
        ev3.set('client_id', camila.id)
        if (camilaProposal) ev3.set('proposal_id', camilaProposal.id)
        ev3.set('document_type', 'Comprovante de Renda')
        ev3.set('document_title', 'Holerites Recentes Moinhos de Vento - V2.pdf')
        ev3.set('action', 'resubmitted')
        ev3.set('actor_name', 'Dra. Camila Torres')
        ev3.set('actor_role', 'client')
        ev3.set('version', 2)
        ev3.set('note', 'Nova versão enviada com os 3 últimos contracheques completos.')
        app.save(ev3)
      }
    } catch (err) {
      console.log('Seed sample doc events note:', err)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('document_events'))
    } catch (_) {}
  },
)
