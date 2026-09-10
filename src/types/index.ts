export type UserRole = 'admin' | 'client'

export interface User {
  id: string
  email: string
  name: string
  role?: UserRole
  avatar?: string
  created: string
  updated: string
}

export type PropertyType =
  | 'apartamento'
  | 'casa'
  | 'cobertura'
  | 'terreno'
  | 'sala_comercial'
  | 'outro'
export type PropertyModality = 'sale' | 'rent' | 'financing' | 'permuta'
export type PropertyStatus = 'available' | 'reserved' | 'sold'

export interface Property {
  id: string
  title: string
  description?: string
  address?: string
  neighborhood?: string
  city?: string
  price: number
  bedrooms?: number
  bathrooms?: number
  suites?: number
  parking_spots?: number
  area_sqm?: number
  property_type?: PropertyType
  cover_image?: string
  modality: PropertyModality
  status: PropertyStatus
  features?: string[]
  images?: string[]
  featured?: boolean
  created: string
  updated: string
}

export type ClientStatus = 'lead' | 'contact' | 'visit' | 'proposal' | 'closing' | 'lost'

export type PurchaseModality =
  | 'a_vista'
  | 'financiamento'
  | 'consorcio'
  | 'permuta'
  | 'fgts'
  | 'misto'

export interface FinancialBreakdown {
  cash_percent?: number
  cash_amount?: number
  finance_percent?: number
  finance_bank?: string
  consorcio_percent?: number
  consorcio_letter?: string
  fgts_percent?: number
  fgts_amount?: number
  permuta_percent?: number
  permuta_item_desc?: string
  notes?: string
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  status: ClientStatus
  purchase_modality?: PurchaseModality
  financial_breakdown?: FinancialBreakdown
  objectives?: string
  objections_notes?: string
  interested_property_ids?: string[]
  google_event_id?: string
  visit_scheduled_at?: string
  visit_property_id?: string
  visit_notes?: string
  portal_token?: string
  broker_message?: string
  notes?: string
  created: string
  updated: string
  // relations expanded
  expand?: {
    visit_property_id?: Property
  }
}

export type NegotiationStage =
  | 'visita_realizada'
  | 'proposta_enviada'
  | 'proposta_em_analise'
  | 'proposta_aprovada'
  | 'documentacao'
  | 'analise_credito'
  | 'contrato_assinado'
  | 'concluido'

export type ProposalStatus =
  | 'drafted'
  | 'sent'
  | 'docs_pending'
  | 'under_review'
  | 'accepted'
  | 'rejected'

export interface ProposalSimulationData {
  amortizationType?: 'SAC' | 'PRICE'
  termYears?: number
  interestRateAnnual?: number
  monthlyInstallment?: number
  firstInstallment?: number
  lastInstallment?: number
  totalPaid?: number
  totalInterest?: number
  bankName?: string
  fgtsAmount?: number
  consorcioAmount?: number
}

export interface Proposal {
  id: string
  client_id: string
  property_id: string
  value: number
  down_payment?: number
  financing_value?: number
  bank_partner?: string
  payment_terms?: string
  conditions?: string
  status: ProposalStatus
  negotiation_stage?: NegotiationStage
  notes_client?: string
  counter_proposal_notes?: string
  simulation_data?: ProposalSimulationData
  created: string
  updated: string
  expand?: {
    client_id?: Client
    property_id?: Property
  }
}

export type DocumentStatus = 'pending' | 'verified' | 'rejected'

export interface ClientDocument {
  id: string
  client_id?: string
  proposal_id?: string
  type: string
  title: string
  file: string
  status: DocumentStatus
  notes?: string
  created: string
  updated: string
}

export interface Objection {
  id: string
  title: string
  category: 'price' | 'location' | 'financing' | 'timing' | 'renovation' | 'market' | 'other'
  description?: string
  ai_response?: string
  key_tactics?: string[]
  created: string
  updated: string
}

export interface CalendarEvent {
  id: string
  client_id: string
  client_name: string
  client_phone?: string
  property_title: string
  scheduled_at: string
  notes?: string
  status: string
  synced_with_google: boolean
}
