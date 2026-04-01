import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useLapoCashMutationByPatient,
  type PatientTransactionType,
} from "@/shared/hooks/useLapoCashWallet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LapoCashPatientTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "credit" | "debit";
  patientId: string;
  patientName: string;
  walletId?: string;
  currentBalance?: number;
}

const CREDIT_TYPES: PatientTransactionType[] = [
  "loyalty_credit",
  "gift_received",
  "birthday_bonus",
  "adjustment",
  "other",
];

const DEBIT_TYPES: PatientTransactionType[] = [
  "loyalty_debit",
  "redemption",
  "adjustment",
  "other",
];

export function LapoCashPatientTransactionDialog({
  open,
  onOpenChange,
  type,
  patientId,
  patientName,
  walletId,
  currentBalance = 0,
}: LapoCashPatientTransactionDialogProps) {
  const { t } = useTranslation("lapoCash");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<PatientTransactionType>(
    type === "credit" ? "loyalty_credit" : "redemption"
  );
  const [description, setDescription] = useState("");

  const mutation = useLapoCashMutationByPatient();

  const isCredit = type === "credit";
  const dialogKey = isCredit ? "patientCreditDialog" : "patientDebitDialog";
  const transactionTypes = isCredit ? CREDIT_TYPES : DEBIT_TYPES;

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    mutation.mutate(
      {
        patientId,
        amount: isCredit ? numAmount : -numAmount,
        type: transactionType,
        description: description || undefined,
        existingWalletId: walletId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setAmount("");
          setDescription("");
          setTransactionType(isCredit ? "loyalty_credit" : "redemption");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`${dialogKey}.title`)}</DialogTitle>
          <DialogDescription>
            {t(`${dialogKey}.description`, { name: patientName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="patient-amount">{t(`${dialogKey}.amountLabel`)}</Label>
            <Input
              id="patient-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            {!isCredit && parseFloat(amount) > currentBalance && (
              <p className="text-xs text-destructive">
                {t("patientWallet.insufficientBalance", {
                  defaultValue: "Insufficient balance",
                })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient-type">{t(`${dialogKey}.typeLabel`)}</Label>
            <Select
              value={transactionType}
              onValueChange={(v) => setTransactionType(v as PatientTransactionType)}
            >
              <SelectTrigger id="patient-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((txType) => (
                  <SelectItem key={txType} value={txType}>
                    {t(`patientTransactionTypes.${txType}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient-desc">{t(`${dialogKey}.descriptionLabel`)}</Label>
            <Textarea
              id="patient-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(`${dialogKey}.descriptionPlaceholder`)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t(`${dialogKey}.cancel`)}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              mutation.isPending ||
              !amount ||
              parseFloat(amount) <= 0 ||
              (!isCredit && parseFloat(amount) > currentBalance)
            }
            variant={isCredit ? "default" : "destructive"}
          >
            {mutation.isPending ? "..." : t(`${dialogKey}.submit`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
