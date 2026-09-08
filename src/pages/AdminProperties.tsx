import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  Trash2,
  Edit,
  UploadCloud,
  Image as ImageIcon,
  Star,
  Sparkles,
  MapPin,
  ExternalLink,
  Eye,
  Check,
  AlertTriangle,
  X,
  FileCheck2,
  Layers,
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal,
  Home,
  CheckSquare,
  Square,
  DollarSign,
  Maximize2,
  BedDouble,
  Bath,
  Car,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyImageUrl,
  updatePropertyStatus,
} from '@/services/properties'
import PropertyDetailModal from '@/components/PropertyDetailModal'
import type { Property, PropertyType, PropertyModality, PropertyStatus } from '@/types'
import pb from '@/lib/pocketbase/client'

// Pre-defined suggestions for features / comodidades in Porto Alegre
const COMMON_FEATURES = [
  'Piscina Privativa',
  'Piscina Aquecida',
  'Churrasqueira Gourmet',
  'Lareira',
  'Suíte Máster com Closet',
  'Hidromassagem',
  'Varanda Envidraçada',
  'Vista Panorâmica',
  'Vista Guaíba',
  'Próximo ao Parcão',
  'Próximo à Praça da Encol',
  'Automação Residencial',
  'Energia Solar Fotovoltaica',
  'Portaria 24h Blindada',
  'Condomínio Fechado',
  'Quadra de Tênis',
  'Academia Equipada',
  'Depósito Privativo',
  'Semi-mobiliado',
  '100% Mobiliado e Decorado',
  'Piso em Madeira Nobre',
  'Pátio Garden Privativo',
  'Aceita Financiamento e FGTS',
  'Aceita Permuta',
]

const PORTO_ALEGRE_NEIGHBORHOODS = [
  'Moinhos de Vento',
  'Bela Vista',
  'Petrópolis',
  'Menino Deus',
  'Três Figueiras',
  'Auxiliadora',
  'Boa Vista',
  "Mont'Serrat",
  'Rio Branco',
  'Higienópolis',
  'Jardim Europa',
  'Chácara das Pedras',
  'Independência',
  'Centro Histórico',
]

interface PropertyFormState {
  title: string
  property_type: PropertyType
  price: number | string
  modality: PropertyModality
  status: PropertyStatus
  address: string
  neighborhood: string
  city: string
  area_sqm: number | string
  bedrooms: number | string
  bathrooms: number | string
  suites: number | string
  parking_spots: number | string
  description: string
  featured: boolean
  features: string[]
  cover_image: string
}

const INITIAL_FORM: PropertyFormState = {
  title: '',
  property_type: 'apartamento',
  price: '',
  modality: 'sale',
  status: 'available',
  address: '',
  neighborhood: 'Moinhos de Vento',
  city: 'Porto Alegre - RS',
  area_sqm: '',
  bedrooms: 3,
  bathrooms: 3,
  suites: 2,
  parking_spots: 2,
  description: '',
  featured: true,
  features: ['Churrasqueira Gourmet', 'Suíte Máster com Closet', 'Portaria 24h Blindada'],
  cover_image: '',
}

