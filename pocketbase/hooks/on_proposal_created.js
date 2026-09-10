/// <reference path="../pb_data/types.d.ts" />

// Hook to trigger magic link email and persist notification when a proposal is created
onRecordAfterCreateSuccess((e) => {
  try {
    const proposal = e.record
    const clientId = proposal.getString('client_id')
    if (!clientId) {
      e.next()
      return
    }

    let client = null
    try {
      client = $app.findRecordById('clients', clientId)
    } catch (_) {}

    if (!client) {
      e.next()
      return
    }

    // Ensure client has a portal token
    let token = client.getString('portal_token')
    if (!token) {
      token = 'token_' + $security.randomString(20)
      client.set('portal_token', token)
      $app.save(client)
    }

    // Also populate access_token on proposal if not already present
    if (!proposal.getString('access_token')) {
      try {
        proposal.set('access_token', token)
        $app.save(proposal)
      } catch (saveErr) {
        console.log('Error setting access_token on proposal:', saveErr)
      }
    }

    const clientEmail = client.getString('email')
    const clientName = client.getString('name') || 'Cliente'

    // Find property title
    let propertyTitle = 'Imóvel Exclusivo'
    let propertyPrice = ''
    try {
      const propId = proposal.getString('property_id')
      if (propId) {
        const prop = $app.findRecordById('properties', propId)
        if (prop) {
          propertyTitle = prop.getString('title')
          const priceNum = prop.getInt('price')
          if (priceNum) {
            propertyPrice = 'R$ ' + priceNum.toLocaleString()
          }
        }
      }
    } catch (_) {}

    const proposalValue = proposal.getInt('value')
    const formattedValue = proposalValue ? 'R$ ' + proposalValue.toLocaleString() : ''

    // 1. Create a notification for Vera Lúcia
    try {
      const notificationsCol = $app.findCollectionByNameOrId('notifications')
      const notif = new Record(notificationsCol)
      notif.set('title', 'Nova Proposta Recebida')
      notif.set(
        'message',
        `${clientName} registrou uma proposta no valor de ${formattedValue || 'valor sob consulta'} para ${propertyTitle}.`,
      )
      notif.set('type', 'proposal_new')
      notif.set('client_name', clientName)
      notif.set('client_id', clientId)
      notif.set('proposal_id', proposal.id)
      notif.set('link', '/propostas')
      notif.set('read', false)
      notif.set('metadata', {
        proposal_id: proposal.id,
        property_title: propertyTitle,
        value: proposalValue,
      })
      $app.save(notif)
      console.log('Notification created for new proposal:', proposal.id)
    } catch (notifErr) {
      console.log('Error creating notification for proposal:', notifErr)
    }

    // 2. Dispatch transactional email with portal link
    // Build full portal URL using SITE_URL or fallback
    let siteUrl = $os.getenv('SITE_URL') || ''
    if (siteUrl && siteUrl.endsWith('/')) {
      siteUrl = siteUrl.slice(0, -1)
    }
    const portalUrl = siteUrl
      ? `${siteUrl}/portal?portal_token=${token}`
      : `/portal?portal_token=${token}`

    if (clientEmail) {
      try {
        const sender = $app.settings().meta.senderAddress || 'vera@korenimoveis.com.br'
        const senderName = 'Vera Lúcia Koren - Corretora de Imóveis'

        const htmlBody = `
          <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #F8F9FA; padding: 24px; border-radius: 10px; color: #1A3636;">
            <!-- Header -->
            <div style="background: #1A3636; padding: 28px 24px; border-radius: 8px; text-align: center; border-bottom: 3px solid #D4AF37;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1.5px;">VERA LÚCIA KOREN</h1>
              <p style="color: #E2E8F0; margin: 6px 0 0 0; font-size: 13px; font-weight: 500; letter-spacing: 0.5px;">CORRETORA DE IMÓVEIS EXCLUSIVA • FOXTER</p>
            </div>

            <!-- Body -->
            <div style="background: #FFFFFF; padding: 28px 24px; margin-top: 16px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
              <h2 style="color: #1A3636; font-size: 20px; margin-top: 0; font-weight: bold;">Olá, ${clientName}!</h2>
              
              <p style="color: #4A5568; line-height: 1.6; font-size: 15px; margin: 12px 0;">
                Sua proposta comercial foi formalizada com sucesso referente ao imóvel:
              </p>
              
              <div style="background: #F8F9FA; border-left: 4px solid #D4AF37; padding: 14px 18px; margin: 16px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1A3636;">${propertyTitle}</p>
                ${formattedValue ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #2A4D4D;">Valor Proposto: <strong>${formattedValue}</strong></p>` : ''}
              </div>

              <p style="color: #4A5568; line-height: 1.6; font-size: 14px; margin: 16px 0;">
                Através do seu <strong>Portal do Cliente seguro</strong>, você tem acesso em tempo real a:
              </p>
              
              <ul style="color: #4A5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 12px 0;">
                <li>Linha do tempo atualizada com cada etapa da sua negociação;</li>
                <li>Recebimento e resposta rápida a <strong>contrapropostas</strong>;</li>
                <li>Cofre digital protegido para envio dos seus documentos (RG, renda, etc.);</li>
                <li>Simulador de parcelas e financiamento bancário integrado.</li>
              </ul>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0 24px 0;">
                <a href="${portalUrl}" style="background: #1A3636; color: #D4AF37; border: 2px solid #D4AF37; padding: 16px 36px; text-decoration: none; font-weight: bold; font-size: 15px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(26,54,54,0.25);">
                  ACESSAR MINHA ÁREA DO CLIENTE
                </a>
              </div>

              <p style="text-align: center; color: #718096; font-size: 12px; margin: 12px 0 0 0;">
                Link seguro exclusivo: <a href="${portalUrl}" style="color: #1A3636; text-decoration: underline;">${portalUrl}</a>
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px 10px; color: #718096; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0;"><strong>Vera Lúcia Koren</strong> • CRECI 38415 • Foxter Imobiliária</p>
              <p style="margin: 4px 0 0 0;">Porto Alegre - RS | Atendimento Personalizado de Alto Padrão</p>
            </div>
          </div>
        `

        const message = new MailerMessage({
          from: {
            address: sender,
            name: senderName,
          },
          to: [{ address: clientEmail, name: clientName }],
          subject: `Sua Proposta e Acesso ao Portal - ${propertyTitle}`,
          html: htmlBody,
        })

        $app.newMailClient().send(message)
        console.log('Proposal notification email successfully sent to:', clientEmail)
      } catch (mailErr) {
        console.log('Error dispatching proposal email (SMTP may not be configured):', mailErr)
      }
    } else {
      console.log('No client email found; skipped transactional email for proposal:', proposal.id)
    }
  } catch (err) {
    console.log('Error in on_proposal_created hook:', err)
  }

  e.next()
}, 'proposals')
