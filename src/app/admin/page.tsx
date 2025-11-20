"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getAllSubscriptions, updateSubscriptionStatus, renewSubscription, Subscription } from '@/lib/subscription'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, DollarSign, Calendar, ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UserWithSubscription extends Subscription {
  user_email?: string
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<UserWithSubscription[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null)
  const [renewalPlan, setRenewalPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [renewalAmount, setRenewalAmount] = useState('99.90')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      const user = await getCurrentUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Verifica se o usuário é admin
      const { data: userData } = await supabase
        .from('auth.users')
        .select('raw_user_meta_data')
        .eq('id', user.id)
        .single()

      const role = userData?.raw_user_meta_data?.role || user.user_metadata?.role

      if (role !== 'admin') {
        router.push('/')
        return
      }

      setIsAdmin(true)
      await loadSubscriptions()
    } catch (error) {
      console.error('Erro ao verificar acesso admin:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  async function loadSubscriptions() {
    try {
      const subs = await getAllSubscriptions()
      
      // Buscar emails dos usuários
      const subsWithEmails = await Promise.all(
        subs.map(async (sub) => {
          const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id)
          return {
            ...sub,
            user_email: userData?.user?.email || 'Email não encontrado'
          }
        })
      )

      setSubscriptions(subsWithEmails)
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error)
    }
  }

  async function handleStatusChange(userId: string, newStatus: 'active' | 'inactive' | 'expired' | 'pending') {
    try {
      const success = await updateSubscriptionStatus(userId, newStatus)
      if (success) {
        await loadSubscriptions()
        alert('Status atualizado com sucesso!')
      } else {
        alert('Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  async function handleRenewal() {
    if (!selectedUser) return

    try {
      const amount = parseFloat(renewalAmount)
      const success = await renewSubscription(selectedUser.user_id, renewalPlan, amount)
      
      if (success) {
        await loadSubscriptions()
        setSelectedUser(null)
        alert('Assinatura renovada com sucesso!')
      } else {
        alert('Erro ao renovar assinatura')
      }
    } catch (error) {
      console.error('Erro ao renovar assinatura:', error)
      alert('Erro ao renovar assinatura')
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { color: string; text: string }> = {
      active: { color: 'bg-green-500', text: 'Ativo' },
      inactive: { color: 'bg-gray-500', text: 'Inativo' },
      expired: { color: 'bg-red-500', text: 'Expirado' },
      pending: { color: 'bg-yellow-500', text: 'Pendente' }
    }

    const variant = variants[status] || variants.inactive

    return (
      <Badge className={`${variant.color} text-white`}>
        {variant.text}
      </Badge>
    )
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  function isExpiringSoon(expiryDate: string) {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Carregando painel administrativo...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const activeCount = subscriptions.filter(s => s.status === 'active').length
  const expiredCount = subscriptions.filter(s => s.status === 'expired').length
  const totalRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <header className="bg-blue-900/50 backdrop-blur-sm border-b border-blue-800/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-400" />
                <div>
                  <h1 className="text-xl font-bold text-white">Painel Administrativo</h1>
                  <p className="text-xs text-blue-200">Gerenciamento de Assinaturas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-blue-900/30 border-blue-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Assinaturas Ativas</p>
                  <p className="text-3xl font-bold text-white">{activeCount}</p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-900/30 border-blue-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Expiradas</p>
                  <p className="text-3xl font-bold text-white">{expiredCount}</p>
                </div>
                <div className="bg-red-500/20 p-3 rounded-full">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-900/30 border-blue-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Receita Mensal</p>
                  <p className="text-3xl font-bold text-white">
                    R$ {totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-full">
                  <DollarSign className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions List */}
        <Card className="bg-blue-900/30 border-blue-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciar Assinaturas
            </CardTitle>
            <CardDescription className="text-blue-200">
              Controle total sobre as assinaturas dos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.length === 0 ? (
                <p className="text-blue-200 text-center py-8">
                  Nenhuma assinatura encontrada
                </p>
              ) : (
                subscriptions.map((sub) => (
                  <Card key={sub.id} className="bg-blue-800/30 border-blue-700/50">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-white font-semibold">{sub.user_email}</p>
                            {getStatusBadge(sub.status)}
                            {isExpiringSoon(sub.expiry_date) && (
                              <Badge className="bg-orange-500 text-white">
                                Expira em breve
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-blue-300">Plano:</p>
                              <p className="text-white">
                                {sub.plan_type === 'monthly' ? 'Mensal' : 'Anual'}
                              </p>
                            </div>
                            <div>
                              <p className="text-blue-300">Valor:</p>
                              <p className="text-white">R$ {sub.amount?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-blue-300">Pagamento:</p>
                              <p className="text-white">
                                {sub.payment_date ? formatDate(sub.payment_date) : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-blue-300">Expira em:</p>
                              <p className="text-white">{formatDate(sub.expiry_date)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Select
                            value={sub.status}
                            onValueChange={(value) =>
                              handleStatusChange(sub.user_id, value as any)
                            }
                          >
                            <SelectTrigger className="w-full md:w-[140px] bg-blue-700/50 border-blue-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                              <SelectItem value="expired">Expirado</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                            </SelectContent>
                          </Select>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full md:w-[140px] bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                                onClick={() => setSelectedUser(sub)}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Renovar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-blue-900 border-blue-700 text-white">
                              <DialogHeader>
                                <DialogTitle>Renovar Assinatura</DialogTitle>
                                <DialogDescription className="text-blue-200">
                                  {sub.user_email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="plan">Plano</Label>
                                  <Select
                                    value={renewalPlan}
                                    onValueChange={(value) =>
                                      setRenewalPlan(value as 'monthly' | 'yearly')
                                    }
                                  >
                                    <SelectTrigger className="bg-blue-800 border-blue-600">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="monthly">Mensal</SelectItem>
                                      <SelectItem value="yearly">Anual</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="amount">Valor (R$)</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={renewalAmount}
                                    onChange={(e) => setRenewalAmount(e.target.value)}
                                    className="bg-blue-800 border-blue-600 text-white"
                                  />
                                </div>
                                <Button
                                  onClick={handleRenewal}
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                  Confirmar Renovação
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
