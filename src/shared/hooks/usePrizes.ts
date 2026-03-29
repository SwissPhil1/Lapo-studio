import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import type { Prize, PrizeCategory } from '@/shared/types/prize'

export function usePrizes(category?: PrizeCategory | 'all') {
  return useQuery({
    queryKey: ['prizes', category],
    queryFn: async () => {
      let query = supabase
        .from('prizes')
        .select('*')
        .order('created_at', { ascending: false })

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Prize[]
    },
  })
}

export function usePrizeStats() {
  return useQuery({
    queryKey: ['prize-stats'],
    queryFn: async () => {
      const { data: prizes, error } = await supabase
        .from('prizes')
        .select('id, is_active, redeemed_count, lapo_cash_cost')

      if (error) throw error

      const all = prizes ?? []
      const totalPrizes = all.length
      const activePrizes = all.filter((p) => p.is_active).length
      const totalRedemptions = all.reduce((sum, p) => sum + (p.redeemed_count ?? 0), 0)
      const lapoCashSpent = all.reduce(
        (sum, p) => sum + (p.redeemed_count ?? 0) * p.lapo_cash_cost,
        0
      )

      return { totalPrizes, activePrizes, totalRedemptions, lapoCashSpent }
    },
  })
}

export function useCreatePrize() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (prize: {
      name: string
      description: string | null
      lapo_cash_cost: number
      category: PrizeCategory
      image_url: string | null
      stock: number | null
      is_active: boolean
    }) => {
      const { data, error } = await supabase
        .from('prizes')
        .insert({
          ...prize,
          redeemed_count: 0,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prizes'] })
      queryClient.invalidateQueries({ queryKey: ['prize-stats'] })
    },
  })
}

export function useUpdatePrize() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Prize> & { id: string }) => {
      const { data, error } = await supabase
        .from('prizes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prizes'] })
      queryClient.invalidateQueries({ queryKey: ['prize-stats'] })
    },
  })
}

export function useDeletePrize() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prizes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prizes'] })
      queryClient.invalidateQueries({ queryKey: ['prize-stats'] })
    },
  })
}
