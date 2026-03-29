import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Redirect if already logged in
  if (user) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-wow-coral to-wow-violet shadow-lg glow-violet">
            <span className="text-2xl font-bold text-white">L</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('auth.welcomeBack')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('auth.signInSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-wow-coral via-wow-pink to-wow-violet px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50 glow-pink"
          >
            {loading ? t('common.loading') : t('auth.signIn')}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              className="text-primary hover:underline"
            >
              {t('auth.forgotPassword')}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
