import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase";
import { DataTable, type Column } from "@/modules/admin/components/DataTable";
import { StatusBadge } from "@/modules/admin/components/StatusBadge";
import { EmptyState } from "@/modules/admin/components/EmptyState";
import { QuickFilters } from "@/modules/admin/components/QuickFilters";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight, UserCheck } from "lucide-react";
import { formatDate, formatCurrency } from "@/shared/lib/format";
import { useTranslation } from "react-i18next";

interface BookingDetail {
  id: string;
  booking_date: string;
  service: string | null;
  booking_value: number;
  commission_amount: number | null;
  commission_rate: number | null;
  purchase_type: string | null;
}

interface Referral {
  id: string;
  created_at: string;
  referral_status: string;
  booking_id: string | null;
  booking_date: string | null;
  referrer_code: string | null;
  referrer_email: string | null;
  referrer_first_name: string | null;
  referrer_last_name: string | null;
  referred_first_name: string | null;
  referred_last_name: string | null;
  referred_email: string | null;
  referred_patient_id: string | null;
  service: string | null;
  purchase_type: string | null;
  bookings: BookingDetail[];
}

type StatusFilter = "all" | "pending" | "booked" | "confirmed" | "cancelled";

export default function Referrals() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { t } = useTranslation(['referrals', 'common', 'status']);

  const toggleRow = (referralId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(referralId)) {
        newSet.delete(referralId);
      } else {
        newSet.add(referralId);
      }
      return newSet;
    });
  };

  const { data: referrals, isLoading } = useQuery({
    queryKey: ["referrals-list"],
    queryFn: async () => {
      // Use optimized view to eliminate N+1 queries
      const { data, error } = await supabase
        .from("v_referrals_enriched")
        .select("*")
        .eq("is_test", false)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Group by referral and fetch additional bookings for multi-booking referrals
      const referralMap = new Map<string, Referral>();
      
      for (const row of data || []) {
        const existing = referralMap.get(row.referral_id);
        
        if (!existing) {
          // First encounter of this referral - get all bookings for this patient+referrer pair
          const bookings: BookingDetail[] = [];
          
          if (row.referred_patient_id && row.referrer_code) {
            const { data: allBookings } = await supabase
              .from("bookings")
              .select("id, booking_date, service, booking_value")
              .eq("patient_id", row.referred_patient_id)
              .eq("referrer_code", row.referrer_code)
              .order("booking_date", { ascending: false });
            
            if (allBookings && allBookings.length > 0) {
              const bookingIds = allBookings.map(b => b.id);
              const { data: commissions } = await supabase
                .from("commission_entries")
                .select("booking_id, commission_amount, commission_rate, purchase_type")
                .in("booking_id", bookingIds);
              
              const commissionMap = new Map();
              commissions?.forEach(c => commissionMap.set(c.booking_id, c));
              
              allBookings.forEach(booking => {
                const commission = commissionMap.get(booking.id);
                bookings.push({
                  id: booking.id,
                  booking_date: booking.booking_date,
                  service: booking.service,
                  booking_value: booking.booking_value,
                  commission_amount: commission?.commission_amount || null,
                  commission_rate: commission?.commission_rate || null,
                  purchase_type: commission?.purchase_type || null,
                });
              });
            }
          }
          
          referralMap.set(row.referral_id, {
            id: row.referral_id,
            created_at: row.created_at,
            referral_status: row.referral_status,
            booking_id: row.booking_id,
            booking_date: row.booking_date,
            referrer_code: row.referrer_code,
            referrer_email: row.referrer_email,
            referrer_first_name: row.referrer_first_name,
            referrer_last_name: row.referrer_last_name,
            referred_first_name: row.referred_first_name,
            referred_last_name: row.referred_last_name,
            referred_email: row.referred_email,
            referred_patient_id: row.referred_patient_id,
            service: row.service,
            purchase_type: bookings[0]?.purchase_type || null,
            bookings,
          });
        }
      }

      return Array.from(referralMap.values());
    },
  });

  // Status counts for filters
  const statusCounts = referrals?.reduce((acc, r) => {
    acc[r.referral_status] = (acc[r.referral_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const filterOptions = [
    { value: "all" as StatusFilter, label: t('common:all'), count: referrals?.length || 0 },
    { value: "pending" as StatusFilter, label: t('status:referral.pending'), count: statusCounts["pending"] || 0 },
    { value: "booked" as StatusFilter, label: t('status:referral.booked'), count: statusCounts["booked"] || 0 },
    { value: "confirmed" as StatusFilter, label: t('status:referral.confirmed'), count: statusCounts["confirmed"] || 0 },
    { value: "cancelled" as StatusFilter, label: t('status:referral.cancelled'), count: statusCounts["cancelled"] || 0 },
  ];

  const filteredReferrals = referrals?.filter((r) => {
    // Status filter
    if (statusFilter !== "all" && r.referral_status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        r.referrer_email?.toLowerCase().includes(searchLower) ||
        r.referrer_code?.toLowerCase().includes(searchLower) ||
        r.referrer_first_name?.toLowerCase().includes(searchLower) ||
        r.referrer_last_name?.toLowerCase().includes(searchLower) ||
        r.referred_email?.toLowerCase().includes(searchLower) ||
        r.referred_first_name?.toLowerCase().includes(searchLower) ||
        r.referred_last_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const columns: Column<Referral>[] = [
    {
      key: "date",
      header: t('referrals:date'),
      cell: (row) => (
        <span className="text-sm text-foreground">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: "referrer",
      header: t('referrals:referrer'),
      cell: (row) => (
        <div className="text-sm text-foreground">
          {row.referrer_first_name && row.referrer_last_name
            ? `${row.referrer_first_name} ${row.referrer_last_name}`
            : row.referrer_email || "—"}
        </div>
      ),
    },
    {
      key: "referred",
      header: t('referrals:referredPerson'),
      cell: (row) => (
        <div className="text-sm text-foreground">
          {row.referred_first_name && row.referred_last_name
            ? `${row.referred_first_name} ${row.referred_last_name}`
            : "—"}
        </div>
      ),
    },
    {
      key: "service",
      header: t('referrals:service'),
      cell: (row) => {
        const hasMultipleBookings = row.bookings.length > 1;
        const isExpanded = expandedRows.has(row.id);
        
        return (
          <div className="w-full">
            {hasMultipleBookings ? (
              <div className="space-y-2">
                {/* Main row - clickable to expand */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRow(row.id);
                  }}
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors w-full text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="text-muted-foreground italic">
                    {row.bookings.length} {t('referrals:appointments')}
                  </span>
                </button>
                
                {/* Expanded bookings */}
                {isExpanded && (
                  <div className="ml-6 space-y-1 border-l-2 border-border pl-3">
                    {row.bookings.map((booking) => (
                      <div key={booking.id} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {formatDate(booking.booking_date)}
                          </span>
                          <span className="font-medium text-foreground">
                            {booking.service || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          {booking.booking_value > 0 && (
                            <span>{formatCurrency(booking.booking_value)}</span>
                          )}
                          {booking.commission_rate && (
                            <span>
                              {booking.commission_rate}% 
                            {booking.purchase_type && (
                              <span className="ml-1">
                                ({booking.purchase_type === "first_purchase" || booking.purchase_type.toLowerCase() === "first" ? t('referrals:first') : t('referrals:repeat')})
                              </span>
                            )}
                            </span>
                          )}
                          {!booking.commission_rate && (
                            <span className="italic">{t('referrals:awaitingPayment')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-foreground">{row.service || "—"}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "consultation_count",
      header: t("referrals:consultationCount"),
      cell: (row) => {
        return (
          <span className="text-sm font-medium text-foreground">
            {row.bookings.length || "—"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: t('common:status'),
      cell: (row) => <StatusBadge status={row.referral_status} type="referral" />,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">{t('referrals:title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('referrals:description')}
        </p>
      </div>

      {/* Quick Filters */}
      <div className="mb-4">
        <QuickFilters<StatusFilter>
          options={filterOptions}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
        />
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('referrals:searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table or Empty State */}
      {!isLoading && (!filteredReferrals || filteredReferrals.length === 0) ? (
        <EmptyState
          icon={UserCheck}
          title={t('referrals:noReferrals')}
          description={t('referrals:noReferralsDesc')}
        />
      ) : (
        <DataTable
          data={filteredReferrals || []}
          columns={columns}
          loading={isLoading}
          onRowClick={(row) => navigate(`/admin/referrals/${row.id}`)}
        />
      )}
    </div>
  );
}
