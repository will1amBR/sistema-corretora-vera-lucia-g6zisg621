/// <reference path="../pb_data/types.d.ts" />

// Hook to trigger magic link email when a proposal is created or sent
onRecordAfterCreateSuccess((e) => {
  try {
    const proposal = e.record
    const clientId = proposal.getString('client_id')
    if (!clientId) {
      e.next()
      return
    }

    const client = $app.findRecordById('clients', clientId)
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

    const clientEmail = client.getString('email')
    const clientName = client.getString('name') || 'Cliente'

    if (clientEmail) {
      // Find property title
      let propertyTitle = 'Imóvel Exclusivo'
      try {
        const propId = proposal.getString('property_id')
        if (propId) {
          const prop = $app.findRecordById('properties', propId)
          if (prop) propertyTitle = prop.getString('title')
        }
      } catch (_) {}

      const message = new MailerMessage({
        from: {
          address: $app.settings().meta.senderAddress || 'vera@korenimoveis.com.br',
          name: 'Vera Lúcia Koren - Corretora de Imóveis',
        },
        to: [{ address: clientEmail, name: clientName }],
        subject: `Sua Proposta e Portal do Cliente - ${propertyTitle}`,
        html: `
          <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8F9FA; padding: 24px; border-radius: 8px;">
            <div style="background: #1A3636; padding: 20px; border-radius: 6px; text-align: center;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 1px;">VERA LÚCIA KOREN</h1>
              <p style="color: #FFFFFF; margin: 4px 0 0 0; font-size: 13px;">Corretora de Imóveis Exclusiva</p>
            </div>

            <div style="background: #FFFFFF; padding: 24px; margin-top: 16px; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <h2 style="color: #1A3636; font-size: 18px; margin-top: 0;">Olá, ${clientName}!</h2>
              <p style="color: #4A5568; line-height: 1.6; font-size: 14px;">
                Uma nova proposta foi estruturada especialmente para você referente ao imóvel:
                <br><strong style="color: #1A3636; font-size: 16px;">${propertyTitle}</strong>
              </p>

              <div style="background: #F8F9FA; border-left: 4px solid #D4AF37; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1A3636; font-size: 14px;">
                  Acesse sua área segura para visualizar todos os detalhes da proposta e fazer o envio simples e ágil dos seus documentos (RG, Comprovante de Renda, etc.).
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="?portal_token=${token}#/portal" style="background: #1A3636; color: #D4AF37; border: 1px solid #D4AF37; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 15px; border-radius: 6px; display: inline-block;">
                  Acessar Minha Área do Cliente
                </a>
              </div>

              <p style="color: #718096; font-size: 12px; line-height: 1.5; text-align: center;">
                Este link é exclusivo e seguro. Caso tenha dúvidas, Vera Lúcia Koren está à sua inteira disposição.
              </p>
            </div>
          </div>
        `,
      })

      $app.newMailClient().send(message)
    }
  } catch (err) {
    console.log('Error in proposal notification hook:', err)
  }

  e.next()
}, 'proposals')
