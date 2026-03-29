import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { Gift, Wallet, TrendingUp, TrendingDown, Settings, HelpCircle, Filter } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KPICard } from "@/modules/admin/components/KPICard";
import { DataTable, Column } from "@/modules/admin/components/DataTable";
import { EmptyState } from "@/modules/admin/components/EmptyState";
import { StatusBadge } from "@/modules/admin/components/StatusBadge";
import { formatCurrency, formatDate, formatLapoCash } from "@/shared/lib/format";
import {
  useLapoCashStats,
  useAllLapoCashTransactions,
  useTierConversionRates,
  LapoCashTransaction,
} from "@/shared/hooks/useLapoCashWallet";
import { getTierBadgeStyles } from "@/shared/lib/referrerTierBadge";

const TRANSACTION_TYPE_OPTIONS = [
  "all",
  "commission_conversion",
  "birthday_gift",
  "workshop_reward",
  "referral_bonus",
  "redemption",
  "adjustment",
  "other",
] as const;

export default function LapoCash() {
  const { t } = useTranslation("lapoCash");
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: stats, isLoading: statsLoading } = useLapoCashStats();
  const { data: tierRates, isLoading: ratesLoading } = useTierConversionRates();
  const { data: transactions, isLoading: txLoading } = useAllLapoCashTransactions(100);

  // Filter transactions by type
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (typeFilter === "all") return transactions;
    return transactions.filter(tx => tx.type === typeFilter);
  }, [transactions, typeFilter]);

  const columns: Column<LapoCashTransaction>[] = [
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
      cell: (row) => (
        <div>
          <Link 
            to={`/admin/referrers/${row.referrer_id}`}
            className="text-sm font-medium text-foreground hover:text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.referrer_name || "—"}
          </Link>
          <div className="text-xs text-muted-foreground font-mono">{row.referrer_code || "—"}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: t("type"),
      cell: (row) => (
        <StatusBadge 
          status={row.type} 
          type="lapoCash"
        />
      ),
    },
    {
      key: "amount",
      header: t("amount"),
      cell: (row) => (
      <span className={`text-sm font-medium ${row.amount >= 0 ? "text-success" : "text-destructive"}`}>
          {row.amount >= 0 ? "+" : ""}{formatLapoCash(row.amount)}
        </span>
      ),
    },
    {
      key: "description",
      header: t("description"),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.description || "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{t("pageTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("pageDescription")}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title={t("totalIssued")}
          value={formatLapoCash(stats?.totalIssued || 0)}
          icon={TrendingUp}
          loading={statsLoading}
        />
        <KPICard
          title={t("totalRedeemed")}
          value={formatLapoCash(stats?.totalRedeemed || 0)}
          icon={TrendingDown}
          loading={statsLoading}
        />
        <KPICard
          title={t("activeBalance")}
          value={formatLapoCash(stats?.activeBalance || 0)}
          icon={Wallet}
          loading={statsLoading}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">{t("ratesByTier")}</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{t("ratesByTierTooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <button
                    onClick={() => navigate("/admin/referrer-types")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </div>
                {ratesLoading ? (
                  <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="space-y-1">
                    {tierRates?.slice(0, 3).map((tier) => {
                      const tierStyles = getTierBadgeStyles(tier.code, tier.name);
                      return (
                        <div key={tier.code} className="flex items-center gap-2 text-sm">
                          <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium ${tierStyles.className}`}>
                            {tier.code.toUpperCase()}
                          </span>
                          <span className="text-foreground font-medium">1:{Number(tier.lapo_cash_conversion_rate || 1.10).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="rounded-full bg-amber-500/10 p-3">
                <Gift className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("allTransactions")}</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("filterByType")} />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPE_OPTIONS.map((txType) => (
                    <SelectItem key={txType} value={txType}>
                      {txType === "all" ? t("allTypes") : t(`transactionTypes.${txType}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!txLoading && filteredTransactions.length === 0 ? (
            <EmptyState
              icon={Gift}
              title={t("noTransactions")}
              description={t("noTransactionsDescription")}
            />
          ) : (
            <DataTable
              data={filteredTransactions}
              columns={columns}
              loading={txLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
