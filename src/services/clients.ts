import pb from '@/lib/pocketbase/client'
import type { Client, FinancialBreakdown, PurchaseModality, ClientStatus } from '@/types'

export async function getClients(filter?: string, sort = '-created') {
  return await pb.collection('clients').getFullList<Client>({
    filter,
    sort,
    expand: 'visit_property_id',
  })
}

export async function getClientById(id: string) {
  return await pb.collection('clients').getOne<Client>(id, {
    expand: 'visit_property_id',
  })
}

export async function getClientByPortalToken(token: string) {
  return await pb.collection('clients').getFirstListItem<Client>(`portal_token = "${token}"`, {
    expand: 'visit_property_id',
  })
}

export async function createClient(data: Partial<Client>) {
  if (!data.portal_token) {
    data.portal_token =
      'token_' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
  }
  return await pb.collection('clients').create<Client>(data)
}

export async function updateClient(id: string, data: Partial<Client>) {
  return await pb.collection('clients').update<Client>(id, data)
}

export async function deleteClient(id: string) {
  return await pb.collection('clients').delete(id)
}

export async function updateClientStatus(id: string, status: ClientStatus) {
  return await pb.collection('clients').update<Client>(id, { status })
}

export async function scheduleClientVisit(
  id: string,
  data: {
    visit_scheduled_at: string
    visit_property_id?: string
    visit_notes?: string
    google_event_id?: string
  },
) {
  return await pb.collection('clients').update<Client>(id, {
    ...data,
    status: 'visit',
  })
}

export async function updateClientFinancials(
  id: string,
  modality: PurchaseModality,
  breakdown: FinancialBreakdown,
) {
  return await pb.collection('clients').update<Client>(id, {
    purchase_modality: modality,
    financial_breakdown: breakdown,
  })
}
