import pb from '@/lib/pocketbase/client'
import type { Property } from '@/types'

export async function getProperties(filter?: string, sort = '-created') {
  return await pb.collection('properties').getFullList<Property>({
    filter,
    sort,
  })
}

export async function getPropertyById(id: string) {
  return await pb.collection('properties').getOne<Property>(id)
}

export async function createProperty(data: Partial<Property> | FormData) {
  return await pb.collection('properties').create<Property>(data)
}

export async function updateProperty(id: string, data: Partial<Property> | FormData) {
  return await pb.collection('properties').update<Property>(id, data)
}

export async function deleteProperty(id: string) {
  return await pb.collection('properties').delete(id)
}

export function getPropertyImageUrl(property: Property, filename?: string) {
  if (!filename && property.images && property.images.length > 0) {
    filename = property.images[0]
  }
  if (!filename) {
    return 'https://img.usecurling.com/p/800/600?q=luxury+apartment+living+room'
  }
  return pb.files.getURL(property, filename)
}
