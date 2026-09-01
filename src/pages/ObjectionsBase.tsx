import React, { useEffect, useState } from 'react'
import {
  ShieldAlert,
  Plus,
  Search,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  BookOpen,
  Trash2,
  Edit,
  Tag,
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
  getObjections,
  createObjection,
  updateObjection,
  deleteObjection,
} from '@/services/objections'
import { Skeleton } from '@/components/ui/skeleton'
import type { Objection } from '@/types'

const CATEGORIES: { key: Objection['category']; label: string }[] = [
  { key: 'price', label: 'Preço / Orçamento' },
  { key: 'financing', label: 'Taxa de Juros & Financiamento' },
  { key: 'location', label: 'Localização & Acessos' },
  { key: 'timing', label: 'Momento de Mercado / Esperar' },
  { key: 'renovation', label: 'Reforma & Acabamentos' },
  { key: 'other', label: 'Permuta & Outros' },
]

export default function ObjectionsBase() {
  const { toast } = useToast()
  const [objections, setObjections] = useState<Objection[]>([])
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingObjection, setEditingObjection] = useState<Objection | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    category: 'price' as Objection['category'],
    description: '',
    ai_response: '',
    tactics: '',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getObjections()
      setObjections(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingObjection(null)
    setFormData({
      title: '',
      category: 'price',
      description: '',
      ai_response: '',
      tactics: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (obj: Objection) => {
    setEditingObjection(obj)
    setFormData({
      title: obj.title,
      category: obj.category || 'price',
      description: obj.description || '',
      ai_response: obj.ai_response || '',
      tactics: obj.key_tactics ? obj.key_tactics.join(', ') : '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) {
      toast({ title: 'Título é obrigatório', variant: 'destructive' })
      return
    }

    const payload: Partial<Objection> = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      ai_response: formData.ai_response,
      key_tactics: formData.tactics
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    try {
      if (editingObjection) {
        await updateObjection(editingObjection.id, payload)
        toast({ title: 'Objeção atualizada na base de conhecimento!' })
      } else {
        await createObjection(payload)
        toast({ title: 'Nova objeção cadastrada com sucesso!' })
      }
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta objeção da base?')) {
      try {
        await deleteObjection(id)
        toast({ title: 'Objeção removida' })
        loadData()
      } catch (err: any) {
        toast({ title: 'Erro ao remover', description: err.message, variant: 'destructive' })
      }
    }
  }

  const filtered = objections.filter((o) => {
    const matchSearch =
      o.title?.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase()) ||
      o.ai_response?.toLowerCase().includes(search.toLowerCase())
    const matchCat = selectedCat === 'all' || o.category === selectedCat
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl card-elevated">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3636] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#D4AF37]" /> Base de Objeções & Respostas da IA
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Armazene as principais dúvidas e hesitações de clientes e tenha respostas persuasivas
            validadas.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#1A3636] text-white hover:bg-[#254d4d] gap-2"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          Cadastrar Nova Objeção
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl card-elevated">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Buscar por objeção (ex: taxa de juros, permuta, reforma)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50/50"
          />
        </div>

        <div>
          <Select value={selectedCat} onValueChange={setSelectedCat}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria de Objeção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Objections List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-3"
              >
                <Skeleton className="h-5 w-48 bg-gray-200" />
                <Skeleton className="h-4 w-72 bg-gray-100" />
                <Skeleton className="h-24 w-full rounded-lg bg-gray-50" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-white rounded-xl card-elevated">
            Nenhuma objeção cadastrada nesta categoria.
          </div>
        ) : (
          filtered.map((obj) => (
            <Card key={obj.id} className="card-elevated border-l-4 border-l-[#D4AF37]">
              <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-gray-50 border-gray-300 text-gray-700"
                    >
                      {CATEGORIES.find((c) => c.key === obj.category)?.label || obj.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-[#1A3636]">{obj.title}</CardTitle>
                  {obj.description && (
                    <p className="text-xs text-gray-600 italic">{obj.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(obj)}
                    className="h-8 w-8 text-gray-500 hover:text-[#1A3636]"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(obj.id)}
                    className="h-8 w-8 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3">
                {/* AI Recommended Response */}
                <div className="p-4 bg-gradient-to-br from-amber-50/50 to-amber-100/30 rounded-lg border border-amber-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1A3636]">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Roteiro & Argumentação
                    Recomendada (Vera AI):
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed font-medium">
                    {obj.ai_response || 'Nenhum roteiro cadastrado.'}
                  </p>
                </div>

                {/* Key tactics pills */}
                {obj.key_tactics && obj.key_tactics.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Táticas de Apoio:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {obj.key_tactics.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 text-[11px] bg-white border border-gray-200 px-2.5 py-1 rounded-full text-gray-700 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1A3636]">
              {editingObjection ? 'Editar Objeção' : 'Cadastrar Objeção de Venda'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Estruture o argumento e ensine a Vera AI como responder aos clientes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <Label htmlFor="obj_title">Objeção do Cliente (Título) *</Label>
              <Input
                id="obj_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Acho que o IPTU e condomínio desta cobertura são muito altos"
                required
              />
            </div>

            <div>
              <Label htmlFor="obj_cat">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(val) =>
                  setFormData({ ...formData, category: val as Objection['category'] })
                }
              >
                <SelectTrigger id="obj_cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="obj_desc">Contexto / Cenário em que ocorre</Label>
              <Textarea
                id="obj_desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Ocorre quando o cliente vem de um apartamento padrão e avalia um duplex..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="obj_ai">Resposta e Argumentação Estruturada (Vera AI)</Label>
              <Textarea
                id="obj_ai"
                value={formData.ai_response}
                onChange={(e) => setFormData({ ...formData, ai_response: e.target.value })}
                placeholder="Ex: Destaque que o valor do condomínio inclui segurança patrimonial armada 24h, gerador full..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="obj_tactics">Táticas Chave (separadas por vírgula)</Label>
              <Input
                id="obj_tactics"
                value={formData.tactics}
                onChange={(e) => setFormData({ ...formData, tactics: e.target.value })}
                placeholder="Custo x Benefício da segurança, Lazer privativo sem taxa extra"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1A3636] text-white hover:bg-[#254d4d]">
                Salvar Objeção
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
