import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/shared/lib/supabase";
import { DataTable, type Column } from "@/modules/admin/components/DataTable";
import { StatusBadge } from "@/modules/admin/components/StatusBadge";
import { KPICard } from "@/modules/admin/components/KPICard";
import { EmptyState } from "@/modules/admin/components/EmptyState";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { toNumber } from "@/shared/lib/toNumber";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Download, Package, CheckCircle } from "lucide-react";
import { checkPayoutProfileStatus } from "@/shared/lib/payoutProfile";
import { toast } from "sonner";

interface PayoutBatch {
  id: string;
  batch_number: number | null;
  notes: string | null;
  status: string;
  total_amount: number | null;
  entries_count: number;
  created_at: string;
  closed_at: string | null;
}


export default function Payouts() {
  const { t } = useTranslation(["payouts", "common"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Auto-sync current batch on page load
  useEffect(() => {
    const syncBatch = async () => {
      try {
        const { error } = await supabase.rpc("sync_current_payout_batch");
        if (error) {
          console.error("Error syncing batch:", error);
        } else {
          // Refresh queries after sync
          queryClient.invalidateQueries({ queryKey: ["current-batch"] });
          queryClient.invalidateQueries({ queryKey: ["payout-batches"] });
          queryClient.invalidateQueries({ queryKey: ["payable-commissions-check"] });
        }
      } catch (err) {
        console.error("Sync error:", err);
      }
    };

    syncBatch();
  }, [queryClient]);

  // Get current batch
  const { data: currentBatch } = useQuery({
    queryKey: ["current-batch"],
    queryFn: async () => {
      const { data: batchData, error: batchError } = await supabase
        .from("commission_batches")
        .select("id, batch_number, notes, status, total_amount, created_at, closed_at, is_current")
        .eq("is_current", true)
        .eq("status", "open")
        .single();

      if (batchError) {
        if (batchError.code === "PGRST116") return null; // No rows returned
        throw batchError;
      }

      const { count, error: countError } = await supabase
        .from("commission_entries")
        .select("*", { count: "exact", head: true })
        .eq("batch_id", batchData.id)
        .not("status", "in", '("cancelled","reversed")');

      if (countError) console.error("Error counting entries:", countError);

      return {
        id: batchData.id,
        batch_number: batchData.batch_number,
        notes: batchData.notes,
        status: batchData.status,
        total_amount: toNumber(batchData.total_amount),
        entries_count: count || 0,
        created_at: batchData.created_at,
        closed_at: batchData.closed_at,
      };
    },
  });

  const { data: batches, isLoading } = useQuery({
    queryKey: ["payout-batches"],
    queryFn: async () => {
      const { data: batchData, error: batchError } = await supabase
        .from("commission_batches")
        .select("id, batch_number, notes, status, total_amount, created_at, closed_at, is_current")
        .order("batch_number", { ascending: false });

      if (batchError) throw batchError;

      // Compute entries count dynamically for each batch
      const batchesWithCounts = await Promise.all(
        (batchData || []).map(async (b: any) => {
          const { count, error: countError } = await supabase
            .from("commission_entries")
            .select("*", { count: "exact", head: true })
            .eq("batch_id", b.id)
            .not("status", "in", '("cancelled","reversed")');

          if (countError) console.error("Error counting entries:", countError);

          return {
            id: b.id,
            batch_number: b.batch_number,
            notes: b.notes,
            status: b.status,
            total_amount: toNumber(b.total_amount),
            entries_count: count || 0,
            created_at: b.created_at,
            closed_at: b.closed_at,
          };
        })
      );

      return batchesWithCounts as PayoutBatch[];
    },
  });

  // Check for payable commissions without batch
  const { data: _payableCommissions } = useQuery({
    queryKey: ["payable-commissions-check"],
    queryFn: async () => {
      const { data: commissions } = await supabase
        .from("commission_entries")
        .select("id, referrer_id, batch_id")
        .eq("status", "pending")
        .is("batch_id", null);

      if (!commissions?.length) return [];

      // Check each referrer's payout profile
      const payable: any[] = [];
      const referrerIds = [...new Set(commissions.map(c => c.referrer_id).filter(Boolean))];
      
      await Promise.all(
        referrerIds.map(async (referrerId) => {
          if (!referrerId) return;
          const status = await checkPayoutProfileStatus(referrerId);
          if (status.isComplete) {
            const commissionsForReferrer = commissions.filter(c => c.referrer_id === referrerId);
            payable.push(...commissionsForReferrer);
          }
        })
      );
      
      return payable;
    },
  });

  // Filtered and searched batches
  const filteredBatches = useMemo(() => {
    if (!batches) return [];

    let filtered = batches;

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.notes?.toLowerCase().includes(query) ||
          formatDate(b.created_at).toLowerCase().includes(query) ||
          (b.batch_number && `batch #${b.batch_number}`.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [batches, searchQuery]);

  // Total paid out (all time)
  const totalPaidOut = useMemo(() => {
    if (!batches) return 0;
    const closedBatches = batches.filter((b) => b.status === "closed" || b.status === "paid");
    return closedBatches.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  }, [batches]);

  // Export to CSV
  const handleExport = () => {
    if (!filteredBatches.length) return;

    const headers = [
      "batch_number",
      "label",
      "entries",
      "total_amount",
      "status",
      "created_at",
      "paid_at",
      "batch_id",
    ];
    const rows = filteredBatches.map((b) => [
      b.batch_number || "",
      b.notes || "",
      b.entries_count,
      b.total_amount || 0,
      b.status,
      b.created_at,
      b.closed_at || "",
      b.id,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-batches-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCloseCurrentBatch = async () => {
    if (!currentBatch) return;
    
    setIsClosing(true);
    try {
      const { data, error } = await supabase.rpc("close_current_payout_batch", {
        p_batch_id: currentBatch.id,
      });

      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);

      // Sync the new current batch with eligible commissions
      await supabase.rpc("sync_current_payout_batch");

      toast.success(t("currentBatchClosed"));
      await queryClient.invalidateQueries({ queryKey: ["payout-batches"] });
      await queryClient.invalidateQueries({ queryKey: ["current-batch"] });
      await queryClient.invalidateQueries({ queryKey: ["commissions"] });
      await queryClient.invalidateQueries({ queryKey: ["payable-commissions-check"] });
      
      setShowCloseDialog(false);
    } catch (error: any) {
      console.error("Error closing current batch:", error);
      toast.error(t("closeCurrentBatchError"));
    } finally {
      setIsClosing(false);
    }
  };


  const columns: Column<PayoutBatch>[] = [
    {
      key: "id",
      header: t("batch"),
      cell: (row) => (
        <span className="font-mono text-sm font-semibold text-foreground">
          {row.batch_number ? `Batch #${row.batch_number}` : `${row.id.substring(0, 8)}...`}
        </span>
      ),
    },
    {
      key: "label",
      header: t("label"),
      cell: (row) => (
        <span className="text-sm text-foreground">{row.notes || "—"}</span>
      ),
    },
    {
      key: "entries",
      header: t("entries"),
      cell: (row) => (
        <span className="text-sm text-foreground">{row.entries_count}</span>
      ),
    },
    {
      key: "amount",
      header: t("totalAmount"),
      cell: (row) => (
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(row.total_amount || 0)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("common:status"),
      cell: (row) => <StatusBadge status={row.status} type="batch" />,
    },
    {
      key: "created",
      header: t("created"),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: "paid",
      header: t("paid"),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.closed_at ? formatDate(row.closed_at) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* Current Batch and Total Paid Out in One Row */}
        {currentBatch && (
          <div className="mb-6 flex gap-4">
            {/* Current Batch Section - 80% */}
            <div 
              className="flex-[4] p-6 border border-primary/20 rounded-lg bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => navigate(`/admin/payouts/${currentBatch.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Package className="h-6 w-6 text-primary" />
                  <div>
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-xl font-semibold text-foreground">
                        {t("currentBatch")} #{currentBatch.batch_number}
                      </h2>
                      <span className="text-sm text-muted-foreground">
                        {currentBatch.entries_count} {currentBatch.entries_count === 1 ? t('common:entry') : t('common:entries')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-2xl font-semibold text-foreground">
                        {formatCurrency(currentBatch.total_amount || 0)}
                      </p>
                      <span className="text-sm text-muted-foreground">
                        {currentBatch.notes}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCloseDialog(true);
                  }}
                  disabled={currentBatch.entries_count === 0 || isClosing}
                >
                  {t("closeCurrentBatch")}
                </Button>
              </div>
            </div>

            {/* Total Paid Out KPI - 20% */}
            <div className="flex-1">
              <KPICard
                title={t("closedAmountAllTime")}
                value={formatCurrency(totalPaidOut)}
                icon={CheckCircle}
                loading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Search and Export */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!filteredBatches.length}>
            <Download className="mr-2 h-4 w-4" />
            {t("exportCsv")}
          </Button>
        </div>

        {/* Table */}
        {!isLoading && filteredBatches.length === 0 ? (
          <EmptyState
            title={t("common:emptyState.noPayouts")}
            description={t("common:emptyState.noPayoutsDesc")}
            icon={Package}
          />
        ) : (
          <DataTable
            data={filteredBatches}
            columns={columns}
            loading={isLoading}
            onRowClick={(row) => navigate(`/admin/payouts/${row.id}`)}
          />
        )}

        {/* Close Batch Confirmation Dialog */}
        <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("confirmCloseTitle")}</DialogTitle>
              <DialogDescription>
                {t("confirmCloseDescription", { 
                  batchNumber: currentBatch?.batch_number,
                  count: currentBatch?.entries_count 
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCloseDialog(false)}
                disabled={isClosing}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="default"
                onClick={handleCloseCurrentBatch}
                disabled={isClosing}
              >
                {isClosing ? t("closing") : t("confirmClose")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
