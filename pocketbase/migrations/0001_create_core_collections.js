/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Extend users with role if not present
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'client'],
          maxSelect: 1,
        }),
      )
      app.save(users)
    }

    // 2. properties collection
    const properties = new Collection({
      name: 'properties',
      type: 'base',
      listRule: '', // public listing
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'neighborhood', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'price', type: 'number' },
        { name: 'bedrooms', type: 'number' },
        { name: 'bathrooms', type: 'number' },
        { name: 'suites', type: 'number' },
        { name: 'parking_spots', type: 'number' },
        { name: 'area_sqm', type: 'number' },
        {
          name: 'modality',
          type: 'select',
          values: ['sale', 'rent', 'financing', 'permuta'],
          maxSelect: 1,
        },
        { name: 'status', type: 'select', values: ['available', 'reserved', 'sold'], maxSelect: 1 },
        { name: 'features', type: 'json' },
        { name: 'images', type: 'file', maxSelect: 10, maxSize: 10485760 },
        { name: 'featured', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_properties_status ON properties (status)',
        'CREATE INDEX idx_properties_modality ON properties (modality)',
      ],
    })
    app.save(properties)

    // 3. clients collection
    const clients = new Collection({
      name: 'clients',
      type: 'base',
      listRule: '', // allow public lead creation and reads
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['lead', 'contact', 'visit', 'proposal', 'closing', 'lost'],
          maxSelect: 1,
        },
        {
          name: 'purchase_modality',
          type: 'select',
          values: ['a_vista', 'financiamento', 'consorcio', 'permuta', 'fgts', 'misto'],
          maxSelect: 1,
        },
        { name: 'financial_breakdown', type: 'json' }, // e.g. { cash_percent: 20, finance_percent: 80, bank: "Itaú", fgts_val: 0 }
        { name: 'objectives', type: 'text' }, // Metas de compra, bairros preferidos, prazo
        { name: 'objections_notes', type: 'text' }, // Objeções levantadas
        { name: 'interested_property_ids', type: 'json' }, // lista de IDs de imóveis
        { name: 'google_event_id', type: 'text' },
        { name: 'visit_scheduled_at', type: 'date' },
        { name: 'visit_property_id', type: 'relation', collectionId: properties.id, maxSelect: 1 },
        { name: 'visit_notes', type: 'text' },
        { name: 'portal_token', type: 'text' }, // magic link token
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clients_status ON clients (status)',
        'CREATE INDEX idx_clients_email ON clients (email)',
        'CREATE INDEX idx_clients_portal_token ON clients (portal_token)',
      ],
    })
    app.save(clients)

    // 4. proposals collection
    const proposals = new Collection({
      name: 'proposals',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'client_id',
          type: 'relation',
          collectionId: clients.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'property_id',
          type: 'relation',
          collectionId: properties.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'value', type: 'number' },
        { name: 'down_payment', type: 'number' },
        { name: 'financing_value', type: 'number' },
        { name: 'bank_partner', type: 'text' },
        { name: 'payment_terms', type: 'text' },
        { name: 'conditions', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['drafted', 'sent', 'docs_pending', 'under_review', 'accepted', 'rejected'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_proposals_client ON proposals (client_id)',
        'CREATE INDEX idx_proposals_property ON proposals (property_id)',
        'CREATE INDEX idx_proposals_status ON proposals (status)',
      ],
    })
    app.save(proposals)

    // 5. documents collection
    const documents = new Collection({
      name: 'documents',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'client_id', type: 'relation', collectionId: clients.id, maxSelect: 1 },
        { name: 'proposal_id', type: 'relation', collectionId: proposals.id, maxSelect: 1 },
        { name: 'type', type: 'text' }, // "RG / CNH", "CPF", "Comprovante de Renda", "Comprovante de Residência", "Certidão de Estado Civil", "Extrato FGTS", "Carta de Consórcio", "Outros"
        { name: 'title', type: 'text' },
        { name: 'file', type: 'file', maxSelect: 1, maxSize: 15728640 },
        {
          name: 'status',
          type: 'select',
          values: ['pending', 'verified', 'rejected'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_documents_client ON documents (client_id)',
        'CREATE INDEX idx_documents_proposal ON documents (proposal_id)',
      ],
    })
    app.save(documents)

    // 6. objections collection
    const objections = new Collection({
      name: 'objections',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          values: ['price', 'location', 'financing', 'timing', 'renovation', 'market', 'other'],
          maxSelect: 1,
        },
        { name: 'description', type: 'text' },
        { name: 'ai_response', type: 'text' },
        { name: 'key_tactics', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_objections_cat ON objections (category)'],
    })
    app.save(objections)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('objections'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('documents'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('proposals'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('clients'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('properties'))
    } catch (_) {}
  },
)
