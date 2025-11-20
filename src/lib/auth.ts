import { supabase } from './supabase'

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends LoginCredentials {
  fullName: string
  phone?: string
}

// Login do usuário
export async function login(credentials: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) throw error
  
  // Enviar notificação de login
  if (data.user) {
    await sendLoginNotification(data.user.id, data.user.email!)
  }

  return data
}

// Registro de novo usuário
export async function signup(credentials: SignupCredentials) {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        full_name: credentials.fullName,
        phone: credentials.phone,
      },
    },
  })

  if (error) throw error
  return data
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Obter usuário atual
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Enviar notificação de login
async function sendLoginNotification(userId: string, email: string) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
        type: 'login',
      }),
    })

    if (!response.ok) {
      console.error('Erro ao enviar notificação:', await response.text())
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
  }
}

// Atualizar perfil do usuário
export async function updateUserProfile(updates: { full_name?: string; phone?: string }) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Usuário não autenticado')

  const { error } = await supabase.auth.updateUser({
    data: updates,
  })

  if (error) throw error
}
