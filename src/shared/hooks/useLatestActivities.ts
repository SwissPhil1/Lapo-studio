import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import type { ActivityItem, ActivityCategory } from "@/shared/types/activity";

export function useLatestActivities(limit = 10) {
  return useQuery({
    queryKey: ["latest-activities", limit],
    queryFn: async () => {
      const activities: ActivityItem[] = [];

      // 1. Fetch PENDING and PAID commissions (for "commission" category)
      const { data: pendingPaidCommissions } = await supabase
        .from("commission_entries")
        .select(`
          id,
          created_at,
          commission_amount,
          purchase_type,
          status,
          referrer_id,
          patient_id,
          referrers!fk_commission_entries_referrer(
            id,
            referrer_code,
            email,
            patients!fk_referrers_patient_id(first_name, last_name)
          ),
          patients(first_name, last_name)
        `)
        .in("status", ["pending", "paid"])
        .order("created_at", { ascending: false })
        .limit(limit);

      if (pendingPaidCommissions) {
        for (const c of pendingPaidCommissions) {
          const referrer = c.referrers as any;
          const patient = c.patients as any;
          const referrerPatient = referrer?.patients as any;

          activities.push({
            id: c.id,
            created_at: c.created_at || new Date().toISOString(),
            category: "commission",
            type: c.status === "paid" ? "commission_paid" : "new_commission",
            actor_name: referrerPatient 
              ? `${referrerPatient.first_name || ""} ${referrerPatient.last_name || ""}`.trim() 
              : referrer?.email || "—",
            actor_id: referrer?.id || c.referrer_id || "",
            actor_code: referrer?.referrer_code,
            subject_name: patient 
              ? `${patient.first_name || ""} ${patient.last_name || ""}`.trim() 
              : undefined,
            subject_id: c.patient_id || undefined,
            amount: c.commission_amount,
            currency: "CHF",
            status: c.status || undefined,
          });
        }
      }

      // 2. Fetch CONVERTED commissions (for "lapo_cash" category) - merge with LC transaction
      const { data: convertedCommissions } = await supabase
        .from("commission_entries")
        .select(`
          id,
          created_at,
          commission_amount,
          purchase_type,
          status,
          referrer_id,
          patient_id,
          split_parent_id,
          referrers!fk_commission_entries_referrer(
            id,
            referrer_code,
            email,
            patients!fk_referrers_patient_id(first_name, last_name)
          ),
          patients(first_name, last_name)
        `)
        .eq("status", "converted")
        .order("created_at", { ascending: false })
        .limit(limit);

      // Build map for original amounts (for split entries)
      const parentAmountMap = new Map<string, number>();
      if (convertedCommissions) {
        const parentIds = [...new Set(
          convertedCommissions.map(c => (c as any).split_parent_id).filter(Boolean)
        )] as string[];
        
        if (parentIds.length > 0) {
          const { data: parentCommissions } = await supabase
            .from("commission_entries")
            .select("id, commission_amount, split_parent_id")
            .in("id", parentIds);
          
          // For each parent, calculate original = parent remaining + sum of its splits
          if (parentCommissions) {
            const { data: allSplits } = await supabase
              .from("commission_entries")
              .select("split_parent_id, commission_amount")
              .in("split_parent_id", parentIds);
            
            for (const parent of parentCommissions) {
              const siblingsTotal = allSplits
                ?.filter(s => s.split_parent_id === parent.id)
                .reduce((sum, s) => sum + (s.commission_amount || 0), 0) || 0;
              const originalTotal = (parent.commission_amount || 0) + siblingsTotal;
              parentAmountMap.set(parent.id, originalTotal);
            }
          }
        }
      }

      if (convertedCommissions) {
        // Get all referrer IDs to find their wallets
        const referrerIds = [...new Set(convertedCommissions.map(c => c.referrer_id).filter(Boolean))] as string[];
        
        // Fetch wallets for these referrers
        const { data: wallets } = await supabase
          .from("lapo_cash_wallets")
          .select("id, referrer_id")
          .in("referrer_id", referrerIds);
        
        const walletMap = new Map(wallets?.map(w => [w.referrer_id, w.id]) || []);
        
        // Fetch all commission_conversion transactions for these wallets
        const walletIds = wallets?.map(w => w.id) || [];
        const { data: lcTransactions } = walletIds.length > 0
          ? await supabase
              .from("lapo_cash_transactions")
              .select("id, amount, wallet_id, created_at")
              .eq("type", "commission_conversion")
              .in("wallet_id", walletIds)
          : { data: [] };

        for (const c of convertedCommissions) {
          const referrer = c.referrers as any;
          const patient = c.patients as any;
          const referrerPatient = referrer?.patients as any;
          
          // Find matching LC transaction by wallet + timestamp proximity (within 5 seconds)
          const walletId = walletMap.get(c.referrer_id || "");
          const commissionTime = new Date(c.created_at || "").getTime();
          
          let lcAmount: number | undefined;
          if (walletId && lcTransactions) {
            const matchingTx = lcTransactions.find(tx => {
              if (tx.wallet_id !== walletId) return false;
              const txTime = new Date(tx.created_at || "").getTime();
              return Math.abs(txTime - commissionTime) < 5000; // Within 5 seconds
            });
            lcAmount = matchingTx?.amount;
          }

          // Get original amount for split entries
          const splitParentId = (c as any).split_parent_id;
          const originalAmount = splitParentId ? parentAmountMap.get(splitParentId) : undefined;

          activities.push({
            id: c.id,
            created_at: c.created_at || new Date().toISOString(),
            category: "lapo_cash",
            sourceCategory: "commission", // Track origin for cross-filtering
            type: "commission_converted",
            actor_name: referrerPatient 
              ? `${referrerPatient.first_name || ""} ${referrerPatient.last_name || ""}`.trim() 
              : referrer?.email || "—",
            actor_id: referrer?.id || c.referrer_id || "",
            actor_code: referrer?.referrer_code,
            subject_name: patient 
              ? `${patient.first_name || ""} ${patient.last_name || ""}`.trim() 
              : undefined,
            subject_id: c.patient_id || undefined,
            amount: c.commission_amount,
            currency: "CHF",
            originalAmount,
            secondaryAmount: lcAmount,
            secondaryCurrency: "LC",
            status: c.status || undefined,
          });
        }
      }

      // 3. Fetch LAPO Cash transactions (excluding commission_conversion to avoid duplicates)
      const { data: transactions } = await supabase
        .from("lapo_cash_transactions")
        .select(`
          id,
          created_at,
          amount,
          type,
          description,
          wallet_id,
          lapo_cash_wallets(
            referrer_id,
            referrers(
              id,
              referrer_code,
              email,
              patients!fk_referrers_patient_id(first_name, last_name)
            )
          )
        `)
        .neq("type", "commission_conversion")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (transactions) {
        for (const tx of transactions) {
          const wallet = tx.lapo_cash_wallets as any;
          const referrer = wallet?.referrers as any;
          const referrerPatient = referrer?.patients as any;

          activities.push({
            id: tx.id,
            created_at: tx.created_at || new Date().toISOString(),
            category: "lapo_cash",
            type: tx.type || "other",
            actor_name: referrerPatient 
              ? `${referrerPatient.first_name || ""} ${referrerPatient.last_name || ""}`.trim() 
              : referrer?.email || "—",
            actor_id: referrer?.id || "",
            actor_code: referrer?.referrer_code,
            amount: tx.amount,
            currency: "LC",
          });
        }
      }

      // 4. Fetch latest referrals with batch-fetched referrer and patient data
      const { data: referrals } = await supabase
        .from("referrals")
        .select(`
          id,
          created_at,
          referral_status,
          referrer_id,
          referred_patient_id
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (referrals && referrals.length > 0) {
        // Batch fetch all unique referrer and patient IDs (eliminates N+1 queries)
        const referrerIds = [...new Set(referrals.map(r => r.referrer_id).filter(Boolean))] as string[];
        const patientIds = [...new Set(referrals.map(r => r.referred_patient_id).filter(Boolean))] as string[];

        // Single query for all referrers
        const { data: referrersData } = referrerIds.length > 0
          ? await supabase
              .from("referrers")
              .select("id, referrer_code, email, patients!fk_referrers_patient_id(first_name, last_name)")
              .in("id", referrerIds)
          : { data: [] };

        // Single query for all patients
        const { data: patientsData } = patientIds.length > 0
          ? await supabase
              .from("patients")
              .select("id, first_name, last_name")
              .in("id", patientIds)
          : { data: [] };

        // Build lookup maps for O(1) access with proper typing
        type ReferrerLookup = {
          id: string;
          referrer_code: string;
          email: string;
          patients: { first_name: string | null; last_name: string | null } | null;
        };
        type PatientLookup = {
          id: string;
          first_name: string | null;
          last_name: string | null;
        };
        
        const referrerMap = new Map<string, ReferrerLookup>(
          (referrersData || []).map(r => [r.id, r as unknown as ReferrerLookup])
        );
        const patientMap = new Map<string, PatientLookup>(
          (patientsData || []).map(p => [p.id, p as PatientLookup])
        );

        for (const r of referrals) {
          let actorName = "—";
          let actorCode: string | undefined;
          let subjectName: string | undefined;

          if (r.referrer_id) {
            const referrerData = referrerMap.get(r.referrer_id);
            if (referrerData) {
              const rp = referrerData.patients;
              actorName = rp ? `${rp.first_name || ""} ${rp.last_name || ""}`.trim() : referrerData.email || "—";
              actorCode = referrerData.referrer_code;
            }
          }

          if (r.referred_patient_id) {
            const patientData = patientMap.get(r.referred_patient_id);
            if (patientData) {
              subjectName = `${patientData.first_name || ""} ${patientData.last_name || ""}`.trim();
            }
          }

          activities.push({
            id: r.id,
            created_at: r.created_at || new Date().toISOString(),
            category: "referral",
            type: r.referral_status === "confirmed" ? "referral_confirmed" : 
                  r.referral_status === "booked" ? "referral_booked" : "new_referral",
            actor_name: actorName,
            actor_id: r.referrer_id || "",
            actor_code: actorCode,
            subject_name: subjectName,
            subject_id: r.referred_patient_id || undefined,
            status: r.referral_status || undefined,
          });
        }
      }

      // Sort all activities by date descending and return top N
      activities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return activities.slice(0, limit);
    },
  });
}

export function filterActivities(
  activities: ActivityItem[] | undefined,
  category: ActivityCategory | "all"
): ActivityItem[] {
  if (!activities) return [];
  if (category === "all") return activities;
  return activities.filter((a) => a.category === category);
}
