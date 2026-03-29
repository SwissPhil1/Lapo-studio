import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

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
    <div className="flex min-h-screen items-center justify-center bg-studio-bg p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-wow-coral to-wow-violet">
            <span className="text-2xl font-bold text-white">L</span>
          </div>
          <h1 className="text-2xl font-bold text-studio-text">
            {t('auth.welcomeBack')}
          </h1>
          <p className="mt-1 text-sm text-studio-muted">
            {t('auth.signInSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-studio-text">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-studio-border bg-studio-input px-3 py-2.5 text-sm text-studio-text placeholder:text-studio-muted focus:border-wow-violet focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-studio-text">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-studio-border bg-studio-input px-3 py-2.5 text-sm text-studio-text placeholder:text-studio-muted focus:border-wow-violet focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-wow-coral via-wow-pink to-wow-violet px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.signIn')}
          </button>

          <p className="text-center text-sm text-studio-muted">
            <button
              type="button"
              className="text-wow-violet hover:underline"
            >
              {t('auth.forgotPassword')}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
