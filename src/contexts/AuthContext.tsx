import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '@/shared/lib/supabase'
import type { AppUser, AppRole } from '@/shared/types/auth'
import { canAccessAdmin, canAccessCRM } from '@/shared/types/auth'
import type { Session } from '@supabase/supabase-js'

interface AuthContextValue {
  user: AppUser | null
  session: Session | null
  loading: boolean
  role: AppRole
  isAdmin: boolean
  isCRM: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = useCallback(async (userId: string, email: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', userId)
      .single()

    const firstName = profile?.first_name ?? ''
    const lastName = profile?.last_name ?? ''
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0]

    const appUser: AppUser = {
      id: userId,
      email,
      full_name: fullName,
      role: (profile?.role as AppRole) ?? 'user',
    }

    setUser(appUser)
    return appUser
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) {
        fetchUserProfile(s.user.id, s.user.email ?? '').finally(() =>
          setLoading(false)
        )
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user) {
        fetchUserProfile(s.user.id, s.user.email ?? '')
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const role = user?.role ?? 'user'

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        isAdmin: canAccessAdmin(role),
        isCRM: canAccessCRM(role),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
