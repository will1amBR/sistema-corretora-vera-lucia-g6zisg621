import pb from '@/lib/pocketbase/client'
import type { Proposal, ProposalStatus } from '@/types'

export async function getProposals(filter?: string, sort = '-created') {
  return await pb.collection('proposals').getFullList<Proposal>({
    filter,
    sort,
    expand: 'client_id,property_id',
  })
}

export async function getProposalById(id: string) {
  return await pb.collection('proposals').getOne<Proposal>(id, {
    expand: 'client_id,property_id',
  })
}

export async function getProposalsByClientId(clientId: string) {
  return await pb.collection('proposals').getFullList<Proposal>({
    filter: `client_id = "${clientId}"`,
    sort: '-created',
    expand: 'property_id',
  })
}

export async function createProposal(data: Partial<Proposal>) {
  return await pb.collection('proposals').create<Proposal>(data)
}

export async function updateProposal(id: string, data: Partial<Proposal>) {
  return await pb.collection('proposals').update<Proposal>(id, data)
}

export async function updateProposalStatus(id: string, status: ProposalStatus) {
  return await pb.collection('proposals').update<Proposal>(id, { status })
}

export async function sendCounterProposal(
  proposalId: string,
  counterOffer: {
    value: number
    down_payment?: number
    financing_value?: number
    bank_partner?: string
    payment_terms?: string
    conditions?: string
    valid_until?: string
    notes?: string
  },
) {
  return await pb.collection('proposals').update<Proposal>(proposalId, {
    status: 'counter_sent',
    counter_offer: {
      ...counterOffer,
      created_at: new Date().toISOString(),
    },
    counter_proposal_notes: counterOffer.notes || '',
  })
}

export async function acceptCounterProposal(proposalId: string) {
  const proposal = await pb.collection('proposals').getOne<Proposal>(proposalId)
  const counter = proposal.counter_offer

  const payload: Partial<Proposal> = {
    status: 'accepted',
    negotiation_stage: 'proposta_aprovada',
  }

  // If counter offer specified values, update main proposal values
  if (counter) {
    if (counter.value) payload.value = counter.value
    if (counter.down_payment !== undefined) payload.down_payment = counter.down_payment
    if (counter.financing_value !== undefined) payload.financing_value = counter.financing_value
    if (counter.bank_partner) payload.bank_partner = counter.bank_partner
    if (counter.payment_terms) payload.payment_terms = counter.payment_terms
    if (counter.conditions) payload.conditions = counter.conditions
  }

  return await pb.collection('proposals').update<Proposal>(proposalId, payload)
}

export async function deleteProposal(id: string) {
  return await pb.collection('proposals').delete(id)
}
