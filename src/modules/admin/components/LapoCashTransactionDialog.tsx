import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
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
import { toast } from "sonner";
import { formatErrorForToast } from "@/shared/lib/errorMessages";

type TransactionType = "credit" | "debit";

interface LapoCashTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionType;
  referrerId: string;
  referrerName: string;
  patientId?: string;
  walletId?: string;
  currentBalance?: number;
}

const TRANSACTION_TYPES = [
  "birthday_gift",
  "workshop_reward",
  "referral_bonus",
  "adjustment",
  "redemption",
  "other",
] as const;

export function LapoCashTransactionDialog({
  open,
  onOpenChange,
  type,
  referrerId,
  referrerName,
  patientId,
  walletId,
  currentBalance = 0,
}: LapoCashTransactionDialogProps) {
  const { t } = useTranslation("lapoCash");
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<string>("birthday_gift");
  const [description, setDescription] = useState("");

  const isCredit = type === "credit";
  const dialogKey = isCredit ? "creditDialog" : "debitDialog";

  const mutation = useMutation({
    mutationFn: async () => {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Invalid amount");
      }

      if (!isCredit && numAmount > currentBalance) {
        throw new Error("Insufficient balance");
      }

      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const endpoint = isCredit ? "credit-lapo-cash" : "redeem-lapo-cash";
      
      const body = isCredit 
        ? {
            referrer_id: referrerId,
            amount: numAmount,
            type: transactionType,
            description: description || null,
            performed_by: session.user.id
          }
        : {
            referrer_id: referrerId,
            wallet_id: walletId,
            amount: numAmount,
            type: transactionType,
            description: description || null,
            performed_by: session.user.id
          };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Transaction failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(t(isCredit ? "toast.creditSuccess" : "toast.debitSuccess"));
      queryClient.invalidateQueries({ queryKey: ["lapo-cash-wallet", referrerId] });
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: ["lapo-cash-wallet", patientId] });
      }
      queryClient.invalidateQueries({ queryKey: ["lapo-cash-wallets-all"] });
      queryClient.invalidateQueries({ queryKey: ["lapo-cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["lapo-cash-stats"] });
      onOpenChange(false);
      setAmount("");
      setDescription("");
      setTransactionType("birthday_gift");
    },
    onError: (error: Error) => {
      const { title, description } = formatErrorForToast(error);
      toast.error(title, { description });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`${dialogKey}.title`)}</DialogTitle>
          <DialogDescription>
            {t(`${dialogKey}.description`, { name: referrerName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t(`${dialogKey}.amountLabel`)}</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t(`${dialogKey}.typeLabel`)}</Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map((txType) => (
                  <SelectItem key={txType} value={txType}>
                    {t(`transactionTypes.${txType}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t(`${dialogKey}.descriptionLabel`)}</Label>
            <Textarea
              id="description"
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
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !amount || parseFloat(amount) <= 0}
            variant={isCredit ? "default" : "destructive"}
          >
            {mutation.isPending ? "..." : t(`${dialogKey}.submit`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
