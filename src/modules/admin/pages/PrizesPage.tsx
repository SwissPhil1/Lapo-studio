import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trophy, Gift, ShoppingBag, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KPICard } from '@/modules/admin/components/KPICard'
import { DataTable, type Column } from '@/modules/admin/components/DataTable'
import { EmptyState } from '@/modules/admin/components/EmptyState'
import { PrizeDialog } from '@/modules/admin/components/PrizeDialog'
import { usePrizes, usePrizeStats, useCreatePrize, useUpdatePrize, useDeletePrize } from '@/shared/hooks/usePrizes'
import { formatLapoCash } from '@/shared/lib/format'
import { toast } from 'sonner'
import type { Prize, PrizeCategory } from '@/shared/types/prize'

const CATEGORIES = ['all', 'gift_card', 'experience', 'product', 'discount', 'other'] as const

export default function PrizesPage() {
  const { t } = useTranslation('prizes')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null)

  const { data: prizes, isLoading } = usePrizes(categoryFilter as PrizeCategory | 'all')
  const { data: stats } = usePrizeStats()
  const createMutation = useCreatePrize()
  const updateMutation = useUpdatePrize()
  const deleteMutation = useDeletePrize()

  const filteredPrizes = (prizes ?? []).filter((p) => {
    if (!search) return true
    return p.name.toLowerCase().includes(search.toLowerCase())
  })

  const handleSave = (data: Parameters<typeof createMutation.mutate>[0]) => {
    if (editingPrize) {
      updateMutation.mutate(
        { id: editingPrize.id, ...data },
        {
          onSuccess: () => {
            toast.success(t('toast.updated'))
            setDialogOpen(false)
            setEditingPrize(null)
          },
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success(t('toast.created'))
          setDialogOpen(false)
        },
      })
    }
  }

  const handleEdit = (prize: Prize) => {
    setEditingPrize(prize)
    setDialogOpen(true)
  }

  const handleDelete = (prize: Prize) => {
    if (!window.confirm(t('toast.deleteConfirm'))) return
    deleteMutation.mutate(prize.id, {
      onSuccess: () => toast.success(t('toast.deleted')),
    })
  }

  const getStatusBadge = (prize: Prize) => {
    if (!prize.is_active) {
      return (
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {t('inactive')}
        </span>
      )
    }
    if (prize.stock !== null && prize.stock <= prize.redeemed_count) {
      return (
        <span className="inline-flex items-center rounded-full border border-warning/30 bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
          {t('outOfStock')}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
        {t('active')}
      </span>
    )
  }

  const columns: Column<Prize>[] = [
    {
      key: 'name',
      header: t('name'),
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.image_url ? (
            <img
              src={row.image_url}
              alt={row.name}
              className="h-10 w-10 rounded-lg object-cover border border-border"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Gift className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            {row.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{row.description}</p>
            )}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'lapo_cash_cost',
      header: t('cost'),
      cell: (row) => (
        <span className="font-medium text-foreground">{formatLapoCash(row.lapo_cash_cost)}</span>
      ),
      sortable: true,
    },
    {
      key: 'category',
      header: t('category'),
      cell: (row) => (
        <span className="text-sm text-muted-foreground capitalize">
          {t(`categories.${row.category}`)}
        </span>
      ),
    },
    {
      key: 'stock',
      header: t('stock'),
      cell: (row) => (
        <span className="text-sm">
          {row.stock !== null ? (
            <>
              <span className="text-foreground">{row.stock - row.redeemed_count}</span>
              <span className="text-muted-foreground"> / {row.stock}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{t('unlimited')}</span>
          )}
        </span>
      ),
    },
    {
      key: 'redeemed_count',
      header: t('redeemed'),
      cell: (row) => <span className="text-sm text-foreground">{row.redeemed_count}</span>,
      sortable: true,
    },
    {
      key: 'is_active',
      header: t('status'),
      cell: (row) => getStatusBadge(row),
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
            {t('editPrize', { defaultValue: 'Edit' })}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDelete(row)}
          >
            {t('common:delete', { defaultValue: 'Delete' })}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('pageTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('pageDescription')}</p>
        </div>
        <Button
          onClick={() => {
            setEditingPrize(null)
            setDialogOpen(true)
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('createPrize')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={t('stats.totalPrizes')}
          value={stats?.totalPrizes ?? 0}
          icon={Trophy}
          loading={!stats}
        />
        <KPICard
          title={t('stats.activePrizes')}
          value={stats?.activePrizes ?? 0}
          icon={Sparkles}
          loading={!stats}
        />
        <KPICard
          title={t('stats.totalRedemptions')}
          value={stats?.totalRedemptions ?? 0}
          icon={ShoppingBag}
          loading={!stats}
        />
        <KPICard
          title={t('stats.lapoCashSpent')}
          value={formatLapoCash(stats?.lapoCashSpent ?? 0)}
          icon={Gift}
          loading={!stats}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common:search', { defaultValue: 'Search...' })}
          className="max-w-xs"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {t(`categories.${cat}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table or Empty State */}
      {!isLoading && filteredPrizes.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={t('noPrizes')}
          description={t('noPrizesDescription')}
          action={
            <Button
              onClick={() => {
                setEditingPrize(null)
                setDialogOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('createPrize')}
            </Button>
          }
        />
      ) : (
        <DataTable
          data={filteredPrizes}
          columns={columns}
          loading={isLoading}
          pageSize={10}
        />
      )}

      {/* Prize Dialog */}
      <PrizeDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingPrize(null)
        }}
        prize={editingPrize}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
