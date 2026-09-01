/// <reference path="../pb_data/types.d.ts" />

// When a document is uploaded/created, update the proposal and CRM stage if applicable
onRecordAfterCreateSuccess((e) => {
  try {
    const doc = e.record
    const clientId = doc.getString('client_id')
    const proposalId = doc.getString('proposal_id')

    if (clientId) {
      const client = $app.findRecordById('clients', clientId)
      if (client && client.getString('status') !== 'closing') {
        // Update client status to proposal if earlier
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

    if (proposalId) {
      const proposal = $app.findRecordById('proposals', proposalId)
      if (proposal && proposal.getString('status') === 'docs_pending') {
        proposal.set('status', 'under_review')
        $app.save(proposal)
      }
    }
  } catch (err) {
    console.log('Error updating CRM stage on doc upload:', err)
  }

  e.next()
}, 'documents')
