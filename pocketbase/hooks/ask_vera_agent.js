/// <reference path="../pb_data/types.d.ts" />

routerAdd('POST', '/backend/v1/ask-vera', (e) => {
  try {
    let userId = e.auth?.id
    const body = e.requestInfo().body || {}
    const message = body.message

    if (!message || !message.trim()) {
      return e.badRequestError('Mensagem é obrigatória')
    }

    // If anonymous or client, find service user
    if (!userId) {
      try {
        const service = $app.findAuthRecordByEmail(
          '_pb_users_auth_',
          'vera.assistente@sistema.local',
        )
        userId = service.id
      } catch (_) {
        const admin = $app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
        userId = admin.id
      }
    }

    const conv = $ai.agent('vera-copilot').getOrCreateConversation({
      user_id: userId,
      id: body.conversation_id || null,
      title: body.title || 'Consulta Vera AI',
    })

    if (body.stream) {
      const iter = $ai.agent('vera-copilot').chat({
        user_id: userId,
        conversation_id: conv.id,
        message: message,
        stream: true,
      })
      e.response.header().set('Content-Type', 'text/event-stream')
      e.response.header().set('Cache-Control', 'no-cache')
      e.response.header().set('X-Conversation-Id', conv.id)
      return $response.stream(e, iter)
    }

    const result = $ai.agent('vera-copilot').chat({
      user_id: userId,
      conversation_id: conv.id,
      message: message,
    })

    return e.json(200, {
      conversation_id: result.conversation_id,
      message_id: result.message_id,
      content: result.content,
      citations: result.citations,
    })
  } catch (err) {
    if (err instanceof SkipAiConfigError) {
      return e.json(503, { error: 'Serviço de IA temporariamente indisponível' })
    }
    if (err instanceof SkipAiAgentsError) {
      const status = err.status || 500
      return e.json(status, { error: status >= 500 ? 'Erro no assistente de IA' : err.message })
    }
    return e.json(500, { error: err.message || 'Erro ao processar mensagem' })
  }
})
