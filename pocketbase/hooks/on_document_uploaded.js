/// <reference path="../pb_data/types.d.ts" />

// When a document is uploaded/created:
// 1. Update proposal and client stage if applicable
// 2. Persist a notification in 'notifications' for Vera
onRecordAfterCreateSuccess((e) => {
  try {
    const doc = e.record
    const clientId = doc.getString('client_id')
    const proposalId = doc.getString('proposal_id')
    const docType = doc.getString('type') || doc.getString('title') || 'Novo Documento'

    let clientName = 'Cliente'
    if (clientId) {
      try {
        const client = $app.findRecordById('clients', clientId)
        if (client) {
          clientName = client.getString('name') || 'Cliente'
          if (client.getString('status') !== 'closing') {
            if (
              client.getString('status') === 'lead' ||
              client.getString('status') === 'visit' ||
              client.getString('status') === 'contact'
            ) {
              client.set('status', 'proposal')
              $app.save(client)
            }
          }
        }
      } catch (clientErr) {
        console.log('Error updating client on doc upload:', clientErr)
      }
    }

    if (proposalId) {
      try {
        const proposal = $app.findRecordById('proposals', proposalId)
        if (proposal && proposal.getString('status') === 'docs_pending') {
          proposal.set('status', 'under_review')
          $app.save(proposal)
        }
      } catch (propErr) {
        console.log('Error updating proposal on doc upload:', propErr)
      }
    }

    // Persist notification for Vera Lúcia
    try {
      const notificationsCol = $app.findCollectionByNameOrId('notifications')
      const notif = new Record(notificationsCol)
      notif.set('title', 'Novo Documento Recebido')
      notif.set('message', `${clientName} enviou o documento "${docType}" no cofre digital.`)
      notif.set('type', 'document_uploaded')
      notif.set('client_name', clientName)
      notif.set('client_id', clientId)
      notif.set('proposal_id', proposalId)
      notif.set('link', '/propostas')
      notif.set('read', false)
      notif.set('metadata', {
        doc_id: doc.id,
        doc_type: docType,
        uploaded_at: new Date().toISOString(),
      })
      $app.save(notif)
      console.log('Notification created for uploaded document:', doc.id)
    } catch (notifErr) {
      console.log('Error creating notification for doc upload:', notifErr)
    }
  } catch (err) {
    console.log('Error in on_document_uploaded hook:', err)
  }

  e.next()
}, 'documents')
