import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { DataTable, type Column } from "@/modules/admin/components/DataTable";
import { EmptyState } from "@/modules/admin/components/EmptyState";
import { ActivityLegend } from "@/modules/admin/components/ActivityLegend";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { useNavigate } from "react-router-dom";
import { ReferrerActivityDot } from "@/modules/admin/components/ReferrerActivityDot";
import { getReferrerActivityStatus } from "@/shared/lib/referrerActivity";
import { useTranslation } from "react-i18next";
import { getTierBadgeStyles } from "@/shared/lib/referrerTierBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReferrerPerformance {
  referrer_id: string;
  referrer_email: string;
  referrer_code: string;
  referrer_name: string;
  referrer_first_name: string | null;
  referrer_last_name: string | null;
  company_name: string | null;
  referrer_type_code: string | null;
  referrer_type_name: string | null;
  first_purchase_rate: number | null;
  repeat_purchase_rate: number | null;
  total_referrals: number;
  booked_referrals: number;
  confirmed_referrals: number;
  total_commissions: number;
  total_revenue: number;
  last_referral_at: string | null;
  created_at: string;
}

export default function Referrers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation(['referrers', 'common']);

  const { data: referrers, isLoading } = useQuery({
    queryKey: ["referrers-performance"],
    queryFn: async () => {
      // First get referrer performance data
      const { data: perfData, error: perfError } = await supabase
        .from("v_referrer_performance")
        .select("*")
        .order("total_commissions", { ascending: false });

      if (perfError) throw perfError;
      if (!perfData) return [];

      // Get referrer type names, rates, created_at, and patient info
      const referrerIds = perfData.map(r => r.referrer_id);
      const { data: referrerData, error: refError } = await supabase
        .from("referrers")
        .select(`
          id,
          created_at,
          email,
          referrer_code,
          patient_id,
          referrer_types!referrers_referrer_type_id_fkey(
            code,
            name,
            first_purchase_rate,
            repeat_purchase_rate
          )
        `)
        .in("id", referrerIds);

      if (refError) throw refError;

      // Get patient names for all referrers
      const patientIds = referrerData?.map(r => r.patient_id).filter(Boolean) || [];
      const { data: patientData } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .in("id", patientIds);

      const patientMap = new Map(
        patientData?.map(p => [p.id, { first_name: p.first_name, last_name: p.last_name }]) || []
      );

      // Get total revenue for each referrer
      const referrerCodes = referrerData?.map(r => r.referrer_code).filter(Boolean) || [];
      const { data: revenueData } = await supabase
        .from("bookings")
        .select("referrer_code, booking_value")
        .in("referrer_code", referrerCodes)
        .eq("is_test", false);

      const revenueMap = new Map<string, number>();
      revenueData?.forEach(booking => {
        if (booking.referrer_code) {
          const current = revenueMap.get(booking.referrer_code) || 0;
          revenueMap.set(booking.referrer_code, current + (booking.booking_value || 0));
        }
      });

      // Create a map of referrer_id to data
      const dataMap = new Map(
        referrerData?.map(r => {
          const patient = r.patient_id ? patientMap.get(r.patient_id) : null;
          return [
            r.id,
            {
              type_code: (r.referrer_types as any)?.code || null,
              type_name: (r.referrer_types as any)?.name || null,
              first_purchase_rate: (r.referrer_types as any)?.first_purchase_rate || null,
              repeat_purchase_rate: (r.referrer_types as any)?.repeat_purchase_rate || null,
              created_at: r.created_at,
              email: r.email,
              first_name: patient?.first_name || null,
              last_name: patient?.last_name || null,
              total_revenue: revenueMap.get(r.referrer_code) || 0,
            }
          ];
        }) || []
      );

      // Merge the data
      return perfData.map(row => {
        const additionalData = dataMap.get(row.referrer_id);
        return {
          ...row,
          referrer_type_code: additionalData?.type_code || null,
          referrer_type_name: additionalData?.type_name || null,
          first_purchase_rate: additionalData?.first_purchase_rate || null,
          repeat_purchase_rate: additionalData?.repeat_purchase_rate || null,
          created_at: additionalData?.created_at || new Date().toISOString(),
          referrer_name: row.referrer_email || additionalData?.email || 'Unknown',
          referrer_first_name: additionalData?.first_name || null,
          referrer_last_name: additionalData?.last_name || null,
          total_revenue: additionalData?.total_revenue || 0,
        };
      }) as ReferrerPerformance[];
    },
  });

  const filteredReferrers = referrers?.filter(
    (r) =>
      r.referrer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referrer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referrer_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referrer_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<ReferrerPerformance>[] = [
    {
      key: "activity",
      header: " ",
      cell: (row) => {
        const status = getReferrerActivityStatus({
          createdAt: row.created_at,
          lastReferralAt: row.last_referral_at,
        });
        return (
          <div className="flex items-center justify-center">
            <ReferrerActivityDot status={status} size="sm" />
          </div>
        );
      },
    },
    {
      key: "referrer_name",
      header: t('referrers:name'),
      sortable: true,
      cell: (row) => {
        const fullName = row.referrer_first_name && row.referrer_last_name
          ? `${row.referrer_first_name} ${row.referrer_last_name}`
          : row.referrer_email;
        return <span className="text-sm font-medium text-foreground">{fullName}</span>;
      },
    },
    {
      key: "referrer_type_name",
      header: "Type",
      sortable: true,
      cell: (row) => {
        const tooltipText = row.first_purchase_rate && row.repeat_purchase_rate
          ? `Commission 1er achat : ${row.first_purchase_rate}% • Achats suivants : ${row.repeat_purchase_rate}%`
          : row.referrer_type_name || "STANDARD";
        
        const tierStyles = getTierBadgeStyles(row.referrer_type_code, row.referrer_type_name);
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-help ${tierStyles.className}`}>
                  {tierStyles.label}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-sm">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      key: "company_name",
      header: t('referrers:company'),
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.company_name || "—"}</span>
      ),
    },
    {
      key: "total_referrals",
      header: t('referrers:totalReferrals'),
      sortable: true,
      cell: (row) => <span className="text-sm text-foreground text-right block">{row.total_referrals}</span>,
    },
    {
      key: "booked_referrals",
      header: t('referrers:booked'),
      sortable: true,
      cell: (row) => <span className="text-sm text-foreground text-right block">{row.booked_referrals}</span>,
    },
    {
      key: "confirmed_referrals",
      header: t('referrers:confirmedReferrals'),
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-medium text-success text-right block">{row.confirmed_referrals}</span>
      ),
    },
    {
      key: "total_revenue",
      header: t('referrers:totalRevenue'),
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-semibold text-primary text-right block">
          {formatCurrency(row.total_revenue)}
        </span>
      ),
    },
    {
      key: "total_commissions",
      header: t('referrers:totalCommissions'),
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-semibold text-foreground text-right block">
          {formatCurrency(row.total_commissions)}
        </span>
      ),
    },
    {
      key: "last_referral_at",
      header: t('referrers:lastReferral'),
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.last_referral_at ? formatDate(row.last_referral_at) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">{t('referrers:title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('referrers:description')}
        </p>
      </div>

      {/* Search + Activity Legend */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('referrers:searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <ActivityLegend />
      </div>

      {/* Table or Empty State */}
      {!isLoading && (!filteredReferrers || filteredReferrers.length === 0) ? (
        <EmptyState
          icon={Users}
          title={t('referrers:noReferrers', 'No referrers yet')}
          description={t('referrers:noReferrersDesc', 'Referrers will appear here once they sign up for your program.')}
        />
      ) : (
        <DataTable
          data={filteredReferrers || []}
          columns={columns}
          loading={isLoading}
          onRowClick={(row) => navigate(`/admin/referrers/${row.referrer_id}`)}
        />
      )}
    </div>
  );
}
