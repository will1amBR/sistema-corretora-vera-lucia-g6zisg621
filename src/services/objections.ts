import pb from '@/lib/pocketbase/client'
import type { Objection } from '@/types'

export async function getObjections(filter?: string, sort = '-created') {
  return await pb.collection('objections').getFullList<Objection>({
    filter,
    sort,
  })
}

export async function createObjection(data: Partial<Objection>) {
  return await pb.collection('objections').create<Objection>(data)
}

export async function updateObjection(id: string, data: Partial<Objection>) {
  return await pb.collection('objections').update<Objection>(id, data)
}

export async function deleteObjection(id: string) {
  return await pb.collection('objections').delete(id)
}
