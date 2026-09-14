import pb from '@/lib/pocketbase/client'
import type { ClientDocument, DocumentStatus, DocumentEvent, DocumentHistoryEntry } from '@/types'

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

export async function getDocumentEventsByClientId(clientId: string, limit = 50) {
  try {
    return await pb.collection('document_events').getList<DocumentEvent>(1, limit, {
      filter: `client_id = "${clientId}"`,
      sort: '-created',
    })
  } catch (err) {
    console.warn('Erro ao carregar document_events:', err)
    return { items: [], totalItems: 0, totalPages: 0, page: 1, perPage: limit }
  }
}

export async function recordDocumentEvent(eventData: {
  document_id?: string
  client_id: string
  proposal_id?: string
  document_type: string
  document_title?: string
  action: 'uploaded' | 'resubmitted' | 'approved' | 'rejected' | 'commented' | 'deleted'
  actor_name?: string
  actor_role?: 'client' | 'broker' | 'system'
  note?: string
  version?: number
  metadata?: Record<string, any>
}) {
  try {
    return await pb.collection('document_events').create<DocumentEvent>(eventData)
  } catch (err) {
    console.warn('Erro ao salvar document_event:', err)
    return null
  }
}

export async function createOrUpdateDocumentWithHistory(params: {
  formData: FormData
  existingDoc?: ClientDocument | null
  actorName: string
  actorRole: 'client' | 'broker'
  note?: string
}) {
  const { formData, existingDoc, actorName, actorRole, note } = params
  const now = new Date().toISOString()

  if (existingDoc) {
    // Reenvio / Substituição de documento (incrementa versão)
    const nextVersion = (existingDoc.version || 1) + 1
    const previousHistory: DocumentHistoryEntry[] = Array.isArray(existingDoc.history)
      ? existingDoc.history
      : []

    const newHistoryEntry: DocumentHistoryEntry = {
      action: 'resubmitted',
      actor_name: actorName,
      actor_role: actorRole,
      version: nextVersion,
      date: now,
      note: note || `Versão ${nextVersion} reenviada pelo cliente.`,
    }

    formData.append('version', String(nextVersion))
    formData.append('status', 'pending')
    formData.append('history', JSON.stringify([...previousHistory, newHistoryEntry]))
    if (note) formData.append('notes', note)

    const updated = await pb
      .collection('documents')
      .update<ClientDocument>(existingDoc.id, formData)

    // Log to document_events
    await recordDocumentEvent({
      document_id: updated.id,
      client_id: updated.client_id || '',
      proposal_id: updated.proposal_id,
      document_type: updated.type,
      document_title: updated.title,
      action: 'resubmitted',
      actor_name: actorName,
      actor_role: actorRole,
      note: note || `Versão ${nextVersion} reenviada.`,
      version: nextVersion,
    })

    return updated
  } else {
    // Primeiro envio (v1)
    const initialHistoryEntry: DocumentHistoryEntry = {
      action: 'uploaded',
      actor_name: actorName,
      actor_role: actorRole,
      version: 1,
      date: now,
      note: note || 'Documento enviado com sucesso para o cofre seguro.',
    }

    formData.append('version', '1')
    formData.append('status', 'pending')
    formData.append('history', JSON.stringify([initialHistoryEntry]))

    const created = await pb.collection('documents').create<ClientDocument>(formData)

    // Log to document_events
    await recordDocumentEvent({
      document_id: created.id,
      client_id: created.client_id || '',
      proposal_id: created.proposal_id,
      document_type: created.type,
      document_title: created.title,
      action: 'uploaded',
      actor_name: actorName,
      actor_role: actorRole,
      note: note || 'Primeiro envio do documento.',
      version: 1,
    })

    return created
  }
}

export async function createDocument(formData: FormData) {
  return await pb.collection('documents').create<ClientDocument>(formData)
}

export async function updateDocumentStatusWithHistory(params: {
  id: string
  status: DocumentStatus
  notes?: string
  actorName?: string
  currentDoc?: ClientDocument
}) {
  const { id, status, notes, actorName = 'Vera Lúcia Koren', currentDoc } = params
  const now = new Date().toISOString()
  const previousHistory: DocumentHistoryEntry[] =
    currentDoc && Array.isArray(currentDoc.history) ? currentDoc.history : []

  const action: 'approved' | 'rejected' = status === 'verified' ? 'approved' : 'rejected'
  const newHistoryEntry: DocumentHistoryEntry = {
    action,
    actor_name: actorName,
    actor_role: 'broker',
    version: currentDoc?.version || 1,
    date: now,
    note:
      notes ||
      (status === 'verified'
        ? 'Documento verificado e aprovado por Vera Lúcia Koren.'
        : 'Documento requer ajustes ou reenvio.'),
  }

  const payload: Record<string, any> = {
    status,
    notes: notes || '',
    reviewed_at: now,
    reviewed_by: actorName,
    history: [...previousHistory, newHistoryEntry],
  }

  const updated = await pb.collection('documents').update<ClientDocument>(id, payload)

  // Log to document_events stream
  await recordDocumentEvent({
    document_id: updated.id,
    client_id: updated.client_id || '',
    proposal_id: updated.proposal_id,
    document_type: updated.type,
    document_title: updated.title,
    action,
    actor_name: actorName,
    actor_role: 'broker',
    note: notes,
    version: updated.version,
  })

  return updated
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
