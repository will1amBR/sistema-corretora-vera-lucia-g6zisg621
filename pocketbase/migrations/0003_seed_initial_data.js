/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const properties = app.findCollectionByNameOrId('properties')
    const clients = app.findCollectionByNameOrId('clients')
    const proposals = app.findCollectionByNameOrId('proposals')
    const objections = app.findCollectionByNameOrId('objections')

    // 1. Seed Admin user (Vera Lúcia / William)
    let adminId = ''
    try {
      const existing = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
      adminId = existing.id
    } catch (_) {
      const admin = new Record(users)
      admin.setEmail('william@korenambiental.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Vera Lúcia Koren')
      admin.set('role', 'admin')
      app.save(admin)
      adminId = admin.id
    }

    // Also create a public service user for anonymous AI interactions if needed
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'vera.assistente@sistema.local')
    } catch (_) {
      const serviceUser = new Record(users)
      serviceUser.setEmail('vera.assistente@sistema.local')
      serviceUser.setPassword($security.randomString(24))
      serviceUser.setVerified(true)
      serviceUser.set('name', 'Assistente Vera Service')
      serviceUser.set('role', 'admin')
      app.save(serviceUser)
    }

    // 2. Seed 3 High-End Properties
    let prop1Id = ''
    let prop2Id = ''
    let prop3Id = ''

    try {
      const p1 = app.findFirstRecordByData('properties', 'title', 'Cobertura Duplex nos Jardins')
      prop1Id = p1.id
    } catch (_) {
      const p1 = new Record(properties)
      p1.set('title', 'Cobertura Duplex nos Jardins')
      p1.set(
        'description',
        'Espetacular cobertura duplex totalmente reformada com vista panorâmica 360°, terraço gourmet com piscina privativa aquecida, automação residencial completa e acabamentos em mármore importado. Edifício clássico com segurança patrimonial 24h.',
      )
      p1.set('address', 'Alameda Lorena, 1420')
      p1.set('neighborhood', 'Jardins')
      p1.set('city', 'São Paulo - SP')
      p1.set('price', 4850000)
      p1.set('bedrooms', 4)
      p1.set('bathrooms', 5)
      p1.set('suites', 3)
      p1.set('parking_spots', 4)
      p1.set('area_sqm', 380)
      p1.set('modality', 'sale')
      p1.set('status', 'available')
      p1.set('featured', true)
      p1.set('features', [
        'Piscina Privativa',
        'Terraço Gourmet',
        'Automação Residencial',
        'Ar Condicionado Central',
        'Depósito Privativo',
        'Portaria Blindada',
      ])
      app.save(p1)
      prop1Id = p1.id
    }

    try {
      const p2 = app.findFirstRecordByData(
        'properties',
        'title',
        'Mansão Contemporânea em Condomínio Fechado',
      )
      prop2Id = p2.id
    } catch (_) {
      const p2 = new Record(properties)
      p2.set('title', 'Mansão Contemporânea em Condomínio Fechado')
      p2.set(
        'description',
        'Residência moderna com projeto arquitetônico premiado, pé-direito duplo, integração total entre área social e jardim paisagístico, adega climatizada para 500 garrafas, spa com sauna úmida e energia fotovoltaica instalada.',
      )
      p2.set('address', 'Av. das Palmeiras, Residencial Alphaville 2')
      p2.set('neighborhood', 'Alphaville')
      p2.set('city', 'Barueri - SP')
      p2.set('price', 6200000)
      p2.set('bedrooms', 5)
      p2.set('bathrooms', 6)
      p2.set('suites', 4)
      p2.set('parking_spots', 6)
      p2.set('area_sqm', 560)
      p2.set('modality', 'sale')
      p2.set('status', 'available')
      p2.set('featured', true)
      p2.set('features', [
        'Adega Climatizada',
        'Energia Solar Fotovoltaica',
        'Pé Direito Duplo',
        'Spa com Sauna',
        'Condomínio com Heliponto',
        'Quadra de Tênis',
      ])
      app.save(p2)
      prop2Id = p2.id
    }

    try {
      const p3 = app.findFirstRecordByData(
        'properties',
        'title',
        'Apartamento High-Tech Vila Nova Conceição',
      )
      prop3Id = p3.id
    } catch (_) {
      const p3 = new Record(properties)
      p3.set('title', 'Apartamento High-Tech Vila Nova Conceição')
      p3.set(
        'description',
        'A poucos passos do Parque Ibirapuera, apartamento com living amplo integrado à varanda envidraçada, marcenaria planejada Ornare, suíte master com closet duplo e banheira de imersão. Aceita financiamento bancário e permuta parcial.',
      )
      p3.set('address', 'Rua Diogo Jácome, 650')
      p3.set('neighborhood', 'Vila Nova Conceição')
      p3.set('city', 'São Paulo - SP')
      p3.set('price', 3200000)
      p3.set('bedrooms', 3)
      p3.set('bathrooms', 4)
      p3.set('suites', 3)
      p3.set('parking_spots', 3)
      p3.set('area_sqm', 215)
      p3.set('modality', 'financing')
      p3.set('status', 'available')
      p3.set('featured', true)
      p3.set('features', [
        'Varanda Envidraçada',
        'Marcenaria Ornare',
        'Próximo ao Parque Ibirapuera',
        'Academia Equipada',
        'Gerador Full',
      ])
      app.save(p3)
      prop3Id = p3.id
    }

    // 3. Seed Objections Knowledge Base
    const commonObjections = [
      {
        title: 'Taxa de juros de financiamento bancário está alta no momento',
        category: 'financing',
        description:
          'Cliente hesita em fechar financiamento por causa das taxas atuais do mercado e quer esperar a Selic cair.',
        ai_response:
          'Destaque que o valor do imóvel de alto padrão valoriza acima da inflação enquanto ele espera. Além disso, existe a Portabilidade de Financiamento: ele pode travar o imóvel desejado hoje pelo preço atual e fazer a portabilidade para outro banco com taxa menor assim que a Selic recuar, sem qualquer custo de penalidade.',
        key_tactics: [
          'Enfatizar valorização histórica da região',
          'Explicar o direito à portabilidade de crédito sem taxa',
          'Demonstrar simulação com amortização antecipada',
        ],
      },
      {
        title: 'Preço do imóvel está acima do teto orçamentário do cliente',
        category: 'price',
        description:
          'Cliente gostou do imóvel mas achou a pedida ligeiramente superior ao que pretendia desembolsar.',
        ai_response:
          'Apresente a composição de pagamento mista: combine um valor à vista com entrada facilitada, utilização de FGTS e uma parcela residual parcelada direto com o proprietário ou financiada. Mostre que o custo por metro quadrado e o padrão de acabamentos evitam gastos imediatos de reforma (economia de R$ 300k a 500k).',
        key_tactics: [
          'Comparativo de m² reformado x cru',
          'Composição mista de recursos (FGTS + Entrada + Banco)',
          'Ofertar proposta com carência para o saldo residual',
        ],
      },
      {
        title: 'O cliente precisa vender outro imóvel antes (Permuta obrigatória)',
        category: 'other',
        description:
          'Cliente tem interesse genuíno, mas tem 50% do capital travado em outro imóvel que ainda não foi vendido.',
        ai_response:
          'Proponha estruturar uma proposta com cláusula de permuta como parte de pagamento (até 40-50% do valor) ou ofereça colocar o imóvel dele em gestão de venda acelerada na carteira da Vera com avaliação de liquidez, emitindo proposta com sinal caucionado e prazo de 60 a 90 dias para integralização.',
        key_tactics: [
          'Avaliação prévia do imóvel de permuta com margem de atratividade',
          'Contrato preliminar com prazo de liquidez assistida',
          'Possibilidade de carta de consórcio como ponte',
        ],
      },
      {
        title: 'Localização um pouco distante da escola dos filhos ou do trabalho',
        category: 'location',
        description:
          'Cliente ama a casa/apartamento, mas tem receio do tempo de deslocamento no trânsito diário.',
        ai_response:
          'Destaque os acessos rápidos pelas vias arteriais fora do pico, proximidade de polos corporativos e as opções de conveniência no bairro (shoppings, hospitais de ponta, gastronomia renomada). Além disso, a qualidade de vida, silêncio e segurança do condomínio compensam a rotina semanal.',
        key_tactics: [
          'Mapear rotas e tempos médios em horários flexíveis',
          'Reforçar a valorização do bem-estar e lazer privativo da família',
          'Apresentar infraestrutura completa do condomínio',
        ],
      },
    ]

    for (const obj of commonObjections) {
      try {
        app.findFirstRecordByData('objections', 'title', obj.title)
      } catch (_) {
        const rec = new Record(objections)
        rec.set('title', obj.title)
        rec.set('category', obj.category)
        rec.set('description', obj.description)
        rec.set('ai_response', obj.ai_response)
        rec.set('key_tactics', obj.key_tactics)
        app.save(rec)
      }
    }

    // 4. Seed 2 Sample Leads / Clients
    let client1Id = ''
    let client2Id = ''

    try {
      const c1 = app.findFirstRecordByData('clients', 'email', 'rodrigo.mendes@exemplo.com.br')
      client1Id = c1.id
    } catch (_) {
      const c1 = new Record(clients)
      c1.set('name', 'Rodrigo Mendes de Oliveira')
      c1.set('email', 'rodrigo.mendes@exemplo.com.br')
      c1.set('phone', '(11) 98765-4321')
      c1.set('status', 'visit')
      c1.set('purchase_modality', 'misto')
      c1.set('financial_breakdown', {
        cash_percent: 25,
        cash_amount: 1200000,
        finance_percent: 60,
        finance_bank: 'Itaú Private',
        fgts_percent: 15,
        fgts_amount: 720000,
        notes: 'Possui 25% em aplicação D+0 e carta pré-aprovada no Itaú',
      })
      c1.set(
        'objectives',
        'Busca cobertura duplex ou apartamento garden nos Jardins ou Itaim Bibi, 4 dormitórios para família com 2 filhos e 2 pets. Previsão de mudança em até 4 meses.',
      )
      c1.set(
        'objections_notes',
        'Preocupado com o valor de condomínio e IPTU, quer garantia de boa ventilação.',
      )
      c1.set('interested_property_ids', [prop1Id])
      c1.set('portal_token', 'token_rodrigo_mendes_77a')
      c1.set('visit_scheduled_at', '2025-05-20 14:30:00.000Z')
      c1.set('visit_property_id', prop1Id)
      c1.set(
        'visit_notes',
        'Visita agendada para sábado às 14h30 com a esposa. Levar ficha técnica detalhada.',
      )
      app.save(c1)
      client1Id = c1.id
    }

    try {
      const c2 = app.findFirstRecordByData('clients', 'email', 'camila.torres@exemplo.com.br')
      client2Id = c2.id
    } catch (_) {
      const c2 = new Record(clients)
      c2.set('name', 'Dra. Camila Torres')
      c2.set('email', 'camila.torres@exemplo.com.br')
      c2.set('phone', '(11) 99123-8899')
      c2.set('status', 'proposal')
      c2.set('purchase_modality', 'financiamento')
      c2.set('financial_breakdown', {
        cash_percent: 30,
        cash_amount: 960000,
        finance_percent: 70,
        finance_bank: 'Bradesco Prime',
        notes: 'Entrada à vista + Financiamento aprovado em 360 meses',
      })
      c2.set(
        'objectives',
        'Apartamento alto padrão próximo ao Parque Ibirapuera, acabamentos refinados, segurança total.',
      )
      c2.set(
        'objections_notes',
        'Quer desconto de 5% sobre o valor da pedida por conta do pagamento rápido da entrada.',
      )
      c2.set('interested_property_ids', [prop3Id])
      c2.set('portal_token', 'token_camila_torres_88b')
      app.save(c2)
      client2Id = c2.id
    }

    // 5. Seed Proposal for Client 2
    try {
      const existingProp = app.findFirstRecordByData('proposals', 'client_id', client2Id)
    } catch (_) {
      if (client2Id && prop3Id) {
        const propRec = new Record(proposals)
        propRec.set('client_id', client2Id)
        propRec.set('property_id', prop3Id)
        propRec.set('value', 3050000)
        propRec.set('down_payment', 950000)
        propRec.set('financing_value', 2100000)
        propRec.set('bank_partner', 'Bradesco Prime')
        propRec.set(
          'payment_terms',
          '30% no ato do compromisso de compra e venda + 70% repasse financiamento bancário em até 45 dias.',
        )
        propRec.set(
          'conditions',
          'Inclusão de todos os armários planejados Ornare e ar condicionado instalado.',
        )
        propRec.set('status', 'docs_pending')
        app.save(propRec)
      }
    }
  },
  (app) => {
    // rollback if needed
  },
)
