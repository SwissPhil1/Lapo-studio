import { supabase } from "@/shared/lib/supabase";
import i18n from '@/i18n';

export interface PayoutProfileStatus {
  isComplete: boolean;
  missingFields: string[];
}

/**
 * Check if a referrer's payout profile is complete
 */
export async function checkPayoutProfileStatus(
  referrerId: string
): Promise<PayoutProfileStatus> {
  try {
    const { data, error } = await supabase.rpc("get_missing_payout_fields", {
      p_referrer_id: referrerId,
    });

    if (error) throw error;

    const missingFields = (data as string[]) || [];

    return {
      isComplete: missingFields.length === 0,
      missingFields,
    };
  } catch (error) {
    console.error("Error checking payout profile:", error);
    return {
      isComplete: false,
      missingFields: ["unknown"],
    };
  }
}

/**
 * Format missing fields for user display
 */
export function formatMissingFields(fields: string[]): string {
  const fieldLabels: Record<string, string> = {
    email: i18n.t('common:fieldEmail'),
    iban: i18n.t('common:fieldIban'),
    bank_name: i18n.t('common:fieldBankName'),
    first_name: i18n.t('common:fieldFirstName'),
    last_name: i18n.t('common:fieldLastName'),
  };

  return fields
    .map((f) => fieldLabels[f] || f)
    .join(", ");
}
