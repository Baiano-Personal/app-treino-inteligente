import { supabase } from './supabase'

export interface Subscription {
  id: string
  user_id: string
  plan_type: 'monthly' | 'yearly'
  status: 'active' | 'inactive' | 'expired' | 'pending'
  payment_date: string | null
  expiry_date: string
  amount: number
  created_at: string
  updated_at: string
}

/**
 * Verifica se o usuário tem assinatura ativa
 */
export async function checkSubscriptionStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return false
    }

    // Verifica se a assinatura está ativa e não expirou
    const now = new Date()
    const expiryDate = new Date(data.expiry_date)

    return data.status === 'active' && expiryDate > now
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error)
    return false
  }
}

/**
 * Obtém a assinatura do usuário
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data as Subscription
  } catch (error) {
    console.error('Erro ao obter assinatura:', error)
    return null
  }
}

/**
 * Cria uma nova assinatura para o usuário
 */
export async function createSubscription(
  userId: string,
  planType: 'monthly' | 'yearly',
  amount: number
): Promise<Subscription | null> {
  try {
    const now = new Date()
    const expiryDate = new Date()
    
    // Define data de expiração baseada no plano
    if (planType === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: planType,
        status: 'active',
        payment_date: now.toISOString(),
        expiry_date: expiryDate.toISOString(),
        amount: amount
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar assinatura:', error)
      return null
    }

    return data as Subscription
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    return null
  }
}

/**
 * Atualiza o status da assinatura
 */
export async function updateSubscriptionStatus(
  userId: string,
  status: 'active' | 'inactive' | 'expired' | 'pending'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao atualizar status:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return false
  }
}

/**
 * Renova a assinatura do usuário
 */
export async function renewSubscription(
  userId: string,
  planType: 'monthly' | 'yearly',
  amount: number
): Promise<boolean> {
  try {
    const now = new Date()
    const expiryDate = new Date()
    
    if (planType === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        payment_date: now.toISOString(),
        expiry_date: expiryDate.toISOString(),
        amount: amount,
        updated_at: now.toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao renovar assinatura:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao renovar assinatura:', error)
    return false
  }
}

/**
 * Lista todas as assinaturas (apenas para admin)
 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data as Subscription[]
  } catch (error) {
    console.error('Erro ao listar assinaturas:', error)
    return []
  }
}

/**
 * Verifica assinaturas expiradas e atualiza status
 */
export async function checkExpiredSubscriptions(): Promise<void> {
  try {
    const now = new Date().toISOString()
    
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .lt('expiry_date', now)
      .eq('status', 'active')

    if (error) {
      console.error('Erro ao verificar assinaturas expiradas:', error)
    }
  } catch (error) {
    console.error('Erro ao verificar assinaturas expiradas:', error)
  }
}
