import pb from '@/lib/pocketbase/client'
import type { ClientDocument, DocumentStatus } from '@/types'

export async function getDocuments(filter?: string, sort = '-created') {
  return await pb.collection('documents').getFullList<ClientDocument>({
    filter,
    sort,
  })
}

export async function getDocumentsByClientId(clientId: string) {
  return await pb.collection('documents').getFullList<ClientDocument>({
    filter: `client_id = "${clientId}"`,
    sort: '-created',
  })
}

export async function getDocumentsByProposalId(proposalId: string) {
  return await pb.collection('documents').getFullList<ClientDocument>({
    filter: `proposal_id = "${proposalId}"`,
    sort: '-created',
  })
}

export async function createDocument(formData: FormData) {
  return await pb.collection('documents').create<ClientDocument>(formData)
}

export async function updateDocumentStatus(id: string, status: DocumentStatus, notes?: string) {
  return await pb.collection('documents').update<ClientDocument>(id, {
    status,
    notes,
  })
}

export async function deleteDocument(id: string) {
  return await pb.collection('documents').delete(id)
}

export function getDocumentDownloadUrl(doc: ClientDocument) {
  if (!doc.file) return ''
  return pb.files.getURL(doc, doc.file)
}
