import { supabase } from "@/shared/lib/supabase";

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
    email: "Email",
    iban: "IBAN",
    bank_name: "Nom de la banque",
    first_name: "Prénom",
    last_name: "Nom",
  };

  return fields
    .map((f) => fieldLabels[f] || f)
    .join(", ");
}
