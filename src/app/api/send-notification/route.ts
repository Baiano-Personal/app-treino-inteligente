import { NextRequest, NextResponse } from 'next/server'

// Configuração do Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER

export async function POST(request: NextRequest) {
  try {
    const { userId, email, type, phone } = await request.json()

    // Validar credenciais do Twilio
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return NextResponse.json(
        { error: 'Credenciais do Twilio não configuradas' },
        { status: 500 }
      )
    }

    // Buscar número de telefone do usuário se não foi fornecido
    let userPhone = phone
    if (!userPhone) {
      // Aqui você pode buscar o telefone do banco de dados
      // Por enquanto, vamos usar um número de exemplo
      userPhone = process.env.DEFAULT_NOTIFICATION_PHONE
    }

    if (!userPhone) {
      return NextResponse.json(
        { error: 'Número de telefone não encontrado' },
        { status: 400 }
      )
    }

    // Preparar mensagem
    const message = type === 'login' 
      ? `🔐 Novo login detectado na sua conta EvoFit AI (${email}). Se não foi você, altere sua senha imediatamente.`
      : `✅ Bem-vindo ao EvoFit AI! Sua conta foi criada com sucesso.`

    // Enviar SMS via Twilio
    if (TWILIO_PHONE_NUMBER) {
      await sendSMS(userPhone, message)
    }

    // Enviar WhatsApp via Twilio (se configurado)
    if (TWILIO_WHATSAPP_NUMBER) {
      await sendWhatsApp(userPhone, message)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notificação enviada com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar notificação' },
      { status: 500 }
    )
  }
}

// Função para enviar SMS via Twilio
async function sendSMS(to: string, message: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  
  const params = new URLSearchParams({
    To: to,
    From: TWILIO_PHONE_NUMBER!,
    Body: message,
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao enviar SMS: ${error}`)
  }

  return await response.json()
}

// Função para enviar WhatsApp via Twilio
async function sendWhatsApp(to: string, message: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  
  // Formatar número para WhatsApp (adicionar prefixo whatsapp:)
  const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  const whatsappFrom = TWILIO_WHATSAPP_NUMBER!.startsWith('whatsapp:') 
    ? TWILIO_WHATSAPP_NUMBER 
    : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`
  
  const params = new URLSearchParams({
    To: whatsappTo,
    From: whatsappFrom,
    Body: message,
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao enviar WhatsApp: ${error}`)
  }

  return await response.json()
}