export default function AdminProperties() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Data state
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Filters state
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterModality, setFilterModality] = useState<string>('all')
  const [filterNeighborhood, setFilterNeighborhood] = useState<string>('all')

  // Selection & Bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [formState, setFormState] = useState<PropertyFormState>(INITIAL_FORM)
  const [customFeatureInput, setCustomFeatureInput] = useState('')

  // Files / Images state for the modal
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [previewUrls, setPreviewUrls] = useState<{ url: string; isNew: boolean; name: string }[]>(
    [],
  )

  // Delete confirmation dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Quick view detail modal
  const [viewProperty, setViewProperty] = useState<Property | null>(null)

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const data = await getProperties('', '-created')
      setProperties(data)
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao carregar carteira',
        description: err.message || 'Falha ao buscar imóveis.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  // Clean up object URLs when modal closes or images change
  useEffect(() => {
    return () => {
      previewUrls.forEach((p) => {
        if (p.isNew) URL.revokeObjectURL(p.url)
      })
    }
  }, [previewUrls])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProperty(null)
    setFormState(INITIAL_FORM)
    setNewImageFiles([])
    setExistingImages([])
    setPreviewUrls([])
    setCustomFeatureInput('')
    setIsFormOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (prop: Property) => {
    setEditingProperty(prop)
    setFormState({
      title: prop.title || '',
      property_type: prop.property_type || inferPropertyType(prop.title),
      price: prop.price || '',
      modality: prop.modality || 'sale',
      status: prop.status || 'available',
      address: prop.address || '',
      neighborhood: prop.neighborhood || '',
      city: prop.city || 'Porto Alegre - RS',
      area_sqm: prop.area_sqm || '',
      bedrooms: prop.bedrooms ?? '',
      bathrooms: prop.bathrooms ?? '',
      suites: prop.suites ?? '',
      parking_spots: prop.parking_spots ?? '',
      description: prop.description || '',
      featured: prop.featured ?? true,
      features: prop.features || [],
      cover_image: prop.cover_image || (prop.images && prop.images[0]) || '',
    })

    const existing = prop.images || []
    setExistingImages(existing)
    setNewImageFiles([])

    // Previews for existing PocketBase files
    const existingPreviews = existing.map((filename) => ({
      url: pb.files.getURL(prop, filename),
      isNew: false,
      name: filename,
    }))
    setPreviewUrls(existingPreviews)
    setCustomFeatureInput('')
    setIsFormOpen(true)
  }

  const inferPropertyType = (title: string): PropertyType => {
    const t = (title || '').toLowerCase()
    if (t.includes('cobertura')) return 'cobertura'
    if (t.includes('casa') || t.includes('mansão') || t.includes('residência')) return 'casa'
    if (t.includes('terreno') || t.includes('lote')) return 'terreno'
    if (t.includes('sala') || t.includes('comercial')) return 'sala_comercial'
    return 'apartamento'
  }

  // Handle image files selection from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Limit to max 10 images total
    const totalCount = existingImages.length + newImageFiles.length + files.length
    if (totalCount > 10) {
      toast({
        title: 'Limite de fotos atingido',
        description: 'Você pode adicionar no máximo 10 fotos por imóvel.',
        variant: 'destructive',
      })
      return
    }

    const newPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      isNew: true,
      name: file.name,
    }))

    setNewImageFiles((prev) => [...prev, ...files])
    setPreviewUrls((prev) => {
      const combined = [...prev, ...newPreviews]
      // If no cover image yet, set first one as cover
      if (!formState.cover_image && combined.length > 0) {
        setFormState((fs) => ({ ...fs, cover_image: combined[0].name }))
      }
      return combined
    })
  }

  // Remove image from gallery (new or existing)
  const handleRemoveImage = (index: number) => {
    const target = previewUrls[index]
    if (target.isNew) {
      // Find index in newImageFiles
      setNewImageFiles((prev) => prev.filter((f) => f.name !== target.name))
      URL.revokeObjectURL(target.url)
    } else {
      setExistingImages((prev) => prev.filter((img) => img !== target.name))
    }

    setPreviewUrls((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      // If we removed the cover image, fallback to the next available
      if (formState.cover_image === target.name) {
        setFormState((fs) => ({
          ...fs,
          cover_image: updated.length > 0 ? updated[0].name : '',
        }))
      }
      return updated
    })
  }

  // Set selected photo as cover
  const handleSetCover = (name: string) => {
    setFormState((prev) => ({ ...prev, cover_image: name }))
    toast({
      title: 'Foto de Capa Definida',
      description: `Esta imagem será a principal do anúncio e catálogo.`,
    })
  }

  // Toggle pre-defined feature tag
  const handleToggleFeature = (feat: string) => {
    setFormState((prev) => {
      const exists = prev.features.includes(feat)
      return {
        ...prev,
        features: exists ? prev.features.filter((f) => f !== feat) : [...prev.features, feat],
      }
    })
  }

  // Add custom feature tag
  const handleAddCustomFeature = () => {
    const trimmed = customFeatureInput.trim()
    if (!trimmed) return
    if (formState.features.includes(trimmed)) {
      setCustomFeatureInput('')
      return
    }
    setFormState((prev) => ({
      ...prev,
      features: [...prev.features, trimmed],
    }))
    setCustomFeatureInput('')
  }

  // Save / Update Property
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formState.title.trim()) {
      toast({ title: 'Preencha o título do imóvel', variant: 'destructive' })
      return
    }
    if (!formState.price || Number(formState.price) <= 0) {
      toast({ title: 'Informe um valor válido para o imóvel', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', formState.title.trim())
      formData.append('property_type', formState.property_type)
      formData.append('price', String(Number(formState.price)))
      formData.append('modality', formState.modality)
      formData.append('status', formState.status)
      formData.append('address', formState.address)
      formData.append('neighborhood', formState.neighborhood)
      formData.append('city', formState.city || 'Porto Alegre - RS')
      formData.append('area_sqm', String(Number(formState.area_sqm) || 0))
      formData.append('bedrooms', String(Number(formState.bedrooms) || 0))
      formData.append('bathrooms', String(Number(formState.bathrooms) || 0))
      formData.append('suites', String(Number(formState.suites) || 0))
      formData.append('parking_spots', String(Number(formState.parking_spots) || 0))
      formData.append('description', formState.description)
      formData.append('featured', String(formState.featured))
      formData.append('features', JSON.stringify(formState.features))

      // Append new file uploads
      for (const file of newImageFiles) {
        formData.append('images', file)
      }

      // If editing, manage existing images (pass them back so unremoved ones are kept)
      if (editingProperty) {
        // PocketBase handles existing files when updating; existing images can be kept or removed
        // We set cover_image explicitly
        let resolvedCover = formState.cover_image
        // If cover was a newly uploaded file that doesn't exist yet on PB, PB will name it.
        // We'll pass the name or leave empty so it falls back to images[0]
        formData.append('cover_image', resolvedCover || '')

        await updateProperty(editingProperty.id, formData)
        toast({
          title: 'Imóvel atualizado com sucesso!',
          description: `"${formState.title}" foi salvo na carteira.`,
        })
      } else {
        if (formState.cover_image) {
          formData.append('cover_image', formState.cover_image)
        }
        await createProperty(formData)
        toast({
          title: 'Novo imóvel cadastrado!',
          description: `"${formState.title}" já está disponível para seus clientes.`,
        })
      }

      setIsFormOpen(false)
      fetchProperties()
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao salvar imóvel',
        description: err.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Quick inline status change (available / reserved / sold)
  const handleQuickStatusChange = async (id: string, newStatus: PropertyStatus) => {
    try {
      await updatePropertyStatus(id, newStatus)
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)))
      toast({
        title: 'Status atualizado!',
        description: `Imóvel marcado como ${
          newStatus === 'available'
            ? 'Disponível'
            : newStatus === 'reserved'
              ? 'Reservado'
              : 'Vendido'
        }.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar status',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Confirm delete single property
  const handleConfirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteProperty(deleteId)
      setProperties((prev) => prev.filter((p) => p.id !== deleteId))
      setSelectedIds((prev) => prev.filter((id) => id !== deleteId))
      toast({ title: 'Imóvel excluído com sucesso.' })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir imóvel',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setDeleteId(null)
    }
  }

  // Bulk status change
  const handleBulkStatus = async (newStatus: PropertyStatus) => {
    if (selectedIds.length === 0) return
    try {
      await Promise.all(selectedIds.map((id) => updatePropertyStatus(id, newStatus)))
      setProperties((prev) =>
        prev.map((p) => (selectedIds.includes(p.id) ? { ...p, status: newStatus } : p)),
      )
      toast({
        title: 'Ação em lote concluída!',
        description: `${selectedIds.length} imóveis atualizados para "${
          newStatus === 'available'
            ? 'Disponível'
            : newStatus === 'reserved'
              ? 'Reservado'
              : 'Vendido'
        }".`,
      })
      setSelectedIds([])
    } catch (err: any) {
      toast({
        title: 'Erro na atualização em lote',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map((id) => deleteProperty(id)))
      setProperties((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
      toast({
        title: 'Exclusão em lote concluída',
        description: `${selectedIds.length} imóveis removidos do catálogo.`,
      })
      setSelectedIds([])
    } catch (err: any) {
      toast({ title: 'Erro ao excluir em lote', description: err.message, variant: 'destructive' })
    } finally {
      setBulkDeleteOpen(false)
    }
  }

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProperties.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProperties.map((p) => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  // Filtered list
  const filteredProperties = properties.filter((p) => {
    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
      p.address?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())

    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    const matchType =
      filterType === 'all' || (p.property_type || inferPropertyType(p.title)) === filterType
    const matchModality = filterModality === 'all' || p.modality === filterModality
    const matchNeighborhood = filterNeighborhood === 'all' || p.neighborhood === filterNeighborhood

    return matchSearch && matchStatus && matchType && matchModality && matchNeighborhood
  })

  // Metrics summary
  const totalCount = properties.length
  const availableCount = properties.filter((p) => p.status === 'available').length
  const reservedCount = properties.filter((p) => p.status === 'reserved').length
  const soldCount = properties.filter((p) => p.status === 'sold').length
  const totalPortfolioValue = properties.reduce((acc, p) => acc + (Number(p.price) || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 sm:p-7 rounded-2xl card-elevated border-t-4 border-t-[#D4AF37]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2.5 h-6 bg-[#D4AF37] rounded-sm inline-block" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A3636] tracking-tight">
              Área Administrativa de Imóveis
            </h1>
            <Badge className="bg-[#1A3636] text-[#D4AF37] border border-[#D4AF37]/40 font-bold text-xs uppercase tracking-wide">
              Gestão da Vera
            </Badge>
          </div>
          <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
            Cadastre novos imóveis, gerencie a carteira em tempo real, faça upload de fotos, defina
            a imagem de capa e altere status de disponibilidade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Link to="/imoveis">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-[#1A3636] hover:bg-gray-100 text-xs font-semibold gap-1.5"
            >
              <Eye className="w-4 h-4 text-[#D4AF37]" />
              Ver Catálogo Público
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchProperties}
            disabled={loading}
            className="border-gray-300 text-[#1A3636] hover:bg-gray-100 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="bg-[#1A3636] hover:bg-[#254d4d] text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md shadow-[#1A3636]/20 gap-2 cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            Cadastrar Novo Imóvel
          </Button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="card-elevated border-l-4 border-l-[#1A3636] bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Total da Carteira
              </p>
              <h3 className="text-2xl font-black text-[#1A3636] mt-0.5">{totalCount}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">imóveis cadastrados</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#1A3636]/10 flex items-center justify-center text-[#1A3636]">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated border-l-4 border-l-emerald-600 bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Disponíveis
              </p>
              <h3 className="text-2xl font-black text-emerald-700 mt-0.5">{availableCount}</h3>
              <p className="text-[10px] text-emerald-600 mt-0.5">abertos para visita</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated border-l-4 border-l-amber-500 bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Reservados
              </p>
              <h3 className="text-2xl font-black text-amber-700 mt-0.5">{reservedCount}</h3>
              <p className="text-[10px] text-amber-600 mt-0.5">em proposta / sinal</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated border-l-4 border-l-blue-600 bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Vendidos
              </p>
              <h3 className="text-2xl font-black text-blue-700 mt-0.5">{soldCount}</h3>
              <p className="text-[10px] text-blue-600 mt-0.5">negócios concluídos</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
              <Archive className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated border-l-4 border-l-[#D4AF37] bg-white col-span-2 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#1A3636] uppercase tracking-wider">
                Valor Total em Carteira
              </p>
              <h3 className="text-base sm:text-lg font-black text-[#1A3636] mt-0.5 truncate">
                R$ {(totalPortfolioValue / 1000000).toFixed(1)}M
              </h3>
              <p className="text-[10px] text-[#D4AF37] font-semibold mt-0.5">
                Porto Alegre & Região
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#1A3636]">
              <DollarSign className="w-5 h-5 text-[#1A3636]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl card-elevated space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar por título, bairro, endereço ou características..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-50/70 border-gray-200 text-xs h-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Status */}
          <div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="text-xs h-10 bg-gray-50/70 border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="available">🟢 Disponível</SelectItem>
                <SelectItem value="reserved">🟡 Reservado</SelectItem>
                <SelectItem value="sold">🔵 Vendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Property Type */}
          <div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="text-xs h-10 bg-gray-50/70 border-gray-200">
                <SelectValue placeholder="Tipo de Imóvel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="apartamento">Apartamento</SelectItem>
                <SelectItem value="cobertura">Cobertura</SelectItem>
                <SelectItem value="casa">Casa / Mansão</SelectItem>
                <SelectItem value="terreno">Terreno / Lote</SelectItem>
                <SelectItem value="sala_comercial">Sala Comercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Modality */}
          <div>
            <Select value={filterModality} onValueChange={setFilterModality}>
              <SelectTrigger className="text-xs h-10 bg-gray-50/70 border-gray-200">
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Modalidades</SelectItem>
                <SelectItem value="sale">Venda Direta</SelectItem>
                <SelectItem value="financing">Financiamento</SelectItem>
                <SelectItem value="permuta">Aceita Permuta</SelectItem>
                <SelectItem value="rent">Locação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Second row: Quick Bairros Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> Bairros:
          </span>
          <button
            onClick={() => setFilterNeighborhood('all')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
              filterNeighborhood === 'all'
                ? 'bg-[#1A3636] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({properties.length})
          </button>
          {PORTO_ALEGRE_NEIGHBORHOODS.slice(0, 7).map((bairro) => {
            const count = properties.filter((p) => p.neighborhood === bairro).length
            if (count === 0) return null
            const active = filterNeighborhood === bairro
            return (
              <button
                key={bairro}
                onClick={() => setFilterNeighborhood(active ? 'all' : bairro)}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
                  active
                    ? 'bg-[#D4AF37] text-[#1A3636] font-bold shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {bairro} ({count})
              </button>
            )
          })}
        </div>

        {/* Bulk Action Bar (Visible when items selected) */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#1A3636]/5 border border-[#1A3636]/15 rounded-xl animate-fade-in">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#1A3636] text-white font-bold px-2 py-0.5">
                {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
              </Badge>
              <span className="text-xs text-gray-600">Ações em lote para a carteira:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatus('available')}
                className="text-xs h-8 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                Marcar como Disponível
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatus('reserved')}
                className="text-xs h-8 border-amber-600 text-amber-700 hover:bg-amber-50"
              >
                Marcar como Reservado
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatus('sold')}
                className="text-xs h-8 border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                Marcar como Vendido
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                className="text-xs h-8 border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Excluir Selecionados
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table / Grid View */}
      <div className="bg-white rounded-2xl card-elevated overflow-hidden border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold hover:text-[#1A3636]"
            >
              {selectedIds.length > 0 && selectedIds.length === filteredProperties.length ? (
                <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span>Selecionar Todos ({filteredProperties.length})</span>
            </button>
          </div>
          <span className="text-xs text-gray-500">
            Mostrando <b>{filteredProperties.length}</b> de <b>{properties.length}</b> imóveis
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-xl animate-pulse">
                <Skeleton className="w-24 h-20 rounded-lg bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3 bg-gray-200" />
                  <Skeleton className="h-4 w-1/2 bg-gray-100" />
                  <Skeleton className="h-3 w-1/4 bg-gray-100" />
                </div>
                <Skeleton className="w-28 h-8 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-gray-700 text-base">Nenhum imóvel encontrado</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Tente ajustar os filtros de busca ou cadastre um novo imóvel para a carteira da Vera.
            </p>
            <Button
              onClick={handleOpenCreate}
              className="bg-[#1A3636] hover:bg-[#254d4d] text-white text-xs gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" /> Cadastrar Primeiro Imóvel
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProperties.map((prop) => {
              const isSelected = selectedIds.includes(prop.id)
              const imageUrl = getPropertyImageUrl(prop)
              const propType = prop.property_type || inferPropertyType(prop.title)
              const totalImages = (prop.images && prop.images.length) || 0

              return (
                <div
                  key={prop.id}
                  className={`p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors hover:bg-gray-50/80 ${
                    isSelected ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Left: Checkbox + Photo Thumbnail + Info */}
                  <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                    <button
                      onClick={() => toggleSelect(prop.id)}
                      className="mt-2 text-gray-400 hover:text-[#1A3636]"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    {/* Thumbnail with cover badge */}
                    <div className="relative w-24 h-20 sm:w-28 sm:h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 group">
                      <img
                        src={imageUrl}
                        alt={prop.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {totalImages > 1 && (
                        <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-semibold px-1.5 py-0.2 rounded">
                          {totalImages} fotos
                        </span>
                      )}
                      {prop.featured && (
                        <span
                          className="absolute top-1 left-1 bg-[#D4AF37] text-[#1A3636] p-0.5 rounded shadow"
                          title="Destaque no Catálogo"
                        >
                          <Star className="w-3 h-3 fill-current" />
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold uppercase px-2 py-0 border-gray-300 bg-white"
                        >
                          {propType === 'apartamento' && 'Apartamento'}
                          {propType === 'cobertura' && 'Cobertura'}
                          {propType === 'casa' && 'Casa / Mansão'}
                          {propType === 'terreno' && 'Terreno'}
                          {propType === 'sala_comercial' && 'Sala Comercial'}
                          {propType === 'outro' && 'Imóvel'}
                        </Badge>

                        <Badge
                          className={`text-[10px] font-bold px-2 py-0 ${
                            prop.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : prop.status === 'reserved'
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {prop.status === 'available' && '🟢 Disponível'}
                          {prop.status === 'reserved' && '🟡 Reservado'}
                          {prop.status === 'sold' && '🔵 Vendido'}
                        </Badge>

                        <Badge className="bg-[#1A3636] text-[#D4AF37] text-[10px] font-bold border-none px-2 py-0">
                          {prop.modality === 'sale' && 'Venda'}
                          {prop.modality === 'financing' && 'Financiável'}
                          {prop.modality === 'permuta' && 'Aceita Permuta'}
                          {prop.modality === 'rent' && 'Locação'}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-[#1A3636] truncate leading-tight">
                        {prop.title}
                      </h3>

                      <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        {prop.address ? `${prop.address}, ` : ''}
                        <b>{prop.neighborhood}</b> — {prop.city || 'Porto Alegre - RS'}
                      </p>

                      {/* Specs pills */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600 pt-1">
                        <span className="font-semibold text-gray-900">
                          {prop.area_sqm ? `${prop.area_sqm} m²` : '-- m²'}
                        </span>
                        <span>•</span>
                        <span>{prop.bedrooms || 0} dorms</span>
                        <span>•</span>
                        <span>{prop.suites || 0} suítes</span>
                        <span>•</span>
                        <span>{prop.parking_spots || 0} vagas</span>
                        <span>•</span>
                        <span className="text-[11px] text-gray-400">
                          ID: {prop.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price + Status Select + Action Buttons */}
                  <div className="flex flex-wrap lg:flex-col items-end justify-between w-full lg:w-auto gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <div className="text-left lg:text-right">
                      <span className="text-xs text-gray-400 block font-medium">
                        Valor de Anúncio
                      </span>
                      <span className="text-lg sm:text-xl font-extrabold text-[#1A3636]">
                        R$ {prop.price?.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Inline status quick switch */}
                      <Select
                        value={prop.status}
                        onValueChange={(val) =>
                          handleQuickStatusChange(prop.id, val as PropertyStatus)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs w-32 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">🟢 Disponível</SelectItem>
                          <SelectItem value="reserved">🟡 Reservado</SelectItem>
                          <SelectItem value="sold">🔵 Vendido</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewProperty(prop)}
                        title="Ver apresentação"
                        className="h-8 w-8 p-0 text-gray-600 hover:text-[#1A3636]"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(prop)}
                        className="h-8 text-xs font-semibold border-gray-300 text-[#1A3636] hover:bg-[#1A3636] hover:text-white"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(prop.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                        title="Excluir imóvel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT PROPERTY MODAL */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-[#D4AF37]/30 bg-white">
          <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-[#1A3636] text-white">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-[#D4AF37] rounded-xs" />
              <DialogTitle className="text-xl font-bold text-white">
                {editingProperty ? 'Editar Dados do Imóvel' : 'Cadastrar Novo Imóvel'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-white/70">
              Preencha os detalhes completos para a carteira da Corretora Vera Lúcia Koren. Os dados
              alimentam o catálogo público e a IA de recomendação.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* Tabs for Organization */}
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid grid-cols-3 bg-gray-100 p-1 rounded-xl mb-4">
                <TabsTrigger value="dados" className="text-xs font-semibold">
                  1. Dados Principais
                </TabsTrigger>
                <TabsTrigger value="fotos" className="text-xs font-semibold">
                  2. Fotos & Capa ({previewUrls.length})
                </TabsTrigger>
                <TabsTrigger value="detalhes" className="text-xs font-semibold">
                  3. Diferenciais & Lazer
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: DADOS PRINCIPAIS */}
              <TabsContent value="dados" className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-xs font-bold text-gray-700">
                    Título do Imóvel *
                  </Label>
                  <Input
                    id="title"
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    placeholder="Ex: Cobertura Duplex com Jacuzzi e Vista 360° no Petrópolis"
                    className="text-xs mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="prop_type" className="text-xs font-bold text-gray-700">
                      Tipo de Imóvel *
                    </Label>
                    <Select
                      value={formState.property_type}
                      onValueChange={(val) =>
                        setFormState({ ...formState, property_type: val as PropertyType })
                      }
                    >
                      <SelectTrigger id="prop_type" className="text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartamento">Apartamento Padrão</SelectItem>
                        <SelectItem value="cobertura">Cobertura</SelectItem>
                        <SelectItem value="casa">Casa / Mansão</SelectItem>
                        <SelectItem value="terreno">Terreno / Lote</SelectItem>
                        <SelectItem value="sala_comercial">Sala Comercial</SelectItem>
                        <SelectItem value="outro">Outro Tipo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-xs font-bold text-gray-700">
                      Valor de Venda / Anúncio (R$) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={formState.price}
                      onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                      placeholder="Ex: 2450000"
                      className="text-xs mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-xs font-bold text-gray-700">
                      Status de Disponibilidade
                    </Label>
                    <Select
                      value={formState.status}
                      onValueChange={(val) =>
                        setFormState({ ...formState, status: val as PropertyStatus })
                      }
                    >
                      <SelectTrigger id="status" className="text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">🟢 Disponível</SelectItem>
                        <SelectItem value="reserved">🟡 Reservado</SelectItem>
                        <SelectItem value="sold">🔵 Vendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="modality" className="text-xs font-bold text-gray-700">
                      Modalidade de Compra
                    </Label>
                    <Select
                      value={formState.modality}
                      onValueChange={(val) =>
                        setFormState({ ...formState, modality: val as PropertyModality })
                      }
                    >
                      <SelectTrigger id="modality" className="text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">Venda Direta / À Vista</SelectItem>
                        <SelectItem value="financing">Aceita Financiamento & FGTS</SelectItem>
                        <SelectItem value="permuta">Aceita Permuta de Imóvel</SelectItem>
                        <SelectItem value="rent">Locação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="neighborhood" className="text-xs font-bold text-gray-700">
                      Bairro em Porto Alegre *
                    </Label>
                    <Input
                      id="neighborhood"
                      value={formState.neighborhood}
                      onChange={(e) => setFormState({ ...formState, neighborhood: e.target.value })}
                      placeholder="Ex: Moinhos de Vento, Bela Vista, Petrópolis"
                      className="text-xs mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-xs font-bold text-gray-700">
                      Cidade / UF
                    </Label>
                    <Input
                      id="city"
                      value={formState.city}
                      onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                      placeholder="Porto Alegre - RS"
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="text-xs font-bold text-gray-700">
                    Endereço / Referência
                  </Label>
                  <Input
                    id="address"
                    value={formState.address}
                    onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                    placeholder="Ex: Rua Dinarte Ribeiro, 350 - Próximo ao Parcão"
                    className="text-xs mt-1"
                  />
                </div>

                {/* Métricas Numéricas */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  <div>
                    <Label
                      htmlFor="area_sqm"
                      className="text-xs font-bold text-gray-700 flex items-center gap-1"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Área (m²)
                    </Label>
                    <Input
                      id="area_sqm"
                      type="number"
                      value={formState.area_sqm}
                      onChange={(e) => setFormState({ ...formState, area_sqm: e.target.value })}
                      placeholder="180"
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="bedrooms"
                      className="text-xs font-bold text-gray-700 flex items-center gap-1"
                    >
                      <BedDouble className="w-3.5 h-3.5 text-[#D4AF37]" /> Dormitórios
                    </Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formState.bedrooms}
                      onChange={(e) => setFormState({ ...formState, bedrooms: e.target.value })}
                      placeholder="3"
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="suites"
                      className="text-xs font-bold text-gray-700 flex items-center gap-1"
                    >
                      <Bath className="w-3.5 h-3.5 text-[#D4AF37]" /> Suítes
                    </Label>
                    <Input
                      id="suites"
                      type="number"
                      value={formState.suites}
                      onChange={(e) => setFormState({ ...formState, suites: e.target.value })}
                      placeholder="2"
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="bathrooms"
                      className="text-xs font-bold text-gray-700 flex items-center gap-1"
                    >
                      <Bath className="w-3.5 h-3.5 text-[#D4AF37]" /> Banheiros
                    </Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formState.bathrooms}
                      onChange={(e) => setFormState({ ...formState, bathrooms: e.target.value })}
                      placeholder="3"
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="parking"
                      className="text-xs font-bold text-gray-700 flex items-center gap-1"
                    >
                      <Car className="w-3.5 h-3.5 text-[#D4AF37]" /> Vagas
                    </Label>
                    <Input
                      id="parking"
                      type="number"
                      value={formState.parking_spots}
                      onChange={(e) =>
                        setFormState({ ...formState, parking_spots: e.target.value })
                      }
                      placeholder="2"
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 mt-2">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="featured"
                      className="text-xs font-bold text-[#1A3636] cursor-pointer"
                    >
                      Destacar no Catálogo e Home
                    </Label>
                    <p className="text-[11px] text-gray-500">
                      Imóveis em destaque aparecem primeiro nas buscas e recomendações da IA.
                    </p>
                  </div>
                  <Switch
                    id="featured"
                    checked={formState.featured}
                    onCheckedChange={(checked) => setFormState({ ...formState, featured: checked })}
                  />
                </div>
              </TabsContent>

              {/* TAB 2: FOTOS & UPLOAD COM CAPA */}
              <TabsContent value="fotos" className="space-y-4">
                <div className="p-4 rounded-xl border-2 border-dashed border-[#D4AF37]/50 bg-amber-50/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#1A3636] text-[#D4AF37] flex items-center justify-center mx-auto shadow-sm">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[#1A3636]">Upload de Fotos do Imóvel</h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Selecione imagens nítidas (JPEG ou PNG de até 10MB). Você pode escolher qual
                      será a <b>foto de capa</b> clicando no botão estrelar.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#1A3636] hover:bg-[#254d4d] text-white text-xs font-bold gap-2"
                  >
                    <ImageIcon className="w-4 h-4 text-[#D4AF37]" /> Selecionar Fotos do Computador
                  </Button>
                </div>

                {/* Previews Grid */}
                {previewUrls.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-gray-700">
                        Galeria ({previewUrls.length} foto{previewUrls.length > 1 ? 's' : ''}):
                      </Label>
                      <span className="text-[11px] text-gray-500">
                        Clique em <b>"Definir Capa"</b> para marcar a foto principal
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {previewUrls.map((item, idx) => {
                        const isCover =
                          formState.cover_image === item.name ||
                          (!formState.cover_image && idx === 0)

                        return (
                          <div
                            key={idx}
                            className={`relative rounded-xl overflow-hidden border-2 transition-all group bg-gray-100 ${
                              isCover
                                ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-md'
                                : 'border-gray-200'
                            }`}
                          >
                            <img
                              src={item.url}
                              alt={`Foto ${idx + 1}`}
                              className="w-full h-28 object-cover"
                            />

                            {/* Cover Badge */}
                            {isCover && (
                              <span className="absolute top-1.5 left-1.5 bg-[#D4AF37] text-[#1A3636] text-[10px] font-extrabold px-2 py-0.5 rounded shadow flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" /> CAPA
                              </span>
                            )}

                            {/* Controls Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow"
                                  title="Remover foto"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="text-center">
                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetCover(item.name)}
                                    className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#1A3636] text-[10px] font-bold px-2 py-1 rounded shadow"
                                  >
                                    Definir Capa
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                    Nenhuma foto anexada. O imóvel usará fotos ilustrativas de alto padrão com base
                    na localização enquanto novas imagens não forem enviadas.
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: DIFERENCIAIS E DESCRIÇÃO */}
              <TabsContent value="detalhes" className="space-y-4">
                <div>
                  <Label htmlFor="description" className="text-xs font-bold text-gray-700">
                    Descrição Detalhada do Imóvel
                  </Label>
                  <Textarea
                    id="description"
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    placeholder="Descreva a iluminação natural, vista, acabamentos nobres (mármore, madeira), infraestrutura do condomínio e diferenciais exclusivos..."
                    rows={4}
                    className="text-xs mt-1"
                  />
                </div>

                {/* Tags Selecionáveis */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">
                    Diferenciais, Infraestrutura e Lazer:
                  </Label>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    {COMMON_FEATURES.map((feat) => {
                      const selected = formState.features.includes(feat)
                      return (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => handleToggleFeature(feat)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                            selected
                              ? 'bg-[#1A3636] text-[#D4AF37] font-semibold shadow-xs'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {selected ? (
                            <Check className="w-3 h-3 text-[#D4AF37]" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          <span>{feat}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Adicionar tag personalizada */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar diferencial personalizado (ex: Adega Climatizada 300 rótulos)..."
                    value={customFeatureInput}
                    onChange={(e) => setCustomFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCustomFeature()
                      }
                    }}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomFeature}
                    variant="outline"
                    className="text-xs shrink-0"
                  >
                    Adicionar
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#1A3636] hover:bg-[#254d4d] text-white font-bold gap-2 px-6"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    Salvando Dados...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    {editingProperty ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog Single Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Excluir Imóvel da Carteira
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Tem certeza que deseja remover este imóvel? Esta ação é definitiva e removerá o
              anúncio do catálogo público e propostas vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, Excluir Imóvel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog Bulk Delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Excluir {selectedIds.length} Imóveis em Lote
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Deseja realmente remover os {selectedIds.length} imóveis selecionados? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, Excluir Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Modal Preview */}
      <PropertyDetailModal
        property={viewProperty}
        isOpen={!!viewProperty}
        onClose={() => setViewProperty(null)}
      />
    </div>
  )
}
