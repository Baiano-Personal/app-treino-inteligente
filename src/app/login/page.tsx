"use client"

import { useState } from 'react'
import { login, signup, LoginCredentials, SignupCredentials } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, Mail, Lock, User, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [loginData, setLoginData] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  
  const [signupData, setSignupData] = useState<SignupCredentials>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(loginData)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signup(signupData)
      setError('Conta criada! Verifique seu email para confirmar.')
      setTimeout(() => {
        setIsLogin(true)
        setError('')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-blue-900/30 border-blue-800/50 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center text-white">
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </CardTitle>
          <CardDescription className="text-center text-blue-200">
            {isLogin 
              ? 'Entre com suas credenciais para acessar o app' 
              : 'Crie sua conta para começar a treinar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              error.includes('criada') 
                ? 'bg-green-500/20 text-green-200 border border-green-500/50' 
                : 'bg-red-500/20 text-red-200 border border-red-500/50'
            }`}>
              {error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-100">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="pl-10 bg-blue-900/50 border-blue-800/50 text-white placeholder:text-blue-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-100">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="pl-10 bg-blue-900/50 border-blue-800/50 text-white placeholder:text-blue-300"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-blue-100">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    className="pl-10 bg-blue-900/50 border-blue-800/50 text-white placeholder:text-blue-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-blue-100">Telefone (opcional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+55 11 99999-9999"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    className="pl-10 bg-blue-900/50 border-blue-800/50 text-white placeholder:text-blue-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-blue-100">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    className="pl-10 bg-blue-900/50 border-blue-800/50 text-white placeholder:text-blue-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-blue-100">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    className="pl-10 bg-blue-900/50 border-blue-800/50 text-white placeholder:text-blue-300"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
              className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
            >
              {isLogin 
                ? 'Não tem uma conta? Criar conta' 
                : 'Já tem uma conta? Entrar'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
