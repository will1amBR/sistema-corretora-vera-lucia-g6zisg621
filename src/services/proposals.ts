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

export async function deleteProposal(id: string) {
  return await pb.collection('proposals').delete(id)
}
