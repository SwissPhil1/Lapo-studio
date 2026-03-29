export type PrizeCategory = 'gift_card' | 'experience' | 'product' | 'discount' | 'other'

export interface Prize {
  id: string
  name: string
  description: string | null
  lapo_cash_cost: number
  category: PrizeCategory
  image_url: string | null
  stock: number | null
  redeemed_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PrizeRedemption {
  id: string
  prize_id: string
  referrer_id: string
  lapo_cash_amount: number
  status: 'pending' | 'fulfilled' | 'cancelled'
  created_at: string
  prize?: Prize
  referrer?: {
    id: string
    patient_id: string
    patients?: { first_name: string; last_name: string }
  }
}
