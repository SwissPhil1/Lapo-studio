import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase";
import { DataTable, type Column } from "@/modules/admin/components/DataTable";
import { StatusBadge } from "@/modules/admin/components/StatusBadge";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { toNumber } from "@/shared/lib/toNumber";
import { ChevronLeft, Trash2, Lock, CheckCircle, Download, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface BatchCommission {
  id: string;
  created_at: string;
  referrer_id: string | null;
  referrer_first_name: string | null;
  referrer_last_name: string | null;
  referrer_email: string | null;
  referrer_code: string | null;
  referred_name: string | null;
  referred_email: string | null;
  patient_id: string | null;
  booking_id: string | null;
  purchase_amount: number;
  commission_amount: number;
  status: string;
}

export default function PayoutDetail() {
  const { id } = useParams();
  const { t } = useTranslation(["payoutDetail", "common"]);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: batch, refetch: refetchBatch } = useQuery({
    queryKey: ["payout-batch", id],
    queryFn: async () => {
      // Fetch batch details
      const { data: batchData, error: batchError } = await supabase
        .from("commission_batches")
        .select("id, batch_number, notes, status, created_at, closed_at")
        .eq("id", id)
        .single();

      if (batchError) throw batchError;

      // Compute entries count and total amount dynamically
      const { data: entries, error: entriesError } = await supabase
        .from("commission_entries")
        .select("commission_amount")
        .eq("batch_id", id)
        .not("status", "in", '("cancelled","reversed")');

      if (entriesError) throw entriesError;

      const totalAmount = entries.reduce((sum, e) => sum + toNumber(e.commission_amount), 0);

      return {
        ...batchData,
        total_entries: entries.length,
        total_amount: totalAmount,
      };
    },
  });

  const { data: commissions, isLoading, refetch: refetchCommissions } = useQuery({
    queryKey: ["batch-commissions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_entries")
        .select(
          `
          id,
          created_at,
          purchase_amount,
          commission_amount,
          status,
          booking_id,
          referrer_id,
          patient_id,
          referrers!referrer_id(
            referrer_code,
            email,
            patient_id
          )
        `
        )
        .eq("batch_id", id)
        .not("status", "in", '("cancelled","reversed")')
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get referrer patient names
      const referrerPatientIds = data
        ?.map((c: any) => c.referrers?.patient_id)
        .filter(Boolean) || [];
      
      const { data: referrerPatients, error: refPatError } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .in("id", referrerPatientIds);

      if (refPatError) console.error("Error fetching referrer patients:", refPatError);

      const referrerPatientMap = new Map(
        referrerPatients?.map(p => [p.id, { first_name: p.first_name, last_name: p.last_name }]) || []
      );

      // Get referred patient names
      const patientIds = data?.map((c: any) => c.patient_id).filter(Boolean) || [];
      
      const { data: patients, error: patError } = await supabase
        .from("patients")
        .select("id, first_name, last_name, email")
        .in("id", patientIds);

      if (patError) console.error("Error fetching referred patients:", patError);

      const patientMap = new Map(
        patients?.map(p => [p.id, { first_name: p.first_name, last_name: p.last_name, email: p.email }]) || []
      );

      return data.map((c: any) => {
        const referrerPatient = c.referrers?.patient_id 
          ? referrerPatientMap.get(c.referrers.patient_id) 
          : null;
        
        const patient = c.patient_id ? patientMap.get(c.patient_id) : null;

        return {
          id: c.id,
          created_at: c.created_at,
          referrer_id: c.referrer_id,
          referrer_first_name: referrerPatient?.first_name || null,
          referrer_last_name: referrerPatient?.last_name || null,
          referrer_email: c.referrers?.email,
          referrer_code: c.referrers?.referrer_code,
          referred_name:
            patient?.first_name && patient?.last_name
              ? `${patient.first_name} ${patient.last_name}`
              : null,
          referred_email: patient?.email,
          patient_id: c.patient_id,
          booking_id: c.booking_id,
          purchase_amount: toNumber(c.purchase_amount),
          commission_amount: toNumber(c.commission_amount),
          status: c.status,
        };
      }) as BatchCommission[];
    },
  });

  const handleRemoveCommission = async (commissionId: string) => {
    if (!id) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc("remove_commission_from_batch", {
        p_batch_id: id,
        p_commission_id: commissionId,
      });

      if (error) throw error;

      toast.success(t("commissionRemovedSuccess"));
      refetchBatch();
      refetchCommissions();
    } catch (error: any) {
      console.error("Error removing commission:", error);
      toast.error(error.message || t("commissionRemovedError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseBatch = async () => {
    if (!id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc("close_current_payout_batch", {
        p_batch_id: id,
      });

      if (error) throw error;

      toast.success(t("batchClosedSuccess"));
      refetchBatch();
      refetchCommissions();
    } catch (error: any) {
      console.error("Error closing batch:", error);
      toast.error(error.message || t("batchClosedError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMoveToCurrentBatch = async (commissionId: string) => {
    if (!id) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc("move_commission_to_current_batch", {
        p_commission_id: commissionId,
      });

      if (error) throw error;

      toast.success(t("commissionMovedSuccess"));
      refetchBatch();
      refetchCommissions();
    } catch (error: any) {
      console.error("Error moving commission:", error);
      toast.error(error.message || t("commissionMovedError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc("mark_payout_batch_paid", {
        p_batch_id: id,
      });

      if (error) throw error;

      toast.success(t("batchPaidSuccess"));
      refetchBatch();
      refetchCommissions();
    } catch (error: any) {
      console.error("Error marking batch as paid:", error);
      toast.error(error.message || t("batchPaidError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportForBank = async () => {
    if (!id || !commissions?.length) {
      toast.error(t("noData"));
      return;
    }

    try {
      // Fetch full referrer data with bank details
      const referrerIds = [...new Set(commissions.map(c => c.referrer_id).filter(Boolean))];
      
      const { data: referrersData, error: referrersError } = await supabase
        .from("referrers")
        .select("id, email, iban, bank_name, bank_address, patient_id, patients!referrers_patient_id_fkey(first_name, last_name)")
        .in("id", referrerIds);

      if (referrersError) throw referrersError;

      // Create a map of referrer data
      const referrerMap = new Map(
        referrersData?.map((r: any) => [
          r.id,
          {
            firstName: r.patients?.first_name || "",
            lastName: r.patients?.last_name || "",
            email: r.email || "",
            bankName: r.bank_name || "",
            bankAddress: r.bank_address || "",
            iban: r.iban || "",
          },
        ])
      );

      // Aggregate commissions by referrer
      const aggregatedByReferrer = new Map<string, number>();
      commissions.forEach((c) => {
        if (c.referrer_id) {
          const current = aggregatedByReferrer.get(c.referrer_id) || 0;
          aggregatedByReferrer.set(c.referrer_id, current + c.commission_amount);
        }
      });

      // Build CSV rows - one per referrer with total amount
      const rows = Array.from(aggregatedByReferrer.entries()).map(
        ([referrerId, totalAmount]) => {
          const referrer = referrerMap.get(referrerId);
          if (!referrer) return null;

          return [
            referrer.firstName || "",
            referrer.lastName || "",
            referrer.email || "",
            referrer.bankName || "",
            referrer.bankAddress || "",
            referrer.iban || "",
            totalAmount.toFixed(2).replace(".", ","), // French decimal format
          ];
        }
      ).filter(Boolean);

      if (rows.length === 0) {
        toast.error(t("noReferrers"));
        return;
      }

      // CSV headers in French
      const headers = [
        "Prenom",
        "Nom",
        "Email",
        "Banque",
        "Adresse banque",
        "IBAN",
        "Montant (CHF)",
      ];

      // Helper to wrap fields in quotes if they contain semicolon or quotes
      const escapeCsvField = (field: any) => {
        if (field === null || field === undefined) return "";
        const str = String(field);
        if (str.includes(";") || str.includes("\n") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Build CSV content with semicolon delimiter (French Excel)
      const csvContent = [
        headers.map(escapeCsvField).join(";"),
        ...rows.map((row) => row!.map(escapeCsvField).join(";")),
      ].join("\r\n");

      // Add UTF-8 BOM for Excel compatibility
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lapo_payout_batch_${batch?.batch_number || id.substring(0, 8)}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(t("exportSuccess"));
    } catch (error: any) {
      console.error("Error exporting batch:", error);
      toast.error(error.message || t("exportError"));
    }
  };

  const handleExportPDF = async () => {
    if (!id || !commissions?.length) {
      toast.error(t("noData"));
      return;
    }

    try {
      // Fetch full referrer data with bank details
      const referrerIds = [...new Set(commissions.map(c => c.referrer_id).filter(Boolean))];
      
      const { data: referrersData, error: referrersError } = await supabase
        .from("referrers")
        .select("id, email, iban, bank_name, bank_address, patient_id, patients!referrers_patient_id_fkey(first_name, last_name)")
        .in("id", referrerIds);

      if (referrersError) throw referrersError;

      // Create a map of referrer data
      const referrerMap = new Map(
        referrersData?.map((r: any) => [
          r.id,
          {
            firstName: r.patients?.first_name || "",
            lastName: r.patients?.last_name || "",
            email: r.email || "",
            bankName: r.bank_name || "",
            bankAddress: r.bank_address || "",
            iban: r.iban || "",
          },
        ])
      );

      // Aggregate commissions by referrer
      const aggregatedByReferrer = new Map<string, number>();
      commissions.forEach((c) => {
        if (c.referrer_id) {
          const current = aggregatedByReferrer.get(c.referrer_id) || 0;
          aggregatedByReferrer.set(c.referrer_id, current + c.commission_amount);
        }
      });

      if (aggregatedByReferrer.size === 0) {
        toast.error(t("noReferrers"));
        return;
      }

      // Dynamically import jsPDF to reduce initial bundle
      const { default: JsPDF } = await import("jspdf");
      const doc = new JsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Set fonts
      doc.setFont("helvetica");
      
      let yPosition = 25;
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;


      // Header - Apple-style minimal
      doc.setFontSize(24);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(
        `${t("batch")} #${batch?.batch_number || ""}`,
        margin,
        yPosition
      );
      yPosition += 15;

      // Divider line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Process each referrer with minimal cards
      Array.from(aggregatedByReferrer.entries()).forEach(([referrerId, totalAmount], _index) => {
        const referrer = referrerMap.get(referrerId);
        if (!referrer) return;

        // Check if we need a new page
        const estimatedCardHeight = 55;
        if (yPosition + estimatedCardHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = 25;
        }

        // Name in larger bold at top
        const fullName = `${referrer.firstName} ${referrer.lastName}`.trim();
        if (fullName) {
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          doc.text(fullName, margin, yPosition);
          yPosition += 8;
        }

        // Lighter metadata
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);

        // Email
        if (referrer.email) {
          doc.text(referrer.email, margin, yPosition);
          yPosition += 6;
        }

        // Bank name
        if (referrer.bankName) {
          doc.text(referrer.bankName, margin, yPosition);
          yPosition += 6;
        }

        // Bank address
        if (referrer.bankAddress) {
          doc.text(referrer.bankAddress, margin, yPosition);
          yPosition += 6;
        }

        // IBAN in monospace
        if (referrer.iban) {
          doc.setFont("courier", "normal");
          doc.text(referrer.iban, margin, yPosition);
          doc.setFont("helvetica", "normal");
          yPosition += 8;
        }

        // Amount - larger and bold
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(formatCurrency(totalAmount), margin, yPosition);
        yPosition += 10;

        // Subtle divider
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;
      });

      // Save PDF
      const fileName = `lapo_payout_batch_${batch?.batch_number || id.substring(0, 8)}.pdf`;
      doc.save(fileName);

      toast.success(t("exportSuccess"));
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast.error(t("exportError"));
    }
  };

  const canModify = batch?.status === "open" || batch?.status === "current";
  const isClosed = batch?.status === "closed";

  const columns: Column<BatchCommission>[] = [
    ...(canModify || isClosed
      ? [
          {
            key: "actions" as keyof BatchCommission,
            header: "",
            cell: (row: BatchCommission) => (
              <>
                {canModify && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCommission(row.id)}
                    disabled={isUpdating}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
                {isClosed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveToCurrentBatch(row.id)}
                    disabled={isUpdating}
                    title={t("moveToCurrentBatch")}
                  >
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </Button>
                )}
              </>
            ),
          },
        ]
      : []),
    {
      key: "date",
      header: t("date"),
      cell: (row) => (
        <span className="text-sm text-foreground">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: "referrer",
      header: t("referrer"),
      cell: (row) => {
        const fullName = row.referrer_first_name && row.referrer_last_name
          ? `${row.referrer_first_name} ${row.referrer_last_name}`
          : row.referrer_email || "—";
        return (
          <div className="text-sm font-medium text-foreground">{fullName}</div>
        );
      },
    },
    {
      key: "referred",
      header: t("referred"),
      cell: (row) => (
        <div className="text-sm text-foreground">{row.referred_name || "—"}</div>
      ),
    },
    {
      key: "purchase",
      header: t("purchase"),
      cell: (row) => (
        <span className="text-sm text-foreground">
          {formatCurrency(row.purchase_amount)}
        </span>
      ),
    },
    {
      key: "commission",
      header: t("commission"),
      cell: (row) => (
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(row.commission_amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("common:status"),
      cell: (row) => <StatusBadge status={row.status} type="commission" />,
    },
  ];

  return (
    <div className="p-8">
        <Link to="/admin/payouts">
          <Button variant="ghost" size="sm" className="mb-6">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("backToPayouts")}
          </Button>
        </Link>

        {batch && (
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground">
              {batch.batch_number ? `${t("batch")} #${batch.batch_number}` : t("title")}
              {batch.notes && <span className="text-muted-foreground text-xl ml-2">— {batch.notes}</span>}
            </h1>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">{t("totalEntries")}</div>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {batch.total_entries || 0}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">{t("totalAmount")}</div>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {formatCurrency(batch.total_amount || 0)}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="mt-1">
                  <StatusBadge status={batch.status} type="batch" />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">{t("createdPaid")}</div>
                <div className="mt-1 text-sm text-foreground">
                  {formatDate(batch.created_at)}
                  {batch.closed_at && (
                    <>
                      <br />
                      {formatDate(batch.closed_at)}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {batch && (
          <div className="mb-6 flex gap-2">
            {batch.status === "open" || batch.status === "current" ? (
              <Button
                onClick={handleCloseBatch}
                disabled={isUpdating}
              >
                <Lock className="mr-2 h-4 w-4" />
                {t("closeBatch")}
              </Button>
            ) : null}
            {batch.status === "closed" ? (
              <Button
                onClick={handleMarkAsPaid}
                disabled={isUpdating}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {t("markAsPaid")}
              </Button>
            ) : null}
            <Button
              onClick={handleExportForBank}
              variant="outline"
              disabled={isUpdating || !commissions?.length}
            >
              <Download className="mr-2 h-4 w-4" />
              {t("exportForBank")}
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              disabled={isUpdating || !commissions?.length}
            >
              <FileText className="mr-2 h-4 w-4" />
              {t("exportForBankPdf")}
            </Button>
          </div>
        )}

        <DataTable data={commissions || []} columns={columns} loading={isLoading} />
      </div>
  );
}
