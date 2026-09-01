import pb from '@/lib/pocketbase/client'
import type { Property } from '@/types'

// Curated high quality property photos for Porto Alegre real estate presentation
const PROPERTY_FALLBACK_IMAGES: Record<string, string[]> = {
  // Moinhos de Vento
  'Apartamento Alto Padrão no Moinhos de Vento': [
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
  ],
  // Bela Vista
  'Cobertura Horizontal Exclusiva em Bela Vista': [
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
  ],
  // Três Figueiras
  'Casa Contemporânea em Condomínio Fechado em Três Figueiras': [
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
  ],
  // Petrópolis Garden
  'Apartamento Garden com Pátio Privativo no Petrópolis': [
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
  ],
  // Menino Deus
  'Apartamento Vista Guaíba no Menino Deus': [
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
  ],
  // Auxiliadora
  'Apartamento Moderno e Ensolarado no Auxiliadora': [
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
  ],
  // Boa Vista
  'Apartamento Design Alto Padrão no Boa Vista': [
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
  ],
  // Petrópolis Duplex
  'Cobertura Duplex com Vista 360° em Petrópolis': [
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
  ],
  // Moinhos Mobiliado
  'Apartamento Mobiliado de Luxo no Moinhos de Vento': [
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
    'https://img.usecurling.com/p/800/600?q=abstract',
  ],
}

const DEFAULT_IMAGES = [
  'https://img.usecurling.com/p/800/600?q=abstract',
  'https://img.usecurling.com/p/800/600?q=abstract',
  'https://img.usecurling.com/p/800/600?q=abstract',
  'https://img.usecurling.com/p/800/600?q=abstract',
]

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

export function getPropertyImageUrl(property: Property, filename?: string): string {
  // Check if PB stored images exist
  if (property.images && property.images.length > 0) {
    const file = filename || property.images[0]
    return pb.files.getURL(property, file)
  }

  // Lookup curated high quality images by title
  if (property.title && PROPERTY_FALLBACK_IMAGES[property.title]) {
    const imgs = PROPERTY_FALLBACK_IMAGES[property.title]
    return imgs[0]
  }

  // Fallback hash based on id or title
  const idx =
    Math.abs(
      (property.id || property.title || '')
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0),
    ) % DEFAULT_IMAGES.length
  return DEFAULT_IMAGES[idx]
}

export function getPropertyGallery(property: Property): string[] {
  if (property.images && property.images.length > 0) {
    return property.images.map((img) => pb.files.getURL(property, img))
  }

  if (property.title && PROPERTY_FALLBACK_IMAGES[property.title]) {
    return PROPERTY_FALLBACK_IMAGES[property.title]
  }

  return DEFAULT_IMAGES
}
