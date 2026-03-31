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

// Fetch wallet for a specific patient
export function usePatientLapoCashWallet(patientId: string | undefined) {
  return useQuery({
    queryKey: ["lapo-cash-wallet-patient", patientId],
    queryFn: async () => {
      if (!patientId) return null;

      const { data, error } = await supabase
        .from("lapo_cash_wallets")
        .select("*")
        .eq("patient_id", patientId)
        .maybeSingle();

      if (error) throw error;
      return data as LapoCashWallet | null;
    },
    enabled: !!patientId,
  });
}

// Credit/Debit LAPO Cash for a patient (direct Supabase operations)
export function usePatientLapoCashMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("lapoCash");

  return useMutation({
    mutationFn: async ({
      patientId,
      amount,
      type,
      description,
    }: {
      patientId: string;
      amount: number; // positive for credit, negative for debit
      type: PatientTransactionType;
      description?: string;
    }) => {
      // Get or create wallet
      let { data: wallet } = await supabase
        .from("lapo_cash_wallets")
        .select("id, balance")
        .eq("patient_id", patientId)
        .maybeSingle();

      if (!wallet) {
        const { data: newWallet, error: createError } = await supabase
          .from("lapo_cash_wallets")
          .insert({ patient_id: patientId, balance: 0 })
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
