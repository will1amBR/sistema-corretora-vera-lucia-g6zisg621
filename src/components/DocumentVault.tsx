import React, { useState } from 'react'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Trash2,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Info,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import type { ClientDocument, PurchaseModality, Client, Proposal } from '@/types'
import { createDocument, deleteDocument, getDocumentDownloadUrl } from '@/services/documents'

export interface RequiredDocItem {
  type: string
  title: string
  category: 'pessoal' | 'renda' | 'residencia' | 'bancario' | 'imovel'
  description: string
  requiredFor: PurchaseModality[]
  sampleHelp?: string
}

export const CHECKLIST_BY_MODALITY: RequiredDocItem[] = [
  {
    type: 'RG / CNH',
    title: 'Documento de Identidade com Foto',
    category: 'pessoal',
    description:
      'RG ou CNH dentro do prazo de validade (frente e verso nítidos do comprador e cônjuge).',
    requiredFor: ['a_vista', 'financiamento', 'consorcio', 'permuta', 'fgts', 'misto'],
    sampleHelp: 'Pode ser a CNH Digital em PDF exportada pelo app do Governo.',
  },
  {
    type: 'CPF',
    title: 'Comprovante de Situação Cadastral CPF',
    category: 'pessoal',
    description:
      'Caso o número do CPF não conste no RG ou para certidão cadastral da Receita Federal.',
    requiredFor: ['a_vista', 'financiamento', 'consorcio', 'permuta', 'fgts', 'misto'],
  },
  {
    type: 'Certidão de Estado Civil',
    title: 'Certidão de Nascimento ou Casamento',
    category: 'pessoal',
    description: 'Certidão atualizada de nascimento, casamento ou pacto antenupcial registrado.',
    requiredFor: ['a_vista', 'financiamento', 'consorcio', 'permuta', 'fgts', 'misto'],
    sampleHelp: 'Indispensável para averbação no Cartório de Registro de Imóveis de Porto Alegre.',
  },
  {
    type: 'Comprovante de Residência',
    title: 'Comprovante de Residência Atual',
    category: 'residencia',
    description:
      'Conta de água, luz, gás ou internet emitida nos últimos 60 dias em nome do comprador.',
    requiredFor: ['a_vista', 'financiamento', 'consorcio', 'permuta', 'fgts', 'misto'],
  },
  {
    type: 'Comprovante de Renda',
    title: 'Comprovante de Rendimentos (3 últimos holerites)',
    category: 'renda',
    description: 'Últimos 3 contracheques / holerites ou pró-labore se empresário.',
    requiredFor: ['financiamento', 'fgts', 'misto'],
    sampleHelp: 'Para autônomos ou empresários: 6 últimos extratos bancários de conta corrente.',
  },
  {
    type: 'Declaração IRPF',
    title: 'Declaração de Imposto de Renda Completa + Recibo',
    category: 'renda',
    description:
      'Última declaração de IRPF entregue à Receita Federal com recibo oficial de envio.',
    requiredFor: ['financiamento', 'fgts', 'misto'],
  },
  {
    type: 'Extrato FGTS',
    title: 'Extrato Analítico do FGTS',
    category: 'bancario',
    description: 'Extrato analítico emitido pelo App da Caixa Econômica com saldo disponível.',
    requiredFor: ['fgts', 'misto'],
    sampleHelp: 'Necessário para abater da entrada e compor o saldo no contrato de financiamento.',
  },
  {
    type: 'Carta de Consórcio',
    title: 'Comprovante de Contemplação do Consórcio',
    category: 'bancario',
    description: 'Cópia da carta de crédito emitida pela administradora com status contemplado.',
    requiredFor: ['consorcio'],
  },
  {
    type: 'Matrícula do Imóvel Permuta',
    title: 'Matrícula Atualizada do Imóvel Oferecido na Troca',
    category: 'imovel',
    description:
      'Certidão de matrícula vintenária com negativa de ônus reais do imóvel da permuta.',
    requiredFor: ['permuta'],
  },
]

interface DocumentVaultProps {
  client: Client
  proposal?: Proposal | null
  documents: ClientDocument[]
  onDocumentsChange: () => void
}

