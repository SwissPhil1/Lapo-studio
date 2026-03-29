import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/shared/lib/supabase";
import { DataTable, Column } from "@/modules/admin/components/DataTable";
import { StatusBadge } from "@/modules/admin/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, Plus, Trash2, Send, Gift } from "lucide-react";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { toNumber } from "@/shared/lib/toNumber";
import { toast } from "sonner";
import { PayoutProfileIndicator } from "@/modules/admin/components/PayoutProfileIndicator";
import { checkPayoutProfileStatus, formatMissingFields } from "@/shared/lib/payoutProfile";
import { KPICard } from "@/modules/admin/components/KPICard";
import { DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { differenceInDays } from "date-fns";

interface Commission {
  id: string;
  referrer_id: string | null;
  referrer_email: string | null;
  referrer_code: string | null;
  referrer_name: string | null;
  last_reminder_sent: string | null;
  referred_name: string | null;
  referred_email: string | null;
  booking_id: string | null;
  purchase_amount: number;
  commission_amount: number;
  commission_rate: number | null;
  purchase_type: string | null;
  status: string;
  batch_id: string | null;
  excluded_from_current_batch: boolean;
  batch_number: number | null;
  created_at: string;
  paid_at: string | null;
  referral_id: string | null;
  auto_payout_enabled: boolean | null;
  auto_payout_paused_at: string | null;
}

type StatusFilter = "pending" | "blocked" | "held" | "all";

export default function Commissions() {
  const { t } = useTranslation("commissions");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddToBatchDialog, setShowAddToBatchDialog] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [commissionToRemove, setCommissionToRemove] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Check for highlighted commission from dashboard
  useEffect(() => {
    const id = sessionStorage.getItem('highlightCommissionId');
    if (id) {
      setHighlightedId(id);
      setStatusFilter('all'); // Switch to "All" tab to show the commission
      sessionStorage.removeItem('highlightCommissionId');
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedId(null), 3000);
    }
  }, []);

  // Sync current batch on mount and when switching to Payables tab
  const { refetch: syncCurrentBatch } = useQuery({
    queryKey: ["sync-current-batch"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("sync_current_payout_batch");
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  useEffect(() => {
    if (statusFilter === "pending") {
      syncCurrentBatch();
    }
  }, [statusFilter, syncCurrentBatch]);

  // Get current batch
  const { data: currentBatch } = useQuery({
    queryKey: ["current-batch"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_batches")
        .select("id, batch_number, notes")
        .eq("is_current", true)
        .eq("status", "open")
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    },
  });

  // Fetch commissions
  const { data: commissions, isLoading, refetch } = useQuery({
    queryKey: ["commissions", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("commission_entries")
        .select(
          `
          id,
          referrer_id,
          booking_id,
          purchase_amount,
          commission_amount,
          commission_rate,
          purchase_type,
          status,
          batch_id,
          excluded_from_current_batch,
          created_at,
          paid_at,
          commission_batches!commission_entries_batch_id_fkey (batch_number)
        `
        )
        .order("created_at", { ascending: false });

      // Fetch pending commissions for "pending" and "blocked" tabs
      // For "all" tab, fetch all commissions regardless of status
      if (statusFilter !== "all") {
        query = query.eq("status", "pending");
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich commissions with referrer/referral data
      const referrerIds = [...new Set(data?.map((c) => c.referrer_id).filter(Boolean))];
      const { data: referrerProfiles } = await supabase
        .from("referrers")
        .select("id, email, referrer_code, patient_id, auto_payout_enabled, auto_payout_paused_at")
        .in("id", referrerIds);

      // Fetch patient data for referrers
      const patientIdsForReferrers = referrerProfiles?.map(r => r.patient_id).filter(Boolean) || [];
      const { data: referrerPatients } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .in("id", patientIdsForReferrers);

      const referrerPatientMap = referrerPatients?.reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      // Fetch last reminder sent dates
      const { data: reminderData } = await supabase
        .from("referrer_notifications")
        .select("referrer_id, created_at")
        .in("referrer_id", referrerIds)
        .eq("type", "payout_profile_reminder")
        .order("created_at", { ascending: false });

      const lastReminderMap = reminderData?.reduce((acc: any, r: any) => {
        if (!acc[r.referrer_id]) {
          acc[r.referrer_id] = r.created_at;
        }
        return acc;
      }, {});

      const referrerMap = referrerProfiles?.reduce((acc: any, profile: any) => {
        acc[profile.id] = {
          ...profile,
          patient: referrerPatientMap?.[profile.patient_id],
          last_reminder_sent: lastReminderMap?.[profile.id] || null,
        };
        return acc;
      }, {});

      // Fetch bookings to get patient_ids
      const bookingIds = [...new Set(data?.map((c) => c.booking_id).filter(Boolean))];
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id, patient_id")
        .in("id", bookingIds);

      const bookingMap = bookingsData?.reduce((acc: any, b: any) => {
        acc[b.id] = b;
        return acc;
      }, {});

      // Fetch referrals by patient_id (referred_patient_id)
      const patientIdsFromBookings = [...new Set(bookingsData?.map((b) => b.patient_id).filter(Boolean))];
      const { data: referralData } = await supabase
        .from("referrals")
        .select("id, referred_patient_id")
        .in("referred_patient_id", patientIdsFromBookings);

      const referralByPatientMap = referralData?.reduce((acc: any, ref: any) => {
        acc[ref.referred_patient_id] = ref;
        return acc;
      }, {});

      // Batch fetch referred patient data
      const patientIds = [...new Set(patientIdsFromBookings)];
      const { data: patientData } = await supabase
        .from("patients")
        .select("id, first_name, last_name, email")
        .in("id", patientIds);

      const patientMap = patientData?.reduce((acc: any, patient: any) => {
        acc[patient.id] = patient;
        return acc;
      }, {});

      const commissionsWithReferrals = (data || []).map((c: any) => {
        const booking = bookingMap?.[c.booking_id];
        const patientId = booking?.patient_id;
        const patient = patientId ? patientMap?.[patientId] : null;
        const referral = patientId ? referralByPatientMap?.[patientId] : null;
        const referrerProfile = referrerMap?.[c.referrer_id];
        const referrerPatient = referrerProfile?.patient;
        const referrerName = referrerPatient ? `${referrerPatient.first_name} ${referrerPatient.last_name}` : null;

        return {
          id: c.id,
          referrer_id: c.referrer_id,
          referrer_email: referrerProfile?.email || null,
          referrer_code: referrerProfile?.referrer_code || null,
          referrer_name: referrerName,
          last_reminder_sent: referrerProfile?.last_reminder_sent || null,
          referred_name: patient ? `${patient.first_name} ${patient.last_name}` : null,
          referred_email: patient?.email || null,
          booking_id: c.booking_id,
          purchase_amount: toNumber(c.purchase_amount),
          commission_amount: toNumber(c.commission_amount),
          commission_rate: c.commission_rate ? toNumber(c.commission_rate) : null,
          purchase_type: c.purchase_type,
          status: c.status,
          batch_id: c.batch_id,
          excluded_from_current_batch: c.excluded_from_current_batch || false,
          batch_number: c.commission_batches?.batch_number || null,
          created_at: c.created_at,
          paid_at: c.paid_at,
          referral_id: referral?.id || null,
          auto_payout_enabled: referrerProfile?.auto_payout_enabled ?? true,
          auto_payout_paused_at: referrerProfile?.auto_payout_paused_at || null,
        };
      });

      return commissionsWithReferrals as Commission[];
    },
  });

  // Stable list of referrer IDs for query key
  const referrerIds = useMemo(() => {
    if (!commissions?.length) return [];
    return [...new Set(commissions.map(c => c.referrer_id).filter(Boolean))];
  }, [commissions]);

  // Check payout profile status for each referrer (with missing fields)
  const { data: payoutStatuses } = useQuery({
    queryKey: ["payout-statuses", referrerIds.join(",")],
    queryFn: async () => {
      if (!referrerIds.length) return {};
      
      const statuses: Record<string, { isComplete: boolean; missingFields: string[] }> = {};
      
      await Promise.all(
        referrerIds.map(async (referrerId) => {
          if (!referrerId) return;
          const status = await checkPayoutProfileStatus(referrerId);
          statuses[referrerId] = {
            isComplete: status.isComplete,
            missingFields: status.missingFields,
          };
        })
      );
      
      return statuses;
    },
    enabled: referrerIds.length > 0,
  });

  // Split payable commissions into current batch and excluded (excluding held for LAPO Cash)
  const commissionsInCurrentBatch = useMemo(() => {
    if (!commissions || !currentBatch) return [];
    return commissions.filter((c) => c.batch_id === currentBatch.id && c.auto_payout_enabled !== false);
  }, [commissions, currentBatch]);

  const excludedCommissions = useMemo(() => {
    if (!commissions || !payoutStatuses) return [];
    return commissions.filter((c) => {
      if (!c.referrer_id) return false;
      const status = payoutStatuses[c.referrer_id];
      return (
        c.status === "pending" &&
        !c.batch_id &&
        status?.isComplete &&
        c.excluded_from_current_batch &&
        c.auto_payout_enabled !== false
      );
    });
  }, [commissions, payoutStatuses]);

  const eligibleNotInBatch = useMemo(() => {
    if (!commissions || !payoutStatuses) return [];
    return commissions.filter((c) => {
      if (!c.referrer_id) return false;
      const status = payoutStatuses[c.referrer_id];
      return (
        c.status === "pending" &&
        !c.batch_id &&
        status?.isComplete &&
        !c.excluded_from_current_batch &&
        c.auto_payout_enabled !== false
      );
    });
  }, [commissions, payoutStatuses]);

  // Combine commissions in current batch + eligible not yet added for display
  const commissionsToDisplay = useMemo(() => {
    return [...commissionsInCurrentBatch, ...eligibleNotInBatch];
  }, [commissionsInCurrentBatch, eligibleNotInBatch]);

  // All payable commissions for KPI totals
  const payableCommissions = useMemo(() => {
    return [...commissionsInCurrentBatch, ...excludedCommissions, ...eligibleNotInBatch];
  }, [commissionsInCurrentBatch, excludedCommissions, eligibleNotInBatch]);

  const blockedCommissions = useMemo(() => {
    if (!commissions) return [];
    if (!payoutStatuses) return [];
    
    return commissions.filter((c) => {
      if (!c.referrer_id) return false;
      const status = payoutStatuses[c.referrer_id];
      // Commission is blocked if it's pending, not in a batch, payout profile is incomplete, AND auto_payout is enabled
      return c.status === "pending" && !c.batch_id && !status?.isComplete && c.auto_payout_enabled !== false;
    });
  }, [commissions, payoutStatuses]);

  // Held for LAPO Cash conversion - referrers with auto_payout disabled
  // Include ALL pending commissions with auto_payout_enabled = false, even if they have a batch_id
  const heldForLapoCashCommissions = useMemo(() => {
    if (!commissions) return [];
    return commissions.filter((c) => {
      return c.status === "pending" && c.auto_payout_enabled === false;
    });
  }, [commissions]);

  // Apply search filter
  const filteredPayables = useMemo(() => {
    return payableCommissions?.filter(
      (c) =>
        c.referrer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.referrer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.referred_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [payableCommissions, searchTerm]);

  const filteredBlocked = useMemo(() => {
    return blockedCommissions?.filter(
      (c) =>
        c.referrer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.referrer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.referred_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [blockedCommissions, searchTerm]);

  const filteredAll = useMemo(() => {
    return commissions?.filter(
      (c) =>
        c.referrer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.referrer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.referred_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [commissions, searchTerm]);


  const handleAddToCurrentBatch = async (commissionId: string) => {
    setIsAdding(true);
    try {
      // Simply unmark as excluded and call sync to add to current batch
      const { error: updateError } = await supabase
        .from("commission_entries")
        .update({ excluded_from_current_batch: false })
        .eq("id", commissionId);
      
      if (updateError) throw updateError;

      // Sync to add to current batch
      await syncCurrentBatch();

      toast.success(t("addedToCurrentBatch"));
      await queryClient.invalidateQueries({ queryKey: ["commissions"] });
      await queryClient.invalidateQueries({ queryKey: ["current-batch"] });
    } catch (error: any) {
      console.error("Error adding to current batch:", error);
      toast.error(t("addToCurrentBatchError"));
    } finally {
      setIsAdding(false);
    }
  };

  const confirmRemoveFromBatch = (commissionId: string) => {
    setCommissionToRemove(commissionId);
    setShowRemoveDialog(true);
  };

  const handleRemoveFromCurrentBatch = async () => {
    if (!commissionToRemove) return;
    
    setIsRemoving(true);
    try {
      // Find the commission to check if it's already in a batch
      const commission = commissions?.find(c => c.id === commissionToRemove);
      
      if (!commission) throw new Error("Commission not found");
      
      if (commission.batch_id) {
        // Commission is in a batch, use RPC to remove it
        const { data, error } = await supabase.rpc("remove_commission_from_current_batch", {
          p_commission_id: commissionToRemove,
        });

        if (error) throw error;
        const result = data as any;
        if (!result.success) throw new Error(result.error);
      } else {
        // Commission not in batch yet, just mark as excluded
        const { error } = await supabase
          .from("commission_entries")
          .update({ excluded_from_current_batch: true })
          .eq("id", commissionToRemove);
        
        if (error) throw error;
      }

      toast.success(t("removedFromCurrentBatch"));
      await queryClient.invalidateQueries({ queryKey: ["commissions"] });
      await queryClient.invalidateQueries({ queryKey: ["current-batch"] });
      setShowRemoveDialog(false);
      setCommissionToRemove(null);
    } catch (error: any) {
      console.error("Error removing from current batch:", error);
      toast.error(t("removeFromCurrentBatchError"));
    } finally {
      setIsRemoving(false);
    }
  };

  const currentBatchColumns: Column<Commission>[] = [
    {
      key: "date",
      header: t("date"),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("amount"),
      cell: (row) => (
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(row.commission_amount)}
        </span>
      ),
    },
    {
      key: "rate",
      header: t("rate"),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.commission_rate ? `${row.commission_rate}%` : "—"}
        </span>
      ),
    },
    {
      key: "action",
      header: t("action"),
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            confirmRemoveFromBatch(row.id);
          }}
          disabled={isRemoving}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t("removeFromBatch")}
        </Button>
      ),
    },
  ];

  const excludedColumns: Column<Commission>[] = [
    {
      key: "date",
      header: t("date"),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("amount"),
      cell: (row) => (
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(row.commission_amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: () => (
        <Badge variant="secondary" className="text-xs">
          {t("excludedFromBatch")}
        </Badge>
      ),
    },
    {
      key: "action",
      header: t("action"),
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCurrentBatch(row.id);
          }}
          disabled={isAdding}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("addToBatch")}
        </Button>
      ),
    },
  ];

  const handleSendReminder = async (referrerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc("send_payout_reminder", {
        p_referrer_id: referrerId,
      });

      if (error) {
        if (error.message.includes("7 days")) {
          toast.error(t("reminderRateLimit", { ns: "referrerDetail" }));
        } else {
          throw error;
        }
      } else {
        toast.success(t("reminderSuccess", { ns: "referrerDetail" }));
        await queryClient.invalidateQueries({ queryKey: ["commissions"] });
      }
    } catch (error: any) {
      console.error("Error sending reminder:", error);
      toast.error(t("reminderError", { ns: "referrerDetail" }));
    }
  };

  const canSendReminder = (lastReminderSent: string | null): boolean => {
    if (!lastReminderSent) return true;
    const daysSinceLastReminder = differenceInDays(new Date(), new Date(lastReminderSent));
    return daysSinceLastReminder >= 7;
  };

  const blockedColumns: Column<Commission>[] = [
    {
      key: "date",
      header: t("date"),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "referrer",
      header: t("referrer"),
      cell: (row) => (
        row.referrer_name && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (row.referrer_id) navigate(`/admin/referrers/${row.referrer_id}`);
            }}
            className="text-sm font-medium text-primary hover:underline text-left"
          >
            {row.referrer_name}
          </button>
        )
      ),
    },
    {
      key: "amount",
      header: t("amount"),
      cell: (row) => (
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(row.commission_amount)}
        </span>
      ),
    },
    {
      key: "blockingReason",
      header: t("blockingReason"),
      cell: (row) => {
        if (!row.referrer_id) return <span className="text-sm text-muted-foreground">—</span>;
        const status = payoutStatuses?.[row.referrer_id];
        if (!status || status.isComplete) return <span className="text-sm text-muted-foreground">—</span>;
        
        const formatted = formatMissingFields(status.missingFields);
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{formatted}</span>
          </div>
        );
      },
    },
    {
      key: "action",
      header: t("action"),
      cell: (row) => {
        if (!row.referrer_id) return null;
        const canSend = canSendReminder(row.last_reminder_sent);
        
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleSendReminder(row.referrer_id!, e)}
            disabled={!canSend}
            className={!canSend ? "opacity-40" : ""}
          >
            <Send className="h-4 w-4 mr-2" />
            {t("sendReminder", { ns: "referrerDetail" })}
          </Button>
        );
      },
    },
  ];

  const handleRemoveFromHeldBatch = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from("commission_entries")
        .update({ batch_id: null, excluded_from_current_batch: true })
        .eq("id", commissionId);

      if (error) throw error;

      toast.success(t("removedFromBatch"));
      await queryClient.invalidateQueries({ queryKey: ["commissions"] });
      await queryClient.invalidateQueries({ queryKey: ["current-batch"] });
    } catch (error: unknown) {
      console.error("Error removing from batch:", error);
      toast.error(t("removeFromCurrentBatchError"));
    }
  };

  const heldColumns: Column<Commission>[] = [
    {
      key: "date",
      header: t("date"),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "referrer",
      header: t("referrer"),
      cell: (row) => (
        row.referrer_name && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (row.referrer_id) navigate(`/admin/referrers/${row.referrer_id}`);
            }}
            className="text-sm font-medium text-primary hover:underline text-left"
          >
            {row.referrer_name}
          </button>
        )
      ),
    },
    {
      key: "amount",
      header: t("amount"),
      cell: (row) => (
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(row.commission_amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <Gift className="h-3 w-3 mr-1" />
            {t("heldReason")}
          </Badge>
          {row.batch_id && (
            <Badge variant="outline" className="text-xs">
              Lot #{row.batch_number}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "pausedSince",
      header: t("pausedSince"),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.auto_payout_paused_at ? formatDate(row.auto_payout_paused_at) : "—"}
        </span>
      ),
    },
    {
      key: "action",
      header: t("action"),
      cell: (row) => {
        if (!row.batch_id) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFromHeldBatch(row.id);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("removeFromBatch")}
          </Button>
        );
      },
    },
  ];

  const allCommissionsColumns: Column<Commission>[] = [
    {
      key: "created_at",
      header: t("date"),
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "referrer_name",
      header: t("referrerName"),
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-medium text-foreground">
          {row.referrer_name || "—"}
        </span>
      ),
    },
    {
      key: "referred_name",
      header: t("patientName"),
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-foreground">
          {row.referred_name || "—"}
        </span>
      ),
    },
    {
      key: "purchase_amount",
      header: t("serviceValue"),
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-foreground text-right block">
          {formatCurrency(row.purchase_amount)}
        </span>
      ),
    },
    {
      key: "commission_amount",
      header: t("commissionAmount"),
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-semibold text-foreground text-right block">
          {formatCurrency(row.commission_amount)}
        </span>
      ),
    },
    {
      key: "commission_rate",
      header: t("rate"),
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.commission_rate ? `${row.commission_rate}%` : "—"}
        </span>
      ),
    },
    {
      key: "purchase_type",
      header: t("type"),
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.purchase_type === "first_purchase" || row.purchase_type === "first" ? "F" : row.purchase_type === "repeat_purchase" || row.purchase_type === "repeat" ? "R" : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      sortable: true,
      cell: (row) => (
        <StatusBadge type="commission" status={row.status} />
      ),
    },
    {
      key: "batch_number",
      header: t("batch"),
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.batch_number ? `#${row.batch_number}` : "—"}
        </span>
      ),
    },
    {
      key: "paid_at",
      header: t("paidDate"),
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.paid_at ? formatDate(row.paid_at) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("description")}</p>
        </div>

        {/* KPI Cards - Always Visible */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title={t("payablesCount", { count: payableCommissions.length })}
            value={formatCurrency(
              payableCommissions.reduce((sum, c) => sum + c.commission_amount, 0)
            )}
            icon={DollarSign}
            loading={isLoading}
          />
          <KPICard
            title={t("blockedCount", { count: blockedCommissions.length })}
            value={formatCurrency(
              blockedCommissions.reduce((sum, c) => sum + c.commission_amount, 0)
            )}
            icon={DollarSign}
            loading={isLoading}
          />
          <KPICard
            title={t("heldCount", { count: heldForLapoCashCommissions.length })}
            value={formatCurrency(
              heldForLapoCashCommissions.reduce((sum, c) => sum + c.commission_amount, 0)
            )}
            icon={Gift}
            loading={isLoading}
          />
        </div>

        {/* Tabs */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">{t("payables")}</TabsTrigger>
            <TabsTrigger value="blocked">{t("blocked")}</TabsTrigger>
            <TabsTrigger value="held">{t("heldForLapoCash")}</TabsTrigger>
            <TabsTrigger value="all">{t("allCommissions")}</TabsTrigger>
          </TabsList>

          {/* Payables Tab Content */}
          {statusFilter === "pending" && (
            <TabsContent value="pending">

              {/* Section A: Dans le lot courant (In Current Batch + Auto-added) */}
              {commissionsToDisplay.length > 0 && (
                <div className="mb-8">
                  <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t("inCurrentBatch")}
                    </h3>
                    {currentBatch && (
                      <Badge variant="default">
                        {t("batchNumber")} {currentBatch.batch_number}
                      </Badge>
                    )}
                  </div>
                  <DataTable
                    data={commissionsToDisplay}
                    columns={currentBatchColumns}
                    loading={isLoading}
                    onRowClick={(row) => row.referral_id && navigate(`/admin/referrals/${row.referral_id}`)}
                  />
                </div>
              )}

              {/* Section B: Retirée du lot (Removed from Batch) - Only show if not empty */}
              {excludedCommissions.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-foreground">
                    {t("excludedFromCurrentBatch")}
                  </h3>
                  <DataTable
                    data={excludedCommissions}
                    columns={excludedColumns}
                    loading={isLoading}
                    onRowClick={(row) => row.referral_id && navigate(`/admin/referrals/${row.referral_id}`)}
                  />
                </div>
              )}

              {/* Empty state */}
              {commissionsToDisplay.length === 0 && excludedCommissions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {t("noPayableCommissions")}
                </div>
              )}
            </TabsContent>
          )}

          {/* Blocked Tab Content */}
          {statusFilter === "blocked" && (
            <TabsContent value="blocked">
              <DataTable
                data={filteredBlocked}
                columns={blockedColumns}
                loading={isLoading}
                onRowClick={(row) => row.referral_id && navigate(`/admin/referrals/${row.referral_id}`)}
              />
            </TabsContent>
          )}

          {/* Held for LAPO Cash Tab Content */}
          {statusFilter === "held" && (
            <TabsContent value="held">
              <DataTable
                data={heldForLapoCashCommissions}
                columns={heldColumns}
                loading={isLoading}
                onRowClick={(row) => row.referrer_id && navigate(`/admin/referrers/${row.referrer_id}`)}
              />
            </TabsContent>
          )}

          {/* All Commissions Tab Content */}
          {statusFilter === "all" && (
            <TabsContent value="all">
              {/* Search Bar */}
              <div className="mb-6 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <DataTable
                data={filteredAll || []}
                columns={allCommissionsColumns}
                loading={isLoading}
                onRowClick={(row) => row.referral_id && navigate(`/admin/referrals/${row.referral_id}`)}
                rowClassName={(row) => row.id === highlightedId ? "bg-primary/20 animate-pulse" : ""}
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Remove Confirmation Dialog */}
        <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("confirmRemoveTitle")}</DialogTitle>
              <DialogDescription>
                {t("confirmRemoveDescription")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRemoveDialog(false);
                  setCommissionToRemove(null);
                }}
                disabled={isRemoving}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveFromCurrentBatch}
                disabled={isRemoving}
              >
                {isRemoving ? t("removing") : t("confirmRemove")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
