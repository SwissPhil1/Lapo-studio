import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Building2,
  Calendar,
  CreditCard,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface TransactionRow {
  booking_id: string
  booking_date: string
  service: string | null
  purchase_amount: number
  commission_rate: number | null
  purchase_type: string | null
  commission_amount: number
  commission_status: string
  batch_id: string | null
  batch_number: number | null
}

interface ReferralDetailData {
  id: string
  created_at: string
  updated_at: string
  referral_status: string
  origin_type: string
  is_test: boolean
  referrer_id: string
  referrer_code: string
  referrer_email: string
  referrer_name: string | null
  referrer_company: string | null
  referred_patient_id: string | null
  referred_profile_id: string | null
  referred_name: string | null
  referred_email: string | null
  referred_phone: string | null
  referred_last_appointment: string | null
  referred_total_spent: number | null
  transactions: TransactionRow[]
}

export default function ReferralDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['referralDetail', 'common'])
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleDeleteReferral = async () => {
    if (!id) return
    setIsDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-referral`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ referral_id: id }),
        }
      )

      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      toast.success(t('referralDetail:toast.deleteSuccess'))
      navigate('/admin/referrals')
    } catch (error) {
      console.error('Error deleting referral:', error)
      toast.error(t('referralDetail:toast.deleteError'))
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const { data: referral, isLoading, refetch } = useQuery({
    queryKey: ['referral-detail', id],
    queryFn: async () => {
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select(`
          id,
          created_at,
          updated_at,
          referral_status,
          origin_type,
          is_test,
          booking_id,
          referrer_id,
          referred_patient_id,
          referred_profile_id
        `)
        .eq('id', id!)
        .single()

      if (referralError) throw referralError

      const { data: referrerData } = await supabase
        .from('referrers')
        .select(`
          referrer_code,
          email,
          patient_id,
          company_id,
          patients!referrers_patient_id_fkey(first_name, last_name),
          companies(name)
        `)
        .eq('id', referralData.referrer_id)
        .single()

      let referred_name = null
      let referred_email = null
      let referred_phone = null

      if (referralData.referred_patient_id) {
        const { data: patient } = await supabase
          .from('patients')
          .select('first_name, last_name, email, phone')
          .eq('id', referralData.referred_patient_id)
          .single()

        if (patient) {
          referred_name = `${patient.first_name} ${patient.last_name}`
          referred_email = patient.email
          referred_phone = patient.phone
        }
      }

      if (!referred_name && referralData.referred_profile_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', referralData.referred_profile_id)
          .single()

        if (profile) {
          referred_name = `${profile.first_name} ${profile.last_name}`
          referred_email = profile.email
        }
      }

      const transactions: TransactionRow[] = []

      if (referralData.referred_patient_id && referrerData?.referrer_code) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            service,
            booking_value
          `)
          .eq('patient_id', referralData.referred_patient_id)
          .eq('referrer_code', referrerData.referrer_code)
          .order('booking_date', { ascending: false })

        if (bookings && bookings.length > 0) {
          const bookingIds = bookings.map(b => b.id)

          const { data: commissions } = await supabase
            .from('commission_entries')
            .select(`
              booking_id,
              purchase_amount,
              commission_amount,
              commission_rate,
              purchase_type,
              status,
              batch_id,
              commission_batches!batch_id(
                batch_number
              )
            `)
            .in('booking_id', bookingIds)
            .eq('referrer_id', referralData.referrer_id)

          const commissionMap = new Map()
          if (commissions) {
            commissions.forEach(c => {
              commissionMap.set(c.booking_id, c)
            })
          }

          bookings.forEach(booking => {
            const commission = commissionMap.get(booking.id)

            transactions.push({
              booking_id: booking.id,
              booking_date: booking.booking_date,
              service: booking.service,
              purchase_amount: commission?.purchase_amount || booking.booking_value || 0,
              commission_rate: commission?.commission_rate || null,
              purchase_type: commission?.purchase_type || null,
              commission_amount: commission?.commission_amount || 0,
              commission_status: commission?.status || 'pending',
              batch_id: commission?.batch_id || null,
              batch_number: commission?.commission_batches?.batch_number || null,
            })
          })
        }
      }

      let referred_last_appointment = null
      let referred_total_spent = null

      const patientId = referralData.referred_patient_id
      if (patientId) {
        const { data: lastBooking } = await supabase
          .from('bookings')
          .select('booking_date')
          .eq('patient_id', patientId)
          .order('booking_date', { ascending: false })
          .limit(1)
          .single()

        if (lastBooking) {
          referred_last_appointment = lastBooking.booking_date
        }

        const { data: commissions } = await supabase
          .from('commission_entries')
          .select('purchase_amount')
          .eq('patient_id', patientId)
          .not('status', 'in', '(cancelled,reversed)')

        if (commissions && commissions.length > 0) {
          referred_total_spent = commissions.reduce(
            (sum, c) => sum + (c.purchase_amount || 0),
            0
          )
        }
      }

      return {
        id: referralData.id,
        created_at: referralData.created_at,
        updated_at: referralData.updated_at,
        referral_status: referralData.referral_status,
        origin_type: referralData.origin_type,
        is_test: referralData.is_test,
        referrer_id: referralData.referrer_id,
        referrer_code: referrerData?.referrer_code || '—',
        referrer_email: referrerData?.email || '—',
        referrer_name: (referrerData?.patients as any)
          ? `${(referrerData?.patients as any).first_name} ${(referrerData?.patients as any).last_name}`
          : null,
        referrer_company: (referrerData?.companies as any)?.name || null,
        referred_patient_id: referralData.referred_patient_id,
        referred_profile_id: referralData.referred_profile_id,
        referred_name,
        referred_email,
        referred_phone,
        referred_last_appointment,
        referred_total_spent,
        transactions,
      } as ReferralDetailData
    },
    enabled: !!id,
  })

  const openEditDialog = () => {
    if (referral) {
      const nameParts = (referral.referred_name || '').split(' ')
      setEditForm({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: referral.referred_email || '',
        phone: referral.referred_phone || '',
      })
      setIsEditDialogOpen(true)
    }
  }

  const handleSaveEdit = async () => {
    if (!referral?.referred_patient_id) {
      toast.error(t('referralDetail:toast.noPatientError'))
      return
    }

    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('patients')
        .update({
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim(),
          email: editForm.email.trim().toLowerCase(),
          phone: editForm.phone.trim() || null,
        })
        .eq('id', referral.referred_patient_id)
        .select()

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('phone') || error.message.includes('normalized_phone')) {
            toast.error(t('referralDetail:toast.duplicatePhone'))
          } else if (error.message.includes('email')) {
            toast.error(t('referralDetail:toast.duplicateEmail'))
          } else {
            toast.error(t('referralDetail:toast.duplicateValue'))
          }
          return
        }
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('Update not authorized')
      }

      toast.success(t('referralDetail:toast.updateSuccess'))
      setIsEditDialogOpen(false)
      refetch()
    } catch (error) {
      console.error('Error updating patient:', error)
      toast.error(t('referralDetail:toast.updateError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const { error: commissionError } = await supabase
        .from('commission_entries')
        .delete()
        .eq('booking_id', bookingId)
      if (commissionError) throw commissionError

      const { error: mappingError } = await supabase
        .from('booking_mappings')
        .delete()
        .eq('booking_id', bookingId)
      if (mappingError) throw mappingError

      const { error: notesError } = await supabase
        .from('booking_notes')
        .delete()
        .eq('booking_id', bookingId)
      if (notesError) throw notesError

      const { error: bookingError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
      if (bookingError) throw bookingError

      toast.success(t('referralDetail:toast.bookingDeleteSuccess'))
      refetch()
      setBookingToDelete(null)
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error(t('referralDetail:toast.bookingDeleteError'))
    }
  }

  // Compute KPIs
  const totalSpent = referral?.transactions.reduce((sum, tx) => sum + tx.purchase_amount, 0) ?? 0
  const totalCommission = referral?.transactions.reduce((sum, tx) => sum + tx.commission_amount, 0) ?? 0
  const bookingCount = referral?.transactions.length ?? 0

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-80" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!referral) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 md:p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t('referralDetail:notFound')}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t('referralDetail:notFoundDesc')}
          </p>
          <Button onClick={() => navigate('/admin/referrals')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('referralDetail:backToReferrals')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">

      {/* ── Header: Relationship title ── */}
      <div>
        <button
          onClick={() => navigate('/admin/referrals')}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {t('referralDetail:backToReferrals')}
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground truncate">
              {referral.referred_name || '—'}
              <span className="text-muted-foreground font-normal text-lg md:text-xl ml-2">
                {t('referralDetail:referredBy')} {referral.referrer_name || referral.referrer_email}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge status={referral.referral_status} type="referral" />
              <span className="text-sm text-muted-foreground capitalize">{referral.origin_type}</span>
              <span className="text-sm text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{formatDate(referral.created_at)}</span>
              {referral.is_test && (
                <Badge variant="outline" className="bg-muted text-xs">
                  {t('referralDetail:testData')}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {referral.referred_patient_id && (
                <DropdownMenuItem onClick={openEditDialog}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('referralDetail:editReferredPerson')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate(`/admin/referrers/${referral.referrer_id}`)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                {t('referralDetail:viewReferrerDetails')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('referralDetail:deleteReferral')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── KPI Pills ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <CreditCard className="h-3.5 w-3.5" />
              {t('referralDetail:kpi.totalSpent')}
            </div>
            <div className="text-xl md:text-2xl font-bold text-foreground">
              {totalSpent > 0 ? formatCurrency(totalSpent) : '—'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {t('referralDetail:kpi.commissionEarned')}
            </div>
            <div className="text-xl md:text-2xl font-bold text-foreground">
              {totalCommission > 0 ? formatCurrency(totalCommission) : '—'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Calendar className="h-3.5 w-3.5" />
              {t('referralDetail:kpi.bookings')}
            </div>
            <div className="text-xl md:text-2xl font-bold text-foreground">
              {bookingCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Activity Timeline ── */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">
            {t('referralDetail:timeline.title')}
          </h2>

          {referral.transactions.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border" />

              <div className="space-y-0">
                {referral.transactions.map((tx) => {
                  const hasCommission = tx.commission_rate !== null && tx.commission_status !== 'no_commission'
                  const serviceName = tx.service && tx.service !== 'Zapier Webhook Booking' ? tx.service : null


                  return (
                    <div key={tx.booking_id} className="relative pl-7 pb-5 group">
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 ${
                        hasCommission
                          ? 'border-primary bg-primary/20'
                          : 'border-muted-foreground/30 bg-background'
                      }`} />

                      {/* Booking row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">
                              {serviceName || t('referralDetail:timeline.booking')}
                            </span>
                            <StatusBadge status={tx.commission_status} type="commission" />
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(tx.booking_date)}
                          </div>

                          {/* Commission detail nested under booking */}
                          {hasCommission && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-2.5 py-1.5 w-fit">
                              <span>
                                {tx.commission_rate}% ·{' '}
                                {tx.purchase_type === 'first_purchase' || tx.purchase_type?.toLowerCase() === 'first'
                                  ? t('referralDetail:timeline.firstPurchase')
                                  : t('referralDetail:timeline.repeatPurchase')}
                              </span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="font-semibold text-foreground">
                                {formatCurrency(tx.commission_amount)}
                              </span>
                              {tx.batch_number && (
                                <button
                                  onClick={() => navigate(`/admin/payouts/${tx.batch_id}`)}
                                  className="text-primary hover:underline font-mono ml-1"
                                >
                                  #{tx.batch_number}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Amount + delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            {tx.commission_status === 'no_commission' ? '—' : formatCurrency(tx.purchase_amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => setBookingToDelete(tx.booking_id)}
                            aria-label={t('referralDetail:timeline.deleteBooking')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Referral creation event */}
                <div className="relative pl-7">
                  <div className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-muted-foreground/30 bg-background" />
                  <div className="text-sm text-muted-foreground">
                    {t('referralDetail:timeline.referralCreated')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDateTime(referral.created_at)}
                  </div>
                </div>
              </div>

              {/* Total summary */}
              {referral.transactions.length > 1 && (
                <div className="mt-5 pt-4 border-t flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('referralDetail:timeline.totalThisReferral')}
                  </span>
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatCurrency(totalSpent)}
                    </span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      → {formatCurrency(totalCommission)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
              {t('referralDetail:noTransactions')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── People & Contact Info ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Referrer */}
        <Card className="border-0 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('referralDetail:referrer')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => navigate(`/admin/referrers/${referral.referrer_id}`)}
              >
                {t('referralDetail:viewProfile')}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="text-base font-medium text-foreground mb-1">
              {referral.referrer_name || referral.referrer_email}
            </div>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded">
                  {referral.referrer_code}
                </span>
              </div>
              {referral.referrer_email !== '—' && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a href={`mailto:${referral.referrer_email}`} className="hover:text-foreground truncate">
                    {referral.referrer_email}
                  </a>
                </div>
              )}
              {referral.referrer_company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  {referral.referrer_company}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Referred Person */}
        <Card className="border-0 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('referralDetail:referredPerson')}
              </h3>
              {referral.referred_patient_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={openEditDialog}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  {t('common:edit')}
                </Button>
              )}
            </div>
            <div className="text-base font-medium text-foreground mb-1">
              {referral.referred_name || '—'}
            </div>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              {referral.referred_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{referral.referred_email}</span>
                </div>
              )}
              {referral.referred_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {referral.referred_phone}
                </div>
              )}
              {referral.referred_last_appointment && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {t('referralDetail:lastSeen')} {formatDate(referral.referred_last_appointment)}
                </div>
              )}
              {referral.referred_total_spent != null && referral.referred_total_spent > 0 && (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                  {t('referralDetail:lifetimeSpending')}: {formatCurrency(referral.referred_total_spent)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Dialogs ── */}

      {/* Delete Referral */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('referralDetail:deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('referralDetail:deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReferral}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('referralDetail:deleting') : t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Booking */}
      <AlertDialog open={!!bookingToDelete} onOpenChange={() => setBookingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('referralDetail:bookingDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('referralDetail:bookingDeleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookingToDelete && handleDeleteBooking(bookingToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Referred Person */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('referralDetail:editDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t('referralDetail:editDialog.firstName')}</Label>
                <Input
                  id="first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">{t('referralDetail:editDialog.lastName')}</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('common:email')}</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('referralDetail:editDialog.phone')}</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? t('referralDetail:editDialog.saving') : t('common:save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
