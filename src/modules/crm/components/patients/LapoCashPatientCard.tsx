import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Gift, Plus, Minus, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatLapoCash, formatDate } from "@/shared/lib/format";
import { usePatientLapoCashWallet } from "@/shared/hooks/usePatientLapoCashWallet";
import { useLapoCashTransactions } from "@/shared/hooks/useLapoCashWallet";
import { LapoCashPatientTransactionDialog } from "./LapoCashPatientTransactionDialog";

interface LapoCashPatientCardProps {
  patientId: string;
  patientName: string;
}

export function LapoCashPatientCard({ patientId, patientName }: LapoCashPatientCardProps) {
  const { t } = useTranslation("lapoCash");
  const { data: wallet, isLoading } = usePatientLapoCashWallet(patientId);
  const { data: transactions } = useLapoCashTransactions(wallet?.id);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [debitDialogOpen, setDebitDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const balance = wallet?.balance || 0;

  return (
    <>
      <Card className="border-border bg-card">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left: icon + title + balance */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-wow-coral to-wow-pink flex items-center justify-center">
                <Gift className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {t("patientWallet.title")}
              </span>
              <span className="text-xl font-bold text-foreground">
                {isLoading ? "..." : formatLapoCash(balance)}
              </span>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreditDialogOpen(true)}
                className="h-7 px-2 text-xs text-success border-success/30 hover:bg-success/10"
              >
                <Plus className="h-3 w-3 mr-1" />
                {t("credit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebitDialogOpen(true)}
                disabled={balance <= 0}
                className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Minus className="h-3 w-3 mr-1" />
                {t("debit")}
              </Button>
            </div>
          </div>

          {/* Collapsible history */}
          {transactions && transactions.length > 0 && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="h-6 px-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <History className="h-3 w-3 mr-1" />
                {t("patientWallet.viewHistory")} ({transactions.length})
              </Button>

              {showHistory && (
                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0"
                    >
                      <div className="min-w-0">
                        <span className="text-foreground">
                          {t(`patientTransactionTypes.${tx.type}`, {
                            defaultValue: t(`transactionTypes.${tx.type}`, { defaultValue: tx.type }),
                          })}
                        </span>
                        <p className="text-[10px] text-muted-foreground">{formatDate(tx.created_at)}</p>
                        {tx.description && (
                          <p className="text-[10px] text-muted-foreground truncate">{tx.description}</p>
                        )}
                      </div>
                      <span
                        className={`font-medium shrink-0 ml-2 ${
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
        </CardContent>
      </Card>

      <LapoCashPatientTransactionDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        type="credit"
        patientId={patientId}
        patientName={patientName}
        walletId={wallet?.id}
        currentBalance={balance}
      />

      <LapoCashPatientTransactionDialog
        open={debitDialogOpen}
        onOpenChange={setDebitDialogOpen}
        type="debit"
        patientId={patientId}
        patientName={patientName}
        walletId={wallet?.id}
        currentBalance={balance}
      />
    </>
  );
}
