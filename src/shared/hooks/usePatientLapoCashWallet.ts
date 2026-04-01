import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { LapoCashWallet } from "./useLapoCashWallet";

export type PatientTransactionType =
  | "loyalty_credit"
  | "loyalty_debit"
  | "gift_received"
  | "birthday_bonus"
  | "adjustment"
  | "redemption"
  | "other";

export type WalletSource = "patient" | "referrer";

export interface PatientWalletResult {
  wallet: LapoCashWallet | null;
  source: WalletSource;
  referrerId?: string;
}

// Fetch wallet for a patient: first check patient_id, then check if patient is a referrer
export function usePatientLapoCashWallet(patientId: string | undefined) {
  return useQuery({
    queryKey: ["lapo-cash-wallet-patient", patientId],
    queryFn: async (): Promise<PatientWalletResult> => {
      if (!patientId) return { wallet: null, source: "patient" };

      // 1. Check for a direct patient wallet (via patient_id)
      const { data: patientWallet, error: patientError } = await supabase
        .from("lapo_cash_wallets")
        .select("*")
        .eq("patient_id", patientId)
        .maybeSingle();

      if (patientError) throw patientError;
      if (patientWallet) {
        return { wallet: patientWallet as LapoCashWallet, source: "patient" };
      }

      // 2. Check if this patient is also a referrer
      const { data: referrer, error: referrerError } = await supabase
        .from("referrers")
        .select("id")
        .eq("patient_id", patientId)
        .maybeSingle();

      if (referrerError) throw referrerError;
      if (!referrer) return { wallet: null, source: "patient" };

      // 3. Check for a referrer wallet
      const { data: referrerWallet, error: walletError } = await supabase
        .from("lapo_cash_wallets")
        .select("*")
        .eq("referrer_id", referrer.id)
        .maybeSingle();

      if (walletError) throw walletError;
      if (referrerWallet) {
        return {
          wallet: referrerWallet as LapoCashWallet,
          source: "referrer",
          referrerId: referrer.id,
        };
      }

      // No wallet found anywhere — will create as patient wallet on first credit
      return { wallet: null, source: "patient" };
    },
    enabled: !!patientId,
  });
}

// Credit/Debit LAPO Cash for a patient (direct Supabase operations)
// Handles both patient wallets and referrer wallets
export function usePatientLapoCashMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("lapoCash");

  return useMutation({
    mutationFn: async ({
      patientId,
      amount,
      type,
      description,
      existingWalletId,
      walletSource,
      referrerId,
    }: {
      patientId: string;
      amount: number; // positive for credit, negative for debit
      type: PatientTransactionType;
      description?: string;
      existingWalletId?: string;
      walletSource?: WalletSource;
      referrerId?: string;
    }) => {
      let wallet: { id: string; balance: number } | null = null;

      // If we already know the wallet, fetch it directly
      if (existingWalletId) {
        const { data } = await supabase
          .from("lapo_cash_wallets")
          .select("id, balance")
          .eq("id", existingWalletId)
          .single();
        wallet = data;
      }

      // If no existing wallet, create a new patient wallet
      if (!wallet) {
        // For referrer source, create via referrer_id
        const insertPayload =
          walletSource === "referrer" && referrerId
            ? { referrer_id: referrerId, balance: 0 }
            : { patient_id: patientId, balance: 0 };

        const { data: newWallet, error: createError } = await supabase
          .from("lapo_cash_wallets")
          .insert(insertPayload)
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Create transaction
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
      queryClient.invalidateQueries({
        queryKey: ["lapo-cash-wallet-patient", variables.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lapo-cash-wallet", variables.referrerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lapo-cash-wallets-all"],
      });
      queryClient.invalidateQueries({
        queryKey: ["lapo-cash-transactions-all"],
      });
      queryClient.invalidateQueries({ queryKey: ["lapo-cash-stats"] });

      toast.success(
        variables.amount > 0 ? t("toast.creditSuccess") : t("toast.debitSuccess")
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toast.error"));
    },
  });
}
