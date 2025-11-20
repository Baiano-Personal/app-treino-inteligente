"use client"

import { useState, useEffect } from 'react'
import { User, Dumbbell, Camera, TrendingUp, Video, Users, BookOpen, BarChart3, Menu, MessageCircle, LogOut, CreditCard, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getCurrentUser, logout } from '@/lib/auth'
import { checkSubscriptionStatus, getUserSubscription, Subscription } from '@/lib/subscription'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'home' | 'workouts' | 'progress' | 'profile'>('home')
  const [activeStudents] = useState(12)
  const [inactiveStudents] = useState(3)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)

      // Verifica se é admin
      const role = currentUser.user_metadata?.role
      setIsAdmin(role === 'admin')

      // Admin tem acesso total, não precisa verificar assinatura
      if (role === 'admin') {
        setHasActiveSubscription(true)
        setLoading(false)
        return
      }

      // Verifica status da assinatura para usuários normais
      const isActive = await checkSubscriptionStatus(currentUser.id)
      setHasActiveSubscription(isActive)

      // Busca detalhes da assinatura
      const subData = await getUserSubscription(currentUser.id)
      setSubscription(subData)

    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  function getDaysUntilExpiry(): number {
    if (!subscription) return 0
    const expiry = new Date(subscription.expiry_date)
    const now = new Date()
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    )
  }

  // Tela de bloqueio para usuários sem assinatura ativa
  if (!hasActiveSubscription && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-blue-900/30 border-blue-800/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto bg-red-500/20 p-4 rounded-full w-fit mb-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <CardTitle className="text-2xl text-white">Assinatura Inativa</CardTitle>
            <CardDescription className="text-blue-200">
              Sua assinatura expirou ou está pendente de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription && (
              <div className="bg-blue-800/30 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300">Status:</span>
                  <Badge className="bg-red-500 text-white">
                    {subscription.status === 'expired' ? 'Expirado' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300">Plano:</span>
                  <span className="text-white">
                    {subscription.plan_type === 'monthly' ? 'Mensal' : 'Anual'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300">Expirou em:</span>
                  <span className="text-white">
                    {new Date(subscription.expiry_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            )}

            <Alert className="bg-yellow-500/20 border-yellow-500/50">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertTitle className="text-yellow-400">Atenção</AlertTitle>
              <AlertDescription className="text-yellow-200">
                Entre em contato com o suporte para renovar sua assinatura e continuar usando o aplicativo.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Falar com Suporte
              </Button>
              <Button 
                variant="outline" 
                className="w-full bg-blue-800/50 border-blue-600 text-white hover:bg-blue-700/50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysUntilExpiry = getDaysUntilExpiry()
  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <header className="bg-blue-900/50 backdrop-blur-sm border-b border-blue-800/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-full">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EvoFit AI</h1>
                <p className="text-xs text-blue-200">Seu treino inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white"
                  onClick={() => router.push('/admin')}
                >
                  Admin
                </Button>
              )}
              <span className="text-sm text-blue-200 hidden sm:inline">
                {user?.email}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white"
                onClick={handleLogout}
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Alerta de Assinatura Expirando */}
        {isExpiringSoon && !isAdmin && (
          <Alert className="mb-6 bg-orange-500/20 border-orange-500/50">
            <AlertCircle className="h-4 w-4 text-orange-400" />
            <AlertTitle className="text-orange-400">Assinatura Expirando</AlertTitle>
            <AlertDescription className="text-orange-200">
              Sua assinatura expira em {daysUntilExpiry} {daysUntilExpiry === 1 ? 'dia' : 'dias'}. 
              Renove agora para não perder o acesso!
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Info Card */}
        {subscription && !isAdmin && (
          <Card className="mb-6 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      Plano {subscription.plan_type === 'monthly' ? 'Mensal' : 'Anual'}
                    </p>
                    <p className="text-sm text-blue-200">
                      Expira em {new Date(subscription.expiry_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">Ativo</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-blue-900/30 border-blue-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Alunos Ativos</p>
                  <p className="text-2xl font-bold text-white">{activeStudents}</p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-full">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-900/30 border-blue-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Inativos</p>
                  <p className="text-2xl font-bold text-white">{inactiveStudents}</p>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-full">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4 bg-blue-900/30 border-blue-800/50 hover:bg-blue-800/50 text-white"
            >
              <Video className="w-8 h-8" />
              <span className="text-xs">Análise IA</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4 bg-blue-900/30 border-blue-800/50 hover:bg-blue-800/50 text-white"
            >
              <Camera className="w-8 h-8" />
              <span className="text-xs">Foto Progresso</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4 bg-blue-900/30 border-blue-800/50 hover:bg-blue-800/50 text-white"
            >
              <Dumbbell className="w-8 h-8" />
              <span className="text-xs">Novo Treino</span>
            </Button>
          </div>
        </div>

        {/* Workouts Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Treinos</h2>
          <div className="space-y-3">
            <Card className="bg-blue-900/30 border-blue-800/50 backdrop-blur-sm hover:bg-blue-900/40 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">Biblioteca de Treinos</CardTitle>
                      <CardDescription className="text-blue-200 text-sm">
                        Acesse todos os treinos disponíveis
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-blue-600 text-white">24</Badge>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-blue-900/30 border-blue-800/50 backdrop-blur-sm hover:bg-blue-900/40 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">Relatório de Frequência</CardTitle>
                      <CardDescription className="text-blue-200 text-sm">
                        Acompanhe a evolução dos alunos
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-blue-900/30 border-blue-800/50 backdrop-blur-sm hover:bg-blue-900/40 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">Biblioteca de Exercícios</CardTitle>
                      <CardDescription className="text-blue-200 text-sm">
                        Mais de 200 exercícios com vídeos
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white">200+</Badge>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* AI Analysis Preview */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Análise Inteligente</h2>
          <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="w-5 h-5" />
                Análise de Movimento por IA
              </CardTitle>
              <CardDescription className="text-blue-200">
                Envie vídeos para análise automática de postura, mobilidade e proporções corporais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Video className="w-4 h-4 mr-2" />
                Iniciar Análise
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Support Button */}
      <Button
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/50 z-40"
        size="icon"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </Button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-blue-900/90 backdrop-blur-sm border-t border-blue-800/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Button
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-auto py-2 ${
                activeTab === 'home' ? 'text-blue-400' : 'text-blue-200'
              }`}
              onClick={() => setActiveTab('home')}
            >
              <Dumbbell className="w-5 h-5" />
              <span className="text-xs">Início</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-auto py-2 ${
                activeTab === 'workouts' ? 'text-blue-400' : 'text-blue-200'
              }`}
              onClick={() => setActiveTab('workouts')}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Treinos</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-auto py-2 ${
                activeTab === 'progress' ? 'text-blue-400' : 'text-blue-200'
              }`}
              onClick={() => setActiveTab('progress')}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Progresso</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-auto py-2 ${
                activeTab === 'profile' ? 'text-blue-400' : 'text-blue-200'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Perfil</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  )
}