export function DocumentVault({
  client,
  proposal,
  documents,
  onDocumentsChange,
}: DocumentVaultProps) {
  const { toast } = useToast()
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [dragOverType, setDragOverType] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<ClientDocument | null>(null)

  const activeModality: PurchaseModality = client.purchase_modality || 'financiamento'

  // Filter checklist for the active modality
  const relevantChecklist = CHECKLIST_BY_MODALITY.filter((item) =>
    item.requiredFor.includes(activeModality),
  )

  // Calculate completion percentage
  const totalRequired = relevantChecklist.length
  const verifiedCount = relevantChecklist.filter((req) => {
    const doc = documents.find((d) => d.type === req.type)
    return doc && doc.status === 'verified'
  }).length
  const uploadedCount = relevantChecklist.filter((req) => {
    return documents.some((d) => d.type === req.type)
  }).length

  const completionPercent =
    totalRequired > 0 ? Math.round((uploadedCount / totalRequired) * 100) : 0

  const handleUploadFile = async (file: File, docType: string) => {
    if (!file || !client) return
    setUploadingType(docType)
    try {
      const formData = new FormData()
      formData.append('client_id', client.id)
      if (proposal?.id) {
        formData.append('proposal_id', proposal.id)
      }
      formData.append('type', docType)
      formData.append('title', `${docType} - ${client.name}`)
      formData.append('file', file)
      formData.append('status', 'pending')

      await createDocument(formData)
      toast({
        title: 'Documento recebido com segurança!',
        description: `O arquivo de ${docType} foi salvo no cofre criptografado.`,
      })
      onDocumentsChange()
    } catch (err: any) {
      toast({
        title: 'Falha no envio',
        description: err.message || 'Verifique o formato e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUploadingType(null)
    }
  }

  const handleDelete = async (docId: string) => {
    if (confirm('Deseja remover este documento para enviar uma nova versão?')) {
      try {
        await deleteDocument(docId)
        toast({ title: 'Documento removido' })
        onDocumentsChange()
      } catch (err: any) {
        toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
      }
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, docType: string) => {
    e.preventDefault()
    setDragOverType(null)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleUploadFile(files[0], docType)
    }
  }

  return (
    <Card className="card-elevated border-t-4 border-t-[#1A3636] overflow-hidden">
      <CardHeader className="p-6 pb-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#1A3636] text-[#D4AF37] shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-lg font-bold text-[#1A3636]">
                  Cofre Digital de Documentos
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Checklist personalizado para a modalidade{' '}
                  <strong className="text-[#1A3636] capitalize">
                    {activeModality.replace('_', ' ')}
                  </strong>
                  . Envie fotos nítidas ou PDFs direto pelo celular.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-[#1A3636] text-[#D4AF37] text-xs font-bold px-3 py-1 border-none">
              {uploadedCount} de {totalRequired} enviados ({completionPercent}%)
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-3 space-y-1.5">
          <div className="flex justify-between text-[11px] text-gray-500 font-semibold">
            <span>Progresso da Documentação:</span>
            <span className="text-[#1A3636]">
              {verifiedCount} aprovados • {uploadedCount - verifiedCount} em análise
            </span>
          </div>
          <Progress value={completionPercent} className="h-2 bg-gray-100" />
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Helper Banner */}
        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Privacidade e Sigilo Bancário:</strong> Todos os arquivos enviados ficam em
            cofre protegido e acessíveis apenas pela corretora Vera Lúcia Koren e pelos
            correspondentes de crédito autorizados para obtenção de laudo e minuta contratual.
          </p>
        </div>

        {/* Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relevantChecklist.map((reqDoc, idx) => {
            const uploaded = documents.find((d) => d.type === reqDoc.type)
            const isUploadingThis = uploadingType === reqDoc.type
            const isDragOver = dragOverType === reqDoc.type

            return (
              <div
                key={idx}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverType(reqDoc.type)
                }}
                onDragLeave={() => setDragOverType(null)}
                onDrop={(e) => handleDrop(e, reqDoc.type)}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  uploaded
                    ? uploaded.status === 'verified'
                      ? 'bg-emerald-50/20 border-emerald-300 shadow-2xs'
                      : uploaded.status === 'rejected'
                        ? 'bg-red-50/30 border-red-300 shadow-2xs'
                        : 'bg-amber-50/20 border-amber-300 shadow-2xs'
                    : isDragOver
                      ? 'bg-amber-50 border-2 border-[#D4AF37] scale-[1.01]'
                      : 'bg-gray-50/60 border-dashed border-gray-300 hover:border-[#D4AF37]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-[#1A3636] flex items-center gap-1.5 leading-snug">
                      <FileText className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      {reqDoc.type}
                    </h4>

                    {uploaded ? (
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          uploaded.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : uploaded.status === 'rejected'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {uploaded.status === 'verified' && '✓ Aprovado'}
                        {uploaded.status === 'rejected' && '✕ Recusado'}
                        {uploaded.status === 'pending' && '⏳ Em Análise'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] bg-gray-200 text-gray-700">
                        Pendente
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 leading-snug">{reqDoc.description}</p>

                  {reqDoc.sampleHelp && (
                    <p className="text-[11px] text-[#1A3636]/70 italic flex items-center gap-1">
                      <Info className="w-3 h-3 text-[#D4AF37]" /> {reqDoc.sampleHelp}
                    </p>
                  )}

                  {uploaded?.notes && (
                    <div className="p-2 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900 mt-1">
                      <strong>Observação da Vera:</strong> {uploaded.notes}
                    </div>
                  )}
                </div>

                {/* Upload or View Action Row */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  {uploaded ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-gray-500 truncate max-w-[170px]">
                        {uploaded.title}
                      </span>

                      <div className="flex items-center gap-2">
                        {uploaded.file && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewDoc(uploaded)}
                            className="h-7 text-xs text-[#1A3636] border-gray-300 gap-1 px-2"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#D4AF37]" /> Ver
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(uploaded.id)}
                          className="h-7 text-xs text-gray-400 hover:text-red-600 p-1"
                          title="Remover documento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <label className="cursor-pointer flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-[#1A3636] text-[#1A3636] px-3 py-2.5 rounded-lg text-xs font-semibold shadow-2xs hover:shadow-xs transition-all">
                        <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
                        <span>
                          {isUploadingThis
                            ? 'Enviando arquivo...'
                            : isDragOver
                              ? 'Solte o arquivo aqui'
                              : 'Tirar Foto ou Anexar PDF'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={isUploadingThis}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUploadFile(file, reqDoc.type)
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1A3636] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#D4AF37]" /> {previewDoc?.type || 'Documento'}
            </DialogTitle>
          </DialogHeader>

          {previewDoc && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                <div>
                  <strong>Arquivo:</strong> {previewDoc.title}
                </div>
                <div>
                  <strong>Status:</strong> <span className="capitalize">{previewDoc.status}</span>
                </div>
              </div>

              {previewDoc.file ? (
                <div className="border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[220px]">
                  {previewDoc.file.toLowerCase().endsWith('.pdf') ? (
                    <div className="p-6 text-center space-y-3">
                      <FileText className="w-12 h-12 text-[#1A3636] mx-auto" />
                      <p className="text-xs text-gray-600">Arquivo em formato PDF</p>
                      <a
                        href={getDocumentDownloadUrl(previewDoc)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#1A3636] text-white px-4 py-2 rounded-lg text-xs font-semibold"
                      >
                        <Download className="w-4 h-4 text-[#D4AF37]" /> Baixar / Abrir PDF
                      </a>
                    </div>
                  ) : (
                    <img
                      src={getDocumentDownloadUrl(previewDoc)}
                      alt={previewDoc.title}
                      className="max-h-[350px] w-auto object-contain mx-auto"
                    />
                  )}
                </div>
              ) : null}

              <div className="flex justify-between items-center pt-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewDoc(null)}>
                  Fechar
                </Button>
                {previewDoc.file && (
                  <a
                    href={getDocumentDownloadUrl(previewDoc)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A3636] hover:underline"
                  >
                    <Download className="w-4 h-4 text-[#D4AF37]" /> Abrir no Navegador
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
