/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Expand proposals status values to include 'counter_sent'
    // In PocketBase, to update SelectField values on an existing collection, we can modify the field
    const proposals = app.findCollectionByNameOrId('proposals')
    const statusField = proposals.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'drafted',
        'sent',
        'docs_pending',
        'under_review',
        'counter_sent',
        'accepted',
        'rejected',
      ]
    }

    if (!proposals.fields.getByName('counter_offer')) {
      proposals.fields.add(
        new JSONField({
          name: 'counter_offer',
        }),
      )
    }

    if (!proposals.fields.getByName('access_token')) {
      proposals.fields.add(
        new TextField({
          name: 'access_token',
        }),
      )
    }

    app.save(proposals)

    // 2. Create notifications collection
    // Accessible for list/view/create/update/delete so Vera and hooks can manage them
    const notifications = new Collection({
      name: 'notifications',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'message', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          values: [
            'proposal_new',
            'proposal_updated',
            'document_uploaded',
            'counter_accepted',
            'counter_rejected',
            'general',
          ],
          maxSelect: 1,
        },
        { name: 'client_name', type: 'text' },
        { name: 'client_id', type: 'text' },
        { name: 'proposal_id', type: 'text' },
        { name: 'link', type: 'text' },
        { name: 'read', type: 'bool' },
        { name: 'metadata', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_notifications_read ON notifications (read)',
        'CREATE INDEX idx_notifications_created ON notifications (created)',
      ],
    })
    app.save(notifications)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('notifications'))
    } catch (_) {}

    try {
      const proposals = app.findCollectionByNameOrId('proposals')
      if (proposals.fields.getByName('counter_offer')) {
        proposals.fields.removeByName('counter_offer')
      }
      if (proposals.fields.getByName('access_token')) {
        proposals.fields.removeByName('access_token')
      }
      app.save(proposals)
    } catch (_) {}
  },
)
