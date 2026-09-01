/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const properties = app.findCollectionByNameOrId('properties')

    const portoAlegreProperties = [
      {
        title: 'Apartamento Alto Padrão no Moinhos de Vento',
        description:
          'Elegante apartamento com vista para a copa das árvores, próximo ao Parcão (Parque Moinhos de Vento). Living amplo para 3 ambientes com lareira e churrasqueira gourmet, piso em tabuão de madeira nobre, suíte máster com closet e hidromassagem. Condomínio imponente com portaria 24h blindada e salão de festas decorado.',
        address: 'Rua Dinarte Ribeiro, 350',
        neighborhood: 'Moinhos de Vento',
        city: 'Porto Alegre - RS',
        price: 2450000,
        bedrooms: 3,
        bathrooms: 4,
        suites: 3,
        parking_spots: 3,
        area_sqm: 235,
        modality: 'sale',
        status: 'available',
        featured: true,
        features: [
          'Próximo ao Parcão',
          'Lareira e Churrasqueira',
          'Suíte Máster com Hidro',
          'Portaria 24h Blindada',
          'Piso em Madeira Nobre',
          '3 Vagas de Garagem',
        ],
      },
      {
        title: 'Cobertura Horizontal Exclusiva em Bela Vista',
        description:
          'Deslumbrante cobertura horizontal com terraço ensolarado e piscina privativa aquecida na Bela Vista. Espaço gourmet climatizado integrado ao deck externo, vista panorâmica de Porto Alegre e pôr do sol do Guaíba. 4 suítes completas, automação de iluminação e som, 4 vagas cobertas e depósito privativo.',
        address: 'Rua Casemiro de Abreu, 820',
        neighborhood: 'Bela Vista',
        city: 'Porto Alegre - RS',
        price: 4980000,
        bedrooms: 4,
        bathrooms: 6,
        suites: 4,
        parking_spots: 4,
        area_sqm: 410,
        modality: 'sale',
        status: 'available',
        featured: true,
        features: [
          'Piscina Privativa Aquecida',
          'Vista Panorâmica da Cidade',
          'Terraço com Deck de Madeira',
          'Automação Residencial',
          'Espaço Gourmet Climatizado',
          '4 Suítes com Closet',
        ],
      },
      {
        title: 'Casa Contemporânea em Condomínio Fechado em Três Figueiras',
        description:
          'Residência moderna com projeto assinado por arquiteto renomado no coração do bairro Três Figueiras, ao lado dos melhores colégios (Farroupilha e Anchieta). Pé direito duplo, integração total com jardim e piscina, painéis solares fotovoltaicos instalados, 4 suítes e garagem fechada para 4 veículos.',
        address: 'Av. Carlos Gomes (acesso privativo)',
        neighborhood: 'Três Figueiras',
        city: 'Porto Alegre - RS',
        price: 5800000,
        bedrooms: 4,
        bathrooms: 5,
        suites: 4,
        parking_spots: 4,
        area_sqm: 480,
        modality: 'sale',
        status: 'available',
        featured: true,
        features: [
          'Condomínio Fechado de Luxo',
          'Perto do Colégio Farroupilha',
          'Energia Solar Fotovoltaica',
          'Pé Direito Duplo',
          'Piscina e Jardim Paisagístico',
          'Segurança Armada 24h',
        ],
      },
      {
        title: 'Apartamento Garden com Pátio Privativo no Petrópolis',
        description:
          'Excelente oportunidade no nobre bairro Petrópolis, rua calma e arborizada próximo à Encol (Praça da Encol). Apartamento garden com amplo pátio privativo ajardinado, espaço para pet e churrasqueira a carvão. Living 2 ambientes, 3 dormitórios sendo 1 suíte, 2 vagas de garagem escrituradas.',
        address: 'Rua Guaporé, 415',
        neighborhood: 'Petrópolis',
        city: 'Porto Alegre - RS',
        price: 1390000,
        bedrooms: 3,
        bathrooms: 3,
        suites: 1,
        parking_spots: 2,
        area_sqm: 165,
        modality: 'financing',
        status: 'available',
        featured: true,
        features: [
          'Próximo à Praça da Encol',
          'Pátio Garden Privativo',
          'Aceita Financiamento e FGTS',
          'Churrasqueira a Carvão',
          'Edifício com Elevador',
          '2 Vagas Escrituradas',
        ],
      },
      {
        title: 'Apartamento Vista Guaíba no Menino Deus',
        description:
          'Apartamento andar alto no Menino Deus, a poucos minutos do Parque Marinha do Brasil e da Orla do Guaíba. Sacada envidraçada integrada ao living com churrasqueira, vista perene para o lago. 3 dormitórios sendo 1 suíte, semi-mobiliado com marcenaria sob medida de alto padrão.',
        address: 'Rua Gonçalves Dias, 600',
        neighborhood: 'Menino Deus',
        city: 'Porto Alegre - RS',
        price: 1150000,
        bedrooms: 3,
        bathrooms: 2,
        suites: 1,
        parking_spots: 2,
        area_sqm: 128,
        modality: 'financing',
        status: 'available',
        featured: true,
        features: [
          'Próximo ao Parque Marinha e Orla',
          'Vista Pôr do Sol do Guaíba',
          'Móveis Planejados Inclusos',
          'Churrasqueira na Sacada',
          'Condomínio com Piscina e Fitness',
          'Aceita FGTS e Financiamento',
        ],
      },
      {
        title: 'Apartamento Moderno e Ensolarado no Auxiliadora',
        description:
          'Imóvel impecável em localização nobre no Auxiliadora, próximo à 24 de Outubro e aos melhores cafés e restaurantes. Planta inteligente, living para 2 ambientes com lareira ecológica, cozinha americana integrada, 2 suítes americanas + 1 suíte máster. Aceita permuta por imóvel de menor valor como parte do pagamento.',
        address: 'Rua Silva Jardim, 710',
        neighborhood: 'Auxiliadora',
        city: 'Porto Alegre - RS',
        price: 1680000,
        bedrooms: 3,
        bathrooms: 3,
        suites: 2,
        parking_spots: 2,
        area_sqm: 155,
        modality: 'permuta',
        status: 'available',
        featured: true,
        features: [
          'Aceita Permuta de Imóvel',
          'Perto da Rua 24 de Outubro',
          'Lareira Ecológica',
          'Cozinha Americana Gourmet',
          'Condomínio Baixo Custo',
          'Excelente Posição Solar (Norte)',
        ],
      },
      {
        title: 'Apartamento Design Alto Padrão no Boa Vista',
        description:
          'Apartamento de altíssimo padrão em condomínio clube resort no Boa Vista, próximo ao Shopping Iguatemi e Bourbon Country. Living imponente com pé direito de 3 metros, isolamento acústico superior, 3 suítes plenas, dependência de empregada completa e 3 vagas livres.',
        address: 'Rua Anita Garibaldi, 1890',
        neighborhood: 'Boa Vista',
        city: 'Porto Alegre - RS',
        price: 2890000,
        bedrooms: 3,
        bathrooms: 4,
        suites: 3,
        parking_spots: 3,
        area_sqm: 240,
        modality: 'sale',
        status: 'available',
        featured: true,
        features: [
          'Próximo ao Shopping Iguatemi',
          'Condomínio Clube Completo',
          'Quadra de Tênis de Saibro',
          'Piscina Coberta Aquecida',
          '3 Suítes Plenas',
          'Gerador de Energia Total',
        ],
      },
      {
        title: 'Cobertura Duplex com Vista 360° em Petrópolis',
        description:
          'Espetacular cobertura duplex em Petrópolis com vista deslumbrante de 360° para a cidade e Guaíba. Pavimento superior com salão gourmet, lareira, churrasqueira gir offer e terraço aberto com jacuzzi de hidromassagem. Pavimento íntimo com 3 suítes, sendo a máster com closet walk-in. 4 vagas de garagem cobertas.',
        address: 'Av. Ijuí, 530',
        neighborhood: 'Petrópolis',
        city: 'Porto Alegre - RS',
        price: 3750000,
        bedrooms: 3,
        bathrooms: 5,
        suites: 3,
        parking_spots: 4,
        area_sqm: 320,
        modality: 'sale',
        status: 'available',
        featured: true,
        features: [
          'Terraço Aberto com Jacuzzi',
          'Vista 360° de Porto Alegre',
          'Salão Gourmet com Lareira',
          '4 Vagas Cobertas',
          'Suíte Máster com Walk-in Closet',
          'Prédio Tradicional Imponente',
        ],
      },
      {
        title: 'Apartamento Mobiliado de Luxo no Moinhos de Vento',
        description:
          'Apartamento totalmente decorado e mobiliado por designer de interiores no coração do Moinhos de Vento. Mobília de grife, climatização split inverter em todos os ambientes, lareira a gás e adega climatizada. Pronto para morar imediatamente com elegância e conforto máximo.',
        address: 'Rua Luciana de Abreu, 210',
        neighborhood: 'Moinhos de Vento',
        city: 'Porto Alegre - RS',
        price: 3100000,
        bedrooms: 3,
        bathrooms: 4,
        suites: 3,
        parking_spots: 3,
        area_sqm: 210,
        modality: 'sale',
        status: 'available',
        featured: true,
        features: [
          '100% Mobiliado e Decorado',
          'Adega Climatizada Embutida',
          'Rua Charmosa no Moinhos',
          'Lareira a Gás no Living',
          '3 Suítes Climatizadas',
          'Infraestrutura Completa de Lazer',
        ],
      },
    ]

    for (const propData of portoAlegreProperties) {
      try {
        const existing = app.findFirstRecordByData('properties', 'title', propData.title)
        // update with accurate Porto Alegre info if exists
        existing.set('description', propData.description)
        existing.set('address', propData.address)
        existing.set('neighborhood', propData.neighborhood)
        existing.set('city', propData.city)
        existing.set('price', propData.price)
        existing.set('bedrooms', propData.bedrooms)
        existing.set('bathrooms', propData.bathrooms)
        existing.set('suites', propData.suites)
        existing.set('parking_spots', propData.parking_spots)
        existing.set('area_sqm', propData.area_sqm)
        existing.set('modality', propData.modality)
        existing.set('status', propData.status)
        existing.set('featured', propData.featured)
        existing.set('features', propData.features)
        app.save(existing)
      } catch (_) {
        const record = new Record(properties)
        record.set('title', propData.title)
        record.set('description', propData.description)
        record.set('address', propData.address)
        record.set('neighborhood', propData.neighborhood)
        record.set('city', propData.city)
        record.set('price', propData.price)
        record.set('bedrooms', propData.bedrooms)
        record.set('bathrooms', propData.bathrooms)
        record.set('suites', propData.suites)
        record.set('parking_spots', propData.parking_spots)
        record.set('area_sqm', propData.area_sqm)
        record.set('modality', propData.modality)
        record.set('status', propData.status)
        record.set('featured', propData.featured)
        record.set('features', propData.features)
        app.save(record)
      }
    }
  },
  (app) => {
    // rollback if needed
  },
)
