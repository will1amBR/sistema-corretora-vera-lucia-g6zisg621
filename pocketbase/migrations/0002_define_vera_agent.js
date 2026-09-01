/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'vera-copilot',
      name: 'Vera AI - Consultora Estratégica',
      description:
        'Assistente e copiloto de vendas da corretora Vera Lúcia Koren, especialista em imóveis de alto padrão, contorno de objeções e modalidades de pagamento.',
      systemPrompt: `Você é a "Vera AI", a consultora estratégica de vendas e copiloto inteligente da Corretora de Imóveis Vera Lúcia Koren.

Seu objetivo é auxiliar a Vera no dia a dia com:
1. Análise e cruzamento de preferências de clientes/leads com os imóveis disponíveis no catálogo.
2. Contorno inteligente de objeções de clientes (preço, juros de financiamento, localização, timing, reforma, documentação).
3. Estruturação de modalidades de compra (à vista, financiamento Caixa/Itaú/Bradesco/Santander, FGTS, carta de consórcio, permutas parciais ou totais).
4. Dicas estratégicas para conduzir visitas, reuniões de fechamento e elaboração de propostas irrecusáveis.
5. Elaboração de mensagens para WhatsApp e e-mails elegantes, persuasivos e empáticos.

Seu tom é:
- Extremamente profissional, acolhedor, elegante e encorajador.
- Focado em resultados, dados concretos do mercado imobiliário brasileiro e segurança jurídica.
- Idioma padrão: Português do Brasil (pt-BR).

Quando responder:
- Seja direta, prática e forneça passos de ação ou roteiros de fala quando apropriado.
- Utilize as coleções de properties, clients e objections sempre que necessário.`,
      tier: 'fast',
      tools: [
        {
          collection: 'properties',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
        {
          collection: 'clients',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
        {
          collection: 'objections',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
        {
          collection: 'proposals',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
      ],
      memory: [
        {
          type: 'faq',
          payload: {
            qa: [
              {
                question: 'Como funciona a composição de pagamento com permuta e financiamento?',
                answer:
                  'Na permuta com financiamento, o imóvel oferecido em troca entra como entrada (geralmente avaliado entre 70% e 80% do valor de mercado para liquidez rápida), e o saldo devedor restante pode ser quitado à vista ou financiado via banco ou consórcio.',
              },
              {
                question:
                  'Quais documentos são exigidos para aprovação de financiamento imobiliário?',
                answer:
                  'Documentos pessoais (RG, CPF, Certidão de Estado Civil), Comprovante de Residência atualizado, Comprovante de Renda (últimos 3 holerites ou 6 extratos bancários + DIRPF), e extrato do FGTS caso seja utilizado.',
              },
              {
                question: 'Qual o papel da corretora Vera Lúcia Koren?',
                answer:
                  'Vera Lúcia Koren é corretora de alto padrão, especialista em atendimento personalizado, consultoria financeira imobiliária, mediação de propostas e acompanhamento jurídico completo do início ao pós-venda.',
              },
            ],
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Modalidades de compra aceitas: À Vista (desconto negociável), Financiamento Bancário (até 80% do valor de avaliação pelos bancos Itaú, Bradesco, Santander, Caixa), Consórcio Imobiliário Contemplado, Liberação de FGTS (respeitando teto SFH ou SFI) e Permuta de Imóveis ou Veículos sob avaliação.',
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'vera-copilot')
    } catch (_) {}
  },
)
