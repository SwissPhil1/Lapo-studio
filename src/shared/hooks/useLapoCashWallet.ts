import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface LapoCashWallet {
  id: string;
  referrer_id: string;
  patient_id?: string | null;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface LapoCashTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: string;
  description: string | null;
  performed_by: string | null;
  reference_id: string | null;
  created_at: string;
  referrer_id?: string;
  referrer_name?: string;
  referrer_code?: string;
}

export type TransactionType = 
  | "commission_conversion"
  | "birthday_gift"
  | "workshop_reward"
  | "referral_bonus"
  | "redemption"
  | "adjustment"
  | "expiration"
  | "other";

// Fetch wallet for a specific referrer
export function useLapoCashWallet(referrerId: string | undefined) {
  return useQuery({
    queryKey: ["lapo-cash-wallet", referrerId],
    queryFn: async () => {
      if (!referrerId) return null;
      
      const { data, error } = await supabase
        .from("lapo_cash_wallets")
        .select("*")
        .eq("referrer_id", referrerId)
        .maybeSingle();
      
      if (error) throw error;
      return data as LapoCashWallet | null;
    },
    enabled: !!referrerId,
  });
}

// Fetch all wallets with referrer info
export function useAllLapoCashWallets() {
  return useQuery({
    queryKey: ["lapo-cash-wallets-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lapo_cash_wallets")
        .select(`
          *,
          referrers(referrer_code, email, patient_id, patients(first_name, last_name))
        `)
        .gt("balance", 0)
        .order("balance", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch transactions for a specific wallet
export function useLapoCashTransactions(walletId: string | undefined) {
  return useQuery({
    queryKey: ["lapo-cash-transactions", walletId],
    queryFn: async () => {
      if (!walletId) return [];
      
      const { data, error } = await supabase
        .from("lapo_cash_transactions")
        .select("*")
        .eq("wallet_id", walletId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LapoCashTransaction[];
    },
    enabled: !!walletId,
  });
}

// Fetch all transactions with referrer info
export function useAllLapoCashTransactions(limit = 50) {
  return useQuery({
    queryKey: ["lapo-cash-transactions-all", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lapo_cash_transactions")
        .select(`
          *,
          lapo_cash_wallets(
            referrer_id,
            referrers(referrer_code, patient_id, patients!referrers_patient_id_fkey(first_name, last_name))
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Transform to include referrer info at top level
      return data.map((tx: any) => ({
        ...tx,
        referrer_id: tx.lapo_cash_wallets?.referrer_id,
        referrer_name: tx.lapo_cash_wallets?.referrers?.patients 
          ? `${tx.lapo_cash_wallets.referrers.patients.first_name} ${tx.lapo_cash_wallets.referrers.patients.last_name}`
          : null,
        referrer_code: tx.lapo_cash_wallets?.referrers?.referrer_code,
      })) as LapoCashTransaction[];
    },
  });
}

// Get conversion rate from settings (legacy fallback)
export function useLapoCashConversionRate() {
  return useQuery({
    queryKey: ["lapo-cash-conversion-rate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "lapo_cash_conversion_rate")
        .single();
      
      if (error) throw error;
      // Value is stored as JSON string, e.g., "1.20"
      return parseFloat(data.value as string) || 1.2;
    },
  });
}

// Get conversion rates per tier from referrer_types
export function useTierConversionRates() {
  return useQuery({
    queryKey: ["lapo-cash-tier-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrer_types")
        .select("code, name, lapo_cash_conversion_rate")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as { code: string; name: string; lapo_cash_conversion_rate: number | null }[];
    },
  });
}

// Get conversion rate for a specific referrer (based on their tier)
export function useReferrerConversionRate(referrerId: string | undefined) {
  return useQuery({
    queryKey: ["lapo-cash-referrer-rate", referrerId],
    queryFn: async () => {
      if (!referrerId) return { rate: 1.10, tierCode: "standard", tierName: "Standard" };
      
      // Get the referrer's type_id
      const { data: referrer, error: referrerError } = await supabase
        .from("referrers")
        .select("referrer_type_id")
        .eq("id", referrerId)
        .maybeSingle();
      
      if (referrerError) throw referrerError;
      if (!referrer?.referrer_type_id) return { rate: 1.10, tierCode: "standard", tierName: "Standard" };
      
      // Get the referrer type details
      const { data: referrerType, error: typeError } = await supabase
        .from("referrer_types")
        .select("lapo_cash_conversion_rate, code, name")
        .eq("id", referrer.referrer_type_id)
        .maybeSingle();
      
      if (typeError) throw typeError;
      
      return {
        rate: Number(referrerType?.lapo_cash_conversion_rate) || 1.10,
        tierCode: referrerType?.code || "standard",
        tierName: referrerType?.name || "Standard",
      };
    },
    enabled: !!referrerId,
  });
}

// Get aggregate stats
export function useLapoCashStats() {
  return useQuery({
    queryKey: ["lapo-cash-stats"],
    queryFn: async () => {
      // Get total active balance
      const { data: wallets } = await supabase
        .from("lapo_cash_wallets")
        .select("balance");
      
      const activeBalance = (wallets || []).reduce((sum, w) => sum + (w.balance || 0), 0);
      
      // Get total issued (positive transactions)
      const { data: creditTxs } = await supabase
        .from("lapo_cash_transactions")
        .select("amount")
        .gt("amount", 0);
      
      const totalIssued = (creditTxs || []).reduce((sum, tx) => sum + tx.amount, 0);
      
      // Get total redeemed (negative transactions)
      const { data: debitTxs } = await supabase
        .from("lapo_cash_transactions")
        .select("amount")
        .lt("amount", 0);
      
      const totalRedeemed = Math.abs((debitTxs || []).reduce((sum, tx) => sum + tx.amount, 0));
      
      return {
        activeBalance,
        totalIssued,
        totalRedeemed,
      };
    },
  });
}

// Credit/Debit LAPO Cash
export function useLapoCashMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("lapoCash");
  
  return useMutation({
    mutationFn: async ({
      referrerId,
      amount,
      type,
      description,
    }: {
      referrerId: string;
      amount: number; // positive for credit, negative for debit
      type: TransactionType;
      description?: string;
    }) => {
      // Get or create wallet
      let { data: wallet } = await supabase
        .from("lapo_cash_wallets")
        .select("id, balance")
        .eq("referrer_id", referrerId)
        .maybeSingle();
      
      if (!wallet) {
        const { data: newWallet, error: createError } = await supabase
          .from("lapo_cash_wallets")
          .insert({ referrer_id: referrerId, balance: 0 })
          .select()
          .single();
        
        if (createError) throw createError;
        wallet = newWallet;
      }
      
      const newBalance = (wallet!.balance || 0) + amount;
      
      // Prevent negative balance for debits
      if (newBalance < 0) {
        throw new Error("Insufficient LAPO Cash balance");
      }

      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create transaction with performed_by
      const { error: txError } = await supabase
        .from("lapo_cash_transactions")
        .insert({
          wallet_id: wallet!.id,
          amount,
          type,
          description: description || null,
          performed_by: user?.id || null,
        });
      
      if (txError) throw txError;
      
      // Update wallet balance
      const { error: updateError } = await supabase
        .from("lapo_cash_wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", wallet!.id);
      
      if (updateError) throw updateError;
      
      return { newBalance };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lapo-cash-wallet", variables.referrerId] });
      queryClient.invalidateQueries({ queryKey: ["lapo-cash-wallets-all"] });
      queryClient.invalidateQueries({ queryKey: ["lapo-cash-transactions-all"] });
      queryClient.invalidateQueries({ queryKey: ["lapo-cash-stats"] });
      
      toast.success(variables.amount > 0 ? t("toast.creditSuccess") : t("toast.debitSuccess"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toast.error"));
    },
  });
}

// Update conversion rate
export function useUpdateConversionRate() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("lapoCash");
  
  return useMutation({
    mutationFn: async (newRate: number) => {
      const { error } = await supabase
        .from("system_settings")
        .update({ value: `"${newRate}"`, updated_at: new Date().toISOString() })
        .eq("key", "lapo_cash_conversion_rate");
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lapo-cash-conversion-rate"] });
      toast.success(t("toast.rateUpdated"));
    },
    onError: () => {
      toast.error(t("toast.error"));
    },
  });
}
