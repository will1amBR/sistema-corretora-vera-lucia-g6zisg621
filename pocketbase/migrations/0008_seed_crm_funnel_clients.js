/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const clients = app.findCollectionByNameOrId('clients')
    const properties = app.findCollectionByNameOrId('properties')

    // Find sample properties from Porto Alegre
    let moinhosPropId = ''
    let petropolisPropId = ''
    let belaVistaPropId = ''
    let auxiliadoraPropId = ''
    let meninoDeusPropId = ''

    try {
      const p = app.findFirstRecordByData(
        'properties',
        'title',
        'Apartamento Alto Padrão no Moinhos de Vento',
      )
      moinhosPropId = p.id
    } catch (_) {}

    try {
      const p = app.findFirstRecordByData(
        'properties',
        'title',
        'Apartamento Garden com Pátio Privativo no Petrópolis',
      )
      petropolisPropId = p.id
    } catch (_) {}

    try {
      const p = app.findFirstRecordByData(
        'properties',
        'title',
        'Cobertura Horizontal Exclusiva em Bela Vista',
      )
      belaVistaPropId = p.id
    } catch (_) {}

    try {
      const p = app.findFirstRecordByData(
        'properties',
        'title',
        'Apartamento Moderno e Ensolarado no Auxiliadora',
      )
      auxiliadoraPropId = p.id
    } catch (_) {}

    try {
      const p = app.findFirstRecordByData(
        'properties',
        'title',
        'Apartamento Vista Guaíba no Menino Deus',
      )
      meninoDeusPropId = p.id
    } catch (_) {}

    const sampleClients = [
      {
        name: 'Guilherme Siqueira & Mariana',
        email: 'guilherme.siqueira@exemplo.com.br',
        phone: '(51) 99341-2090',
        status: 'lead',
        purchase_modality: 'misto',
        financial_breakdown: {
          cash_percent: 20,
          cash_amount: 500000,
          finance_percent: 80,
          finance_bank: 'Itaú Personalité',
          notes: 'Pré-análise efetuada no portal Itaú, renda familiar compatível.',
        },
        objectives:
          'Busca apartamento de 3 dormitórios com churrasqueira no Moinhos de Vento ou Bela Vista.',
        objections_notes: 'Dúvida se a taxa de condomínio inclui aquecimento central e gerador.',
        interested_property_ids: moinhosPropId ? [moinhosPropId] : [],
        visit_property_id: moinhosPropId || '',
        portal_token: 'token_guilherme_siqueira_90a',
        notes: 'Contato originado pelo anúncio no Instagram.',
      },
      {
        name: 'Dra. Beatriz Hoffmann',
        email: 'beatriz.hoffmann@exemplo.com.br',
        phone: '(51) 98112-4433',
        status: 'contact',
        purchase_modality: 'financiamento',
        financial_breakdown: {
          cash_percent: 30,
          cash_amount: 420000,
          finance_percent: 70,
          finance_bank: 'Bradesco Prime',
          notes: 'Médica no Hospital Moinhos de Vento, quer agilidade na tramitação bancária.',
        },
        objectives:
          'Apartamento com pátio ou garden privativo no Petrópolis para seu pet da raça Golden.',
        objections_notes: 'Prefere andar baixo ou garden com total privacidade visual.',
        interested_property_ids: petropolisPropId ? [petropolisPropId] : [],
        visit_property_id: petropolisPropId || '',
        portal_token: 'token_beatriz_hoffmann_33b',
        notes: 'Vera realizou primeiro contato por WhatsApp com ótimo retorno.',
      },
      {
        name: 'Engenheiro Marcelo Alencar',
        email: 'marcelo.alencar@exemplo.com.br',
        phone: '(51) 99887-5511',
        status: 'visit',
        purchase_modality: 'permuta',
        financial_breakdown: {
          cash_percent: 50,
          cash_amount: 840000,
          permuta_percent: 50,
          permuta_item_desc: 'Apartamento de 2 dormitórios na Cidade Baixa avaliado em R$ 800.000.',
          notes: 'Dispõe de recurso em conta garantido para a diferença.',
        },
        objectives: 'Upgrade para imóvel ensolarado no Auxiliadora com lareira e duas suítes.',
        objections_notes:
          'Precisa que o proprietário avalie o imóvel de permuta com margem justa de mercado.',
        interested_property_ids: auxiliadoraPropId ? [auxiliadoraPropId] : [],
        visit_property_id: auxiliadoraPropId || '',
        visit_scheduled_at: '2025-06-15 10:00:00.000Z',
        visit_notes: 'Visita agendada para sábado às 10h. Cliente quer medir espaço da varanda.',
        portal_token: 'token_marcelo_alencar_11c',
        notes: 'Cliente muito analítico e focado em posição solar Norte.',
      },
      {
        name: 'Dr. Fernando Vasconcellos',
        email: 'fernando.vasconcellos@exemplo.com.br',
        phone: '(51) 99765-8822',
        status: 'closing',
        purchase_modality: 'a_vista',
        financial_breakdown: {
          cash_percent: 100,
          cash_amount: 4980000,
          notes: 'Recursos disponíveis em fundo de investimento D+1 para liquidação imediata.',
        },
        objectives:
          'Cobertura de alto luxo com piscina privativa e vista perene para o Guaíba em Bela Vista.',
        objections_notes:
          'Solicitou inclusão da mobília planejada e ar condicionado central na minuta.',
        interested_property_ids: belaVistaPropId ? [belaVistaPropId] : [],
        visit_property_id: belaVistaPropId || '',
        portal_token: 'token_fernando_vasconcellos_22d',
        notes: 'Minuta de compra e venda em fase final de validação jurídica!',
      },
      {
        name: 'Juliana e Renato Prado',
        email: 'juliana.prado@exemplo.com.br',
        phone: '(51) 99234-9988',
        status: 'lost',
        purchase_modality: 'financiamento',
        financial_breakdown: {
          cash_percent: 15,
          cash_amount: 170000,
          finance_percent: 85,
          finance_bank: 'Caixa Econômica',
          notes: 'Teto de crédito aprovado ficou abaixo do necessário para o imóvel desejado.',
        },
        objectives: 'Apartamento com vista para o Guaíba no Menino Deus.',
        objections_notes:
          'Valor das parcelas na amortização SAC ficou acima do teto estipulado pela família.',
        interested_property_ids: meninoDeusPropId ? [meninoDeusPropId] : [],
        visit_property_id: meninoDeusPropId || '',
        portal_token: 'token_juliana_prado_88e',
        notes: 'Manter na base para futuros lançamentos com metragem mais compacta.',
      },
    ]

    for (const c of sampleClients) {
      try {
        app.findFirstRecordByData('clients', 'email', c.email)
      } catch (_) {
        const record = new Record(clients)
        record.set('name', c.name)
        record.set('email', c.email)
        record.set('phone', c.phone)
        record.set('status', c.status)
        record.set('purchase_modality', c.purchase_modality)
        record.set('financial_breakdown', c.financial_breakdown)
        record.set('objectives', c.objectives)
        record.set('objections_notes', c.objections_notes)
        record.set('interested_property_ids', c.interested_property_ids)
        record.set('portal_token', c.portal_token)
        record.set('notes', c.notes)
        if (c.visit_property_id) {
          record.set('visit_property_id', c.visit_property_id)
        }
        if (c.visit_scheduled_at) {
          record.set('visit_scheduled_at', c.visit_scheduled_at)
        }
        if (c.visit_notes) {
          record.set('visit_notes', c.visit_notes)
        }
        app.save(record)
      }
    }
  },
  (app) => {
    // rollback if needed
  },
)
