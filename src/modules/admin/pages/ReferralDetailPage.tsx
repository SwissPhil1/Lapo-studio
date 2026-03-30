import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Building2, Trash2, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
        `https://dcrlaoudqcfbauxalbgs.supabase.co/functions/v1/delete-referral`,
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
        referrer_name: referrerData?.patients
          ? `${referrerData.patients.first_name} ${referrerData.patients.last_name}`
          : null,
        referrer_company: referrerData?.companies?.name || null,
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

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (!referral) {
    return (
      <div className="p-8">
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/referrals')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('referralDetail:backToReferrals')}
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              {t('referralDetail:title')}
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={referral.referral_status} type="referral" />
              {referral.is_test && (
                <Badge variant="outline" className="bg-muted">
                  {t('referralDetail:testData')}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-sm text-muted-foreground">
              <div>{t('referralDetail:created')}: {formatDateTime(referral.created_at)}</div>
              <div>{t('referralDetail:updated')}: {formatDateTime(referral.updated_at)}</div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common:delete')}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Referral Confirmation Dialog */}
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

      {/* People Cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        {/* Referrer Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('referralDetail:referrer')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t('common:name')}</div>
              <div className="text-base text-foreground">
                {referral.referrer_name || referral.referrer_email}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t('referralDetail:code')}</div>
              <div className="font-mono text-base text-foreground">
                {referral.referrer_code}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t('common:email')}</div>
              <a
                href={`mailto:${referral.referrer_email}`}
                className="text-base text-foreground hover:underline"
              >
                {referral.referrer_email}
              </a>
            </div>
            {referral.referrer_company && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t('referralDetail:company')}</div>
                <div className="flex items-center gap-1 text-base text-foreground">
                  <Building2 className="h-4 w-4" />
                  {referral.referrer_company}
                </div>
              </div>
            )}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/referrers/${referral.referrer_id}`)}
              >
                {t('referralDetail:viewReferrerDetails')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referred Person Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('referralDetail:referredPerson')}
              </CardTitle>
              {referral.referred_patient_id && (
                <Button variant="outline" size="sm" onClick={openEditDialog}>
                  <Pencil className="h-4 w-4 mr-1" />
                  {t('common:edit')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t('common:name')}</div>
              <div className="text-base text-foreground">
                {referral.referred_name || '—'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t('common:email')}</div>
              <div className="text-base text-foreground">
                {referral.referred_email || '—'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t('referralDetail:phone')}</div>
              <div className="text-base text-foreground">
                {referral.referred_phone || '—'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t('referralDetail:originType')}</div>
              <div className="text-base text-foreground capitalize">
                {referral.origin_type || '—'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t('referralDetail:lastAppointment')}</div>
              <div className="text-base text-foreground">
                {referral.referred_last_appointment
                  ? formatDate(referral.referred_last_appointment)
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t('referralDetail:lifetimeSpending')}</div>
              <div className="text-base font-semibold text-foreground">
                {referral.referred_total_spent
                  ? formatCurrency(referral.referred_total_spent)
                  : '—'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('referralDetail:totalAcrossBookings')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('referralDetail:transactionTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {referral.transactions.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{t('referralDetail:table.date')}</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{t('referralDetail:table.service')}</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t('referralDetail:table.amountSpent')}</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{t('referralDetail:table.rateApplied')}</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t('referralDetail:table.commission')}</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{t('common:status')}</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{t('referralDetail:table.payoutBatch')}</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{t('common:actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referral.transactions.map((tx) => (
                      <tr key={tx.booking_id} className="border-b">
                        <td className="py-3 px-2 text-sm text-foreground">
                          {formatDate(tx.booking_date)}
                        </td>
                        <td className="py-3 px-2 text-sm text-foreground">
                          {tx.service && tx.service !== 'Zapier Webhook Booking' ? tx.service : '—'}
                        </td>
                        <td className="py-3 px-2 text-sm text-foreground text-right font-medium">
                          {tx.commission_status === 'no_commission' ? '—' : formatCurrency(tx.purchase_amount)}
                        </td>
                        <td className="py-3 px-2 text-sm text-foreground">
                          {tx.commission_rate !== null ? (
                            <>
                              {tx.commission_rate}%
                              {tx.purchase_type && (
                                <span className="text-muted-foreground text-xs ml-1">
                                  – {tx.purchase_type === 'first_purchase' || tx.purchase_type.toLowerCase() === 'first'
                                    ? t('referralDetail:table.first')
                                    : t('referralDetail:table.repeat')}
                                </span>
                              )}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-2 text-sm text-foreground text-right font-semibold">
                          {tx.commission_status === 'no_commission' ? '—' : formatCurrency(tx.commission_amount)}
                        </td>
                        <td className="py-3 px-2">
                          <StatusBadge
                            status={tx.commission_status}
                            type="commission"
                          />
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">
                          {tx.batch_id ? (
                            <button
                              onClick={() => navigate(`/admin/payouts/${tx.batch_id}`)}
                              className="font-mono text-sm text-primary hover:underline"
                            >
                              {tx.batch_number ? `${t('referralDetail:table.batch')} #${tx.batch_number}` : tx.batch_id.slice(0, 8)}
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBookingToDelete(tx.booking_id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td colSpan={2} className="py-3 px-2 text-sm text-foreground">
                        {t('referralDetail:table.total')}
                      </td>
                      <td className="py-3 px-2 text-sm text-foreground text-right font-bold">
                        {formatCurrency(
                          referral.transactions.reduce((sum, tx) => sum + tx.purchase_amount, 0)
                        )}
                      </td>
                      <td></td>
                      <td className="py-3 px-2 text-sm text-foreground text-right font-bold">
                        {formatCurrency(
                          referral.transactions.reduce((sum, tx) => sum + tx.commission_amount, 0)
                        )}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="text-xs text-muted-foreground pt-2">
                {t('referralDetail:table.footnote')}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground py-4">
              {t('referralDetail:noTransactions')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Booking Confirmation */}
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

      {/* Edit Referred Person Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('referralDetail:editDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
