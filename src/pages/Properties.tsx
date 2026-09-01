import React, { useEffect, useState } from 'react'
import {
  Building2,
  Plus,
  Search,
  BedDouble,
  Bath,
  Car,
  Maximize,
  MapPin,
  Sparkles,
  Tag,
  CheckCircle2,
  Edit,
  Trash2,
  Image as ImageIcon,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyImageUrl,
} from '@/services/properties'
import PropertyDetailModal from '@/components/PropertyDetailModal'
import { getWhatsAppUrl } from '@/components/FloatingWhatsApp'
import { MessageCircle } from 'lucide-react'
import type { Property } from '@/types'

export default function Properties() {
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [search, setSearch] = useState('')
  const [selectedModality, setSelectedModality] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [viewingDetailProp, setViewingDetailProp] = useState<Property | null>(null)

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProp, setEditingProp] = useState<Property | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    neighborhood: '',
    city: 'Porto Alegre - RS',
    price: 0,
    bedrooms: 3,
    bathrooms: 3,
    suites: 2,
    parking_spots: 2,
    area_sqm: 150,
    modality: 'sale' as Property['modality'],
    status: 'available' as Property['status'],
    features: '' as string, // comma separated
    featured: true,
  })

  const loadProperties = async () => {
    try {
      setLoading(true)
      const data = await getProperties()
      setProperties(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProperties()
  }, [])

  const handleOpenCreate = () => {
    setEditingProp(null)
    setFormData({
      title: '',
      description: '',
      address: '',
      neighborhood: '',
      city: 'Porto Alegre - RS',
      price: 1500000,
      bedrooms: 3,
      bathrooms: 3,
      suites: 2,
      parking_spots: 2,
      area_sqm: 150,
      modality: 'sale',
      status: 'available',
      features: 'Piscina, Varanda Gourmet, Ar Condicionado, Segurança 24h',
      featured: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (prop: Property) => {
    setEditingProp(prop)
    setFormData({
      title: prop.title,
      description: prop.description || '',
      address: prop.address || '',
      neighborhood: prop.neighborhood || '',
      city: prop.city || 'Porto Alegre - RS',
      price: prop.price || 0,
      bedrooms: prop.bedrooms || 0,
      bathrooms: prop.bathrooms || 0,
      suites: prop.suites || 0,
      parking_spots: prop.parking_spots || 0,
      area_sqm: prop.area_sqm || 0,
      modality: prop.modality || 'sale',
      status: prop.status || 'available',
      features: prop.features ? prop.features.join(', ') : '',
      featured: prop.featured ?? true,
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.price) {
      toast({ title: 'Preencha o título e valor do imóvel', variant: 'destructive' })
      return
    }

    const payload: Partial<Property> = {
      title: formData.title,
      description: formData.description,
      address: formData.address,
      neighborhood: formData.neighborhood,
      city: formData.city,
      price: Number(formData.price),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      suites: Number(formData.suites),
      parking_spots: Number(formData.parking_spots),
      area_sqm: Number(formData.area_sqm),
      modality: formData.modality,
      status: formData.status,
      featured: formData.featured,
      features: formData.features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
    }

    try {
      if (editingProp) {
        await updateProperty(editingProp.id, payload)
        toast({ title: 'Imóvel atualizado com sucesso!' })
      } else {
        await createProperty(payload)
        toast({ title: 'Imóvel cadastrado com sucesso!' })
      }
      setIsModalOpen(false)
      loadProperties()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este imóvel do catálogo?')) {
      try {
        await deleteProperty(id)
        toast({ title: 'Imóvel removido' })
        loadProperties()
      } catch (err: any) {
        toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
      }
    }
  }

  const filteredProperties = properties.filter((p) => {
    const matchSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase())
    const matchModality = selectedModality === 'all' || p.modality === selectedModality
    return matchSearch && matchModality
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl card-elevated">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3636] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#D4AF37]" /> Catálogo & Gestão de Imóveis
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Portfólio exclusivo de coberturas, casas em condomínio e apartamentos de alto padrão.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#1A3636] text-white hover:bg-[#254d4d] gap-2"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          Cadastrar Novo Imóvel
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl card-elevated">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Buscar por bairro, condomínio, descrição (ex: Jardins, Alphaville, piscina)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50/50"
          />
        </div>

        <div>
          <Select value={selectedModality} onValueChange={setSelectedModality}>
            <SelectTrigger>
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Modalidades</SelectItem>
              <SelectItem value="sale">Venda</SelectItem>
              <SelectItem value="financing">Aceita Financiamento</SelectItem>
              <SelectItem value="permuta">Aceita Permuta</SelectItem>
              <SelectItem value="rent">Locação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400">
            Carregando catálogo de imóveis...
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl card-elevated">
            Nenhum imóvel encontrado.
          </div>
        ) : (
          filteredProperties.map((prop) => {
            const imageUrl = getPropertyImageUrl(prop)
            return (
              <Card
                key={prop.id}
                className="card-elevated hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image Header with Badges */}
                  <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gray-100">
                    <img
                      src={imageUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      <Badge className="bg-[#1A3636] text-[#D4AF37] font-semibold text-[10px] border-none shadow">
                        {prop.modality === 'sale' && 'Venda'}
                        {prop.modality === 'financing' && 'Financiável'}
                        {prop.modality === 'permuta' && 'Permuta'}
                        {prop.modality === 'rent' && 'Locação'}
                      </Badge>
                      {prop.status === 'reserved' && (
                        <Badge className="bg-amber-600 text-white text-[10px]">Reservado</Badge>
                      )}
                      {prop.status === 'sold' && (
                        <Badge className="bg-emerald-600 text-white text-[10px]">Vendido</Badge>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3">
                      <span className="bg-black/75 backdrop-blur-sm text-white font-bold text-sm px-2.5 py-1 rounded-md">
                        R$ {prop.price?.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base font-bold text-[#1A3636] line-clamp-1">
                      {prop.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {prop.neighborhood} • {prop.city}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-4 gap-2 py-2 border-y border-gray-100 text-center text-gray-600">
                      <div className="flex flex-col items-center">
                        <Maximize className="w-4 h-4 text-[#D4AF37] mb-0.5" />
                        <span className="text-xs font-semibold">{prop.area_sqm || '--'} m²</span>
                        <span className="text-[10px] text-gray-400">Área</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <BedDouble className="w-4 h-4 text-[#D4AF37] mb-0.5" />
                        <span className="text-xs font-semibold">{prop.bedrooms || '--'}</span>
                        <span className="text-[10px] text-gray-400">Dorms</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Bath className="w-4 h-4 text-[#D4AF37] mb-0.5" />
                        <span className="text-xs font-semibold">{prop.suites || '--'}</span>
                        <span className="text-[10px] text-gray-400">Suítes</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Car className="w-4 h-4 text-[#D4AF37] mb-0.5" />
                        <span className="text-xs font-semibold">{prop.parking_spots || '--'}</span>
                        <span className="text-[10px] text-gray-400">Vagas</span>
                      </div>
                    </div>

                    {prop.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {prop.description}
                      </p>
                    )}

                    {prop.features && prop.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {prop.features.slice(0, 3).map((f, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[10px] bg-gray-100 text-gray-700 font-normal"
                          >
                            {f}
                          </Badge>
                        ))}
                        {prop.features.length > 3 && (
                          <span className="text-[10px] text-gray-400 self-center">
                            +{prop.features.length - 3} mais
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">ID: {prop.id.substring(0, 8)}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(prop)}
                        className="text-xs text-[#1A3636] hover:bg-gray-200"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prop.id)}
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-gray-200/60">
                    <a
                      href={getWhatsAppUrl(
                        `Olá Vera Lúcia! Tenho interesse no imóvel "${prop.title}" (${prop.neighborhood}, R$ ${prop.price?.toLocaleString('pt-BR')}). Poderia me passar mais detalhes?`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" /> Falar no WhatsApp
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingDetailProp(prop)}
                      className="text-xs text-[#1A3636]"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <PropertyDetailModal
        property={viewingDetailProp}
        isOpen={!!viewingDetailProp}
        onClose={() => setViewingDetailProp(null)}
      />

      {/* Modal Form: Create / Edit Property */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A3636]">
              {editingProp ? 'Editar Dados do Imóvel' : 'Cadastrar Novo Imóvel'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Detalhes do imóvel para apresentação a clientes e cruzamento com a Vera AI.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="space-y-3">
              <div>
                <Label htmlFor="prop_title">Título do Imóvel *</Label>
                <Input
                  id="prop_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Cobertura Triplex com Vista Panorâmica nos Jardins"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="prop_price">Valor (R$) *</Label>
                  <Input
                    id="prop_price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="prop_modality">Modalidade</Label>
                  <Select
                    value={formData.modality}
                    onValueChange={(val) =>
                      setFormData({ ...formData, modality: val as Property['modality'] })
                    }
                  >
                    <SelectTrigger id="prop_modality">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Venda Direta</SelectItem>
                      <SelectItem value="financing">Aceita Financiamento</SelectItem>
                      <SelectItem value="permuta">Aceita Permuta</SelectItem>
                      <SelectItem value="rent">Locação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="prop_status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) =>
                      setFormData({ ...formData, status: val as Property['status'] })
                    }
                  >
                    <SelectTrigger id="prop_status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="reserved">Reservado</SelectItem>
                      <SelectItem value="sold">Vendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Ex: Jardins, Vila Nova Conceição, Alphaville"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade / Estado</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo - SP"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Endereço Completo (Opcional)</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ex: Alameda Lorena, 1420"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <Label htmlFor="area_sqm">Área (m²)</Label>
                  <Input
                    id="area_sqm"
                    type="number"
                    value={formData.area_sqm}
                    onChange={(e) => setFormData({ ...formData, area_sqm: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="bedrooms">Dormitórios</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="suites">Suítes</Label>
                  <Input
                    id="suites"
                    type="number"
                    value={formData.suites}
                    onChange={(e) => setFormData({ ...formData, suites: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Banheiros</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) =>
                      setFormData({ ...formData, bathrooms: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="parking_spots">Vagas</Label>
                  <Input
                    id="parking_spots"
                    type="number"
                    value={formData.parking_spots}
                    onChange={(e) =>
                      setFormData({ ...formData, parking_spots: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="features">Diferenciais e Lazer (separados por vírgula)</Label>
                <Input
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Piscina privativa, Automação residencial, Marcenaria Ornare, Vista parque"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição Completa</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva os diferenciais, acabamentos, iluminação e condições especiais..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1A3636] text-white hover:bg-[#254d4d]">
                Salvar Imóvel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
