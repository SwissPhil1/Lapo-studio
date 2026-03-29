import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { checkPayoutProfileStatus } from "@/shared/lib/payoutProfile";

export function usePayoutProfileStatus(referrerId: string | undefined) {
  return useQuery({
    queryKey: ["payout-profile-status", referrerId],
    queryFn: () => checkPayoutProfileStatus(referrerId!),
    enabled: !!referrerId,
  });
}

export function useUnreadPayoutReminders(referrerId: string | undefined) {
  return useQuery({
    queryKey: ["unread-payout-reminders", referrerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrer_notifications")
        .select("*")
        .eq("referrer_id", referrerId!)
        .eq("type", "payout_profile_reminder")
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!referrerId,
  });
}
