import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Percent,
  Phone,
  Mail,
  Send,
  Lock,
  Download,
  Bot,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getClientByPortalToken } from '@/services/clients'
import { getProposalsByClientId } from '@/services/proposals'
import {
  getDocumentsByClientId,
  createDocument,
  getDocumentDownloadUrl,
} from '@/services/documents'
import type { Client, Proposal, ClientDocument } from '@/types'

const REQUIRED_DOC_TYPES = [
  { type: 'RG / CNH', desc: 'Documento de identificação oficial com foto do comprador' },
  { type: 'CPF', desc: 'Caso não conste no RG / CNH' },
  { type: 'Comprovante de Renda', desc: 'Últimos 3 holerites ou 6 extratos bancários + IRPF' },
  { type: 'Comprovante de Residência', desc: 'Conta de água/luz emitida nos últimos 60 dias' },
  { type: 'Certidão de Estado Civil', desc: 'Certidão de nascimento ou casamento atualizada' },
  {
    type: 'Extrato FGTS / Carta Consórcio',
    desc: 'Caso utilize FGTS ou consórcio para composição',
  },
]

export default function ClientPortal() {
  const { toast } = useToast()
  const { clientPortal, loginClientWithToken } = useAuth()
  const [searchParams] = useSearchParams()

  const [client, setClient] = useState<Client | null>(clientPortal)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [tokenInput, setTokenInput] = useState('')
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null)

  // Direct login from URL query param
  useEffect(() => {
    const tokenFromUrl = searchParams.get('portal_token')
    if (tokenFromUrl) {
      handleAuthenticate(tokenFromUrl)
    } else if (clientPortal) {
      loadClientData(clientPortal.id)
    } else {
      setLoading(false)
    }
  }, [searchParams, clientPortal])

  const handleAuthenticate = async (token: string) => {
    try {
      setLoading(true)
      const res = await loginClientWithToken(token)
      if (res.client) {
        setClient(res.client)
        await loadClientData(res.client.id)
      } else {
        toast({
          title: 'Link não encontrado',
          description: 'Verifique o código de acesso recebido por e-mail ou WhatsApp.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadClientData = async (clientId: string) => {
    try {
      const [propsls, docs] = await Promise.all([
        getProposalsByClientId(clientId),
        getDocumentsByClientId(clientId),
      ])
      setProposals(propsls)
      setDocuments(docs)
    } catch (err) {
      console.error(err)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file || !client) return

    setUploadingDocType(docType)
    try {
      const formData = new FormData()
      formData.append('client_id', client.id)
      if (proposals[0]) {
        formData.append('proposal_id', proposals[0].id)
      }
      formData.append('type', docType)
      formData.append('title', `${docType} - ${client.name}`)
      formData.append('file', file)
      formData.append('status', 'pending')

      await createDocument(formData)
      toast({
        title: 'Documento enviado com sucesso!',
        description: 'Vera Lúcia foi notificada e fará a conferência ágil da análise.',
      })
      await loadClientData(client.id)
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar arquivo',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setUploadingDocType(null)
    }
  }

  // Not authenticated view
  if (!client && !loading) {
    return (
      <div className="max-w-md mx-auto my-12 space-y-6 animate-fade-in">
        <Card className="card-elevated border-t-4 border-t-[#1A3636]">
          <CardHeader className="text-center p-6 pb-2">
            <div className="w-12 h-12 rounded-full bg-[#1A3636] text-[#D4AF37] flex items-center justify-center mx-auto mb-2 shadow">
              <Lock className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold text-[#1A3636]">
              Área Segura do Cliente
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Acesse sua proposta personalizada e faça o envio de documentos com segurança.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-xs font-semibold">
                Código de Acesso / Token Seguro
              </Label>
              <Input
                id="token"
                placeholder="Ex: token_rodrigo_mendes_77a"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-gray-400">
                Você recebeu este link seguro no seu e-mail ou WhatsApp da Vera Lúcia.
              </p>
            </div>

            <Button
              onClick={() => handleAuthenticate(tokenInput)}
              disabled={!tokenInput.trim() || loading}
              className="w-full bg-[#1A3636] text-white hover:bg-[#254d4d] text-xs font-bold"
            >
              Acessar Minha Proposta
            </Button>

            {/* Quick Demo Login links */}
            <div className="pt-4 border-t border-gray-100 text-center space-y-2">
              <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">
                Acessar Demonstração Rápida
              </p>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAuthenticate('token_rodrigo_mendes_77a')}
                  className="text-xs text-gray-700"
                >
                  Entrar como Rodrigo Mendes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAuthenticate('token_camila_torres_88b')}
                  className="text-xs text-gray-700"
                >
                  Entrar como Dra. Camila Torres
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeProposal = proposals[0]
  const property = activeProposal?.expand?.property_id
  const fb = client?.financial_breakdown

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1A3636] via-[#244848] to-[#1A3636] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-[#D4AF37]/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#D4AF37] rounded-sm" />
            <h1 className="text-xl font-bold tracking-wide">Portal do Cliente • {client?.name}</h1>
          </div>
          <p className="text-xs text-white/80 mt-1">
            Acompanhe o andamento da sua proposta comercial e envie seus documentos para agilizar a
            análise.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-xs py-1 px-3">
            Atendimento Exclusivo Vera Lúcia
          </Badge>
        </div>
      </div>

      {/* Grid: Proposal Summary & Financial Modality */}
      {activeProposal && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Proposal Summary Card */}
          <Card className="card-elevated md:col-span-2 border-t-4 border-t-[#D4AF37]">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#1A3636] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#D4AF37]" /> Proposta Comercial
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-0.5">
                    {property?.title || 'Imóvel em negociação'} • {property?.neighborhood || ''}
                  </CardDescription>
                </div>

                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {activeProposal.status === 'docs_pending' && 'Aguardando Seus Documentos'}
                  {activeProposal.status === 'under_review' && 'Documentos em Análise'}
                  {activeProposal.status === 'accepted' && 'Proposta Aceita!'}
                  {activeProposal.status === 'sent' && 'Proposta Enviada'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-4">
              {/* Values breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Valor Proposto</span>
                  <span className="font-bold text-base text-[#1A3636]">
                    R$ {activeProposal.value?.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Entrada / Sinal</span>
                  <span className="font-bold text-sm text-[#1A3636]">
                    R$ {activeProposal.down_payment?.toLocaleString('pt-BR') || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Saldo Financiado</span>
                  <span className="font-bold text-sm text-emerald-700">
                    R$ {activeProposal.financing_value?.toLocaleString('pt-BR') || '--'}
                  </span>
                </div>
              </div>

              {activeProposal.payment_terms && (
                <div className="text-xs">
                  <span className="font-semibold text-gray-700 block mb-0.5">
                    Condições Estruturadas:
                  </span>
                  <p className="text-gray-600 leading-relaxed bg-white p-3 rounded-lg border border-gray-200">
                    {activeProposal.payment_terms}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modality & Vera Contact */}
          <Card className="card-elevated space-y-4 p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-[#1A3636] flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-[#D4AF37]" /> Sua Composição
              </h3>

              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 text-xs space-y-2">
                <div className="flex justify-between font-medium text-gray-700">
                  <span>Modalidade:</span>
                  <strong className="text-[#1A3636]">
                    {client?.purchase_modality === 'a_vista' && 'À Vista'}
                    {client?.purchase_modality === 'financiamento' && 'Financiamento'}
                    {client?.purchase_modality === 'misto' && 'Composição Mista'}
                    {client?.purchase_modality === 'permuta' && 'Permuta'}
                  </strong>
                </div>

                {fb && (
                  <div className="space-y-1 pt-1 border-t border-amber-200/40 text-[11px] text-gray-600">
                    {fb.cash_percent ? <div>• {fb.cash_percent}% Recursos Próprios</div> : null}
                    {fb.finance_percent ? (
                      <div>
                        • {fb.finance_percent}% Banco {fb.finance_bank || ''}
                      </div>
                    ) : null}
                    {fb.fgts_percent ? <div>• {fb.fgts_percent}% FGTS</div> : null}
                    {fb.permuta_percent ? <div>• {fb.permuta_percent}% Permuta</div> : null}
                  </div>
                )}
              </div>
            </div>

            {/* Direct Broker Contact */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#1A3636]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Corretora Responsável
              </div>
              <p className="text-[11px] text-gray-600">Vera Lúcia Koren • CRECI Especialista</p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-600">
                <Phone className="w-3.5 h-3.5 text-[#D4AF37]" /> (11) 98765-4321
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Document Vault (Drag & Drop / Upload Cards) */}
      <Card className="card-elevated">
        <CardHeader className="p-6 pb-3 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-[#1A3636] flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#D4AF37]" /> Cofre de Documentos do Cliente
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Tire foto ou envie o arquivo PDF dos documentos solicitados para validação jurídica
                e bancária.
              </CardDescription>
            </div>

            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs"
            >
              {documents.length} documento(s) enviado(s)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REQUIRED_DOC_TYPES.map((reqDoc, idx) => {
              const uploaded = documents.find((d) => d.type === reqDoc.type)
              const isUploadingThis = uploadingDocType === reqDoc.type

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    uploaded
                      ? 'bg-white border-emerald-300 shadow-2xs'
                      : 'bg-gray-50/70 border-dashed border-gray-300 hover:border-[#D4AF37]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-[#1A3636] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#D4AF37]" />
                        {reqDoc.type}
                      </h4>

                      {uploaded ? (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            uploaded.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}
                        >
                          {uploaded.status === 'verified' ? '✓ Aprovado' : '⏳ Em Análise'}
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-gray-200 text-gray-600"
                        >
                          Pendente
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">{reqDoc.desc}</p>
                  </div>

                  {/* Upload input or download link */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    {uploaded ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-gray-500 truncate max-w-[180px]">
                          {uploaded.title}
                        </span>
                        {uploaded.file && (
                          <a
                            href={getDocumentDownloadUrl(uploaded)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#1A3636] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Download className="w-3.5 h-3.5 text-[#D4AF37]" /> Baixar
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="w-full">
                        <label className="cursor-pointer flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-[#1A3636] text-[#1A3636] px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-colors">
                          <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
                          <span>{isUploadingThis ? 'Enviando...' : 'Selecionar Foto / PDF'}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={isUploadingThis}
                            onChange={(e) => handleFileUpload(e, reqDoc.type)}
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
      </Card>
    </div>
  )
}
