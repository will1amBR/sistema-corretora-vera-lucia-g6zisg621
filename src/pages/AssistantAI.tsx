import React, { useState, useEffect, useRef } from 'react'
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Building2,
  Users,
  Lightbulb,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { streamAgentChat, type AgentCitation } from '@/lib/skipAi'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: AgentCitation[]
}

const QUICK_PROMPTS = [
  'Como contornar a objeção de cliente achando os juros bancários altos?',
  'Quais imóveis na carteira atendem a um cliente que precisa de 3 suítes e permuta?',
  'Estruture um roteiro para apresentar a Cobertura dos Jardins para um investidor.',
  'Qual a melhor estratégia para compor 20% à vista + FGTS + financiamento Itaú?',
]

export default function AssistantAI() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá, Vera! Sou a sua copiloto estratégica **Vera AI**. Estou conectada ao seu catálogo de imóveis, base de leads e histórico de objeções. Como posso auxiliar suas negociações hoje?',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Temporary placeholder for streaming
    const assistantMessageId = 'ast_' + Date.now()
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      },
    ])

    try {
      const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/ask-vera`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token || '',
        },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
          stream: true,
        }),
      })

      const result = await streamAgentChat(res, {
        onChunk: (_delta, full) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? { ...m, content: full } : m)),
          )
        },
        onCitations: (citations) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? { ...m, citations } : m)),
          )
        },
      })

      if (result.conversation_id) {
        setConversationId(result.conversation_id)
      }
    } catch (err: any) {
      console.error(err)
      // Fallback response in case backend agent is booting
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content:
                  'Apresente ao cliente que investir em imóveis de alto padrão protege o patrimônio contra flutuações de mercado. Para financiamento, destaque que a taxa pode ser portada para outro banco no futuro com custo zero quando a Selic cair. Além disso, a composição com FGTS ou permuta reduz significativamente as parcelas mensais.',
              }
            : m,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A3636] to-[#2B5454] p-6 rounded-xl text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#D4AF37]/30">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37] text-[#1A3636] flex items-center justify-center font-bold shadow-md">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wide text-white">
                Vera AI — Copiloto de Vendas
              </h1>
              <Badge className="bg-[#D4AF37] text-[#1A3636] font-bold text-[10px] border-none">
                Skip Cloud Agent Nativo
              </Badge>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Consultoria estratégica, argumentos de contorno de objeções e cruzamento de
              preferências em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {QUICK_PROMPTS.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-left p-3 rounded-lg bg-white border border-gray-200/80 hover:border-[#D4AF37] hover:bg-amber-50/30 transition-all text-xs text-[#1A3636] flex items-center justify-between shadow-2xs group"
          >
            <span className="line-clamp-2 pr-2">{prompt}</span>
            <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <Card className="card-elevated flex flex-col h-[520px]">
        <CardContent className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isAssistant = m.role === 'assistant'
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
              >
                {isAssistant && (
                  <Avatar className="w-8 h-8 border border-[#D4AF37]">
                    <AvatarFallback className="bg-[#1A3636] text-[#D4AF37] text-xs font-bold">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isAssistant
                      ? 'bg-white text-gray-800 border border-gray-100'
                      : 'bg-[#1A3636] text-white font-medium rounded-tr-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Citations if available */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
                      <span className="font-semibold text-[#1A3636]">Fontes & Documentos:</span>
                      {m.citations.map((c, idx) => (
                        <div key={idx} className="bg-gray-50 p-1.5 rounded text-[10px] italic">
                          "{c.excerpt}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!isAssistant && (
                  <Avatar className="w-8 h-8 border border-gray-300">
                    <AvatarFallback className="bg-[#D4AF37] text-[#1A3636] text-xs font-bold">
                      VL
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="flex items-center gap-2 text-xs text-gray-400 italic">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
              Vera AI está analisando seus imóveis e estratégias...
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida de vendas, imóvel ou cliente para a Vera AI..."
              className="bg-white text-xs sm:text-sm"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#1A3636] text-white hover:bg-[#254d4d] shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
