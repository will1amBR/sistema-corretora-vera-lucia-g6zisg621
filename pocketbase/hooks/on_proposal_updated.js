/// <reference path="../pb_data/types.d.ts" />

// When a proposal is updated:
// If status changed to accepted or counter_sent, notify Vera or trigger corresponding notifications
onRecordAfterUpdateSuccess((e) => {
  try {
    const proposal = e.record
    const original = proposal.original()
    const newStatus = proposal.getString('status')
    const oldStatus = original ? original.getString('status') : ''

    const clientId = proposal.getString('client_id')
    let clientName = 'Cliente'
    if (clientId) {
      try {
        const client = $app.findRecordById('clients', clientId)
        if (client) {
          clientName = client.getString('name') || 'Cliente'
        }
      } catch (_) {}
    }

    let propertyTitle = 'Imóvel'
    try {
      const propId = proposal.getString('property_id')
      if (propId) {
        const prop = $app.findRecordById('properties', propId)
        if (prop) propertyTitle = prop.getString('title')
      }
    } catch (_) {}

    const notificationsCol = $app.findCollectionByNameOrId('notifications')

    // 1. Client accepted the counterproposal or proposal
    if (newStatus === 'accepted' && oldStatus !== 'accepted') {
      const notif = new Record(notificationsCol)
      notif.set('title', 'Proposta Aceita pelo Cliente!')
      notif.set(
        'message',
        `${clientName} aceitou as condições comerciais para ${propertyTitle}. Próximo passo: formalização da minuta!`,
      )
      notif.set('type', 'counter_accepted')
      notif.set('client_name', clientName)
      notif.set('client_id', clientId)
      notif.set('proposal_id', proposal.id)
      notif.set('link', '/propostas')
      notif.set('read', false)
      notif.set('metadata', {
        proposal_id: proposal.id,
        property_title: propertyTitle,
        value: proposal.getInt('value'),
      })
      $app.save(notif)
      console.log('Notification created: proposal accepted for', proposal.id)
    }

    // 2. Proposal updated / renegotiated by client
    if (oldStatus === 'counter_sent' && newStatus === 'sent') {
      const notif = new Record(notificationsCol)
      notif.set('title', 'Nova Rodada de Proposta pelo Cliente')
      notif.set(
        'message',
        `${clientName} ajustou os termos e reenviou a proposta para ${propertyTitle}.`,
      )
      notif.set('type', 'proposal_updated')
      notif.set('client_name', clientName)
      notif.set('client_id', clientId)
      notif.set('proposal_id', proposal.id)
      notif.set('link', '/propostas')
      notif.set('read', false)
      notif.set('metadata', {
        proposal_id: proposal.id,
        property_title: propertyTitle,
        value: proposal.getInt('value'),
      })
      $app.save(notif)
      console.log('Notification created: renegotiation sent by client for', proposal.id)
    }
  } catch (err) {
    console.log('Error in on_proposal_updated hook:', err)
  }

  e.next()
}, 'proposals')
