import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Gift, Plus, Minus, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatLapoCash, formatDate } from "@/shared/lib/format";
import { useLapoCashWalletByPatient, useLapoCashTransactions, useReferrerConversionRate } from "@/shared/hooks/useLapoCashWallet";
import { LapoCashTransactionDialog } from "./LapoCashTransactionDialog";

interface LapoCashReferrerCardProps {
  referrerId: string;
  referrerName: string;
  patientId: string;
}

export function LapoCashReferrerCard({ referrerId, referrerName, patientId }: LapoCashReferrerCardProps) {
  const { t } = useTranslation("lapoCash");
  const { data: wallet, isLoading } = useLapoCashWalletByPatient(patientId);
  const { data: transactions } = useLapoCashTransactions(wallet?.id);
  const { data: rateInfo } = useReferrerConversionRate(referrerId);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [debitDialogOpen, setDebitDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const balance = wallet?.balance || 0;

  return (
    <>
      <Card className="border-warning/30 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wow-coral to-wow-pink flex items-center justify-center">
                <Gift className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg text-foreground">{t("walletCard.title")}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreditDialogOpen(true)}
                className="text-success border-success/30 hover:bg-success/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("credit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebitDialogOpen(true)}
                disabled={balance <= 0}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
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
                <p className="text-sm text-muted-foreground">{t("walletCard.currentBalance")}</p>
                <p className="text-3xl font-bold text-foreground">
                  {isLoading ? "..." : formatLapoCash(balance)}
                </p>
              </div>
              {rateInfo && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{t("walletCard.yourRate")}</p>
                  <p className="text-sm font-medium text-foreground">1:{rateInfo.rate.toFixed(2)}</p>
                </div>
              )}
            </div>

            {transactions && transactions.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-muted-foreground hover:text-foreground p-0"
                >
                  <History className="h-4 w-4 mr-1" />
                  {t("walletCard.viewHistory")} ({transactions.length})
                </Button>

                {showHistory && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {transactions.slice(0, 10).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0"
                      >
                        <div>
                          <span className="text-foreground">
                            {t(`transactionTypes.${tx.type}`)}
                          </span>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                          {tx.description && (
                            <p className="text-xs text-muted-foreground">{tx.description}</p>
                          )}
                        </div>
                        <span
                          className={`font-medium ${
                            tx.amount >= 0 ? "text-success" : "text-destructive"
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
        patientId={patientId}
        walletId={wallet?.id}
        currentBalance={balance}
      />

      <LapoCashTransactionDialog
        open={debitDialogOpen}
        onOpenChange={setDebitDialogOpen}
        type="debit"
        referrerId={referrerId}
        referrerName={referrerName}
        patientId={patientId}
        walletId={wallet?.id}
        currentBalance={balance}
      />
    </>
  );
}
