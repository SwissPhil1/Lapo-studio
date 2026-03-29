import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Gift, Plus, Minus, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatLapoCash, formatDate } from "@/shared/lib/format";
import { useLapoCashWallet, useLapoCashTransactions, useReferrerConversionRate } from "@/shared/hooks/useLapoCashWallet";
import { LapoCashTransactionDialog } from "./LapoCashTransactionDialog";

interface LapoCashReferrerCardProps {
  referrerId: string;
  referrerName: string;
}

export function LapoCashReferrerCard({ referrerId, referrerName }: LapoCashReferrerCardProps) {
  const { t } = useTranslation("lapoCash");
  const { data: wallet, isLoading } = useLapoCashWallet(referrerId);
  const { data: transactions } = useLapoCashTransactions(wallet?.id);
  const { data: rateInfo } = useReferrerConversionRate(referrerId);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [debitDialogOpen, setDebitDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const balance = wallet?.balance || 0;

  return (
    <>
      <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-orange-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Gift className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg text-amber-900">{t("walletCard.title")}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreditDialogOpen(true)}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("credit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebitDialogOpen(true)}
                disabled={balance <= 0}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Minus className="h-4 w-4 mr-1" />
                {t("debit")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-amber-700">{t("walletCard.currentBalance")}</p>
                <p className="text-3xl font-bold text-amber-900">
                  {isLoading ? "..." : formatLapoCash(balance)}
                </p>
              </div>
              {rateInfo && (
                <div className="text-right">
                  <p className="text-xs text-amber-600">{t("walletCard.yourRate")}</p>
                  <p className="text-sm font-medium text-amber-800">1:{rateInfo.rate.toFixed(2)}</p>
                </div>
              )}
            </div>

            {transactions && transactions.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-amber-700 hover:text-amber-900 p-0"
                >
                  <History className="h-4 w-4 mr-1" />
                  {t("walletCard.viewHistory")} ({transactions.length})
                </Button>

                {showHistory && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {transactions.slice(0, 10).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between text-sm py-1 border-b border-amber-100 last:border-0"
                      >
                        <div>
                          <span className="text-amber-800">
                            {t(`transactionTypes.${tx.type}`)}
                          </span>
                          <p className="text-xs text-amber-500">{formatDate(tx.created_at)}</p>
                          {tx.description && (
                            <p className="text-xs text-amber-600">{tx.description}</p>
                          )}
                        </div>
                        <span
                          className={`font-medium ${
                            tx.amount >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {formatLapoCash(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <LapoCashTransactionDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        type="credit"
        referrerId={referrerId}
        referrerName={referrerName}
        walletId={wallet?.id}
        currentBalance={balance}
      />

      <LapoCashTransactionDialog
        open={debitDialogOpen}
        onOpenChange={setDebitDialogOpen}
        type="debit"
        referrerId={referrerId}
        referrerName={referrerName}
        walletId={wallet?.id}
        currentBalance={balance}
      />
    </>
  );
}
