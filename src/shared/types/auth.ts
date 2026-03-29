export type AppRole = 'admin' | 'clinic_staff' | 'referrer' | 'patient' | 'user'

export interface AppUser {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: AppRole
}

export function canAccessAdmin(role: AppRole): boolean {
  return role === 'admin'
}

export function canAccessCRM(role: AppRole): boolean {
  return role === 'admin' || role === 'clinic_staff'
}
