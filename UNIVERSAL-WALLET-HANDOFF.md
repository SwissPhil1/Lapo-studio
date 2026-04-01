# LAPO Cash Universal Wallet — Implementation Handoff

## What Was Done (LAPO Studio — branch `claude/final-testing-review-ZhIGi`)

### Summary
Unified the LAPO Cash wallet system from a dual-table architecture (referrer wallets + patient wallets) to a **single universal wallet keyed by `patient_id`**. One wallet per person. No more split transaction history. No more complex fallback logic.

**Commit**: `b54fb74` — "refactor: unify LAPO Cash to universal wallet keyed by patient_id"
**Branch**: `claude/final-testing-review-ZhIGi`
**Build**: TypeScript + Vite — zero errors

---

### Files Changed (12 files, +166 / -559 lines)

#### Deleted
- `src/shared/hooks/usePatientLapoCashWallet.ts` — merged into `useLapoCashWallet.ts`
- `UNIVERSAL-WALLET-MIGRATION.md` — no longer needed
- `WALLET-ARCHITECTURE-DISCUSSION.md` — no longer needed

#### Modified — Hooks
- **`src/shared/hooks/useLapoCashWallet.ts`** (+140 lines)
  - Updated `LapoCashWallet` interface: `patient_id: string` (NOT NULL), `referrer_id: string | null` (nullable)
  - Added `PatientTransactionType` type (moved from deleted file)
  - Added `useLapoCashWalletByPatient(patientId)` — queries by `patient_id`, cache key `["lapo-cash-wallet", patientId]`
  - Added `useLapoCashMutationByPatient()` — direct Supabase insert/update for patient credits/debits
  - Updated `useAllLapoCashWallets()` — now JOINs `patients` directly via `patient_id` FK instead of nested `referrers -> patients`
  - Updated `useAllLapoCashTransactions()` — same JOIN simplification
  - Kept `useLapoCashWallet(referrerId)` unchanged — still used by admin Edge Function dialog

#### Modified — CRM Components
- **`src/modules/crm/components/patients/LapoCashPatientCard.tsx`** (-33 lines)
  - Uses `useLapoCashWalletByPatient(patientId)` instead of old `usePatientLapoCashWallet(patientId)`
  - Removed dual-source logic (Ambassador/Patient badge, `WalletSource`, `PatientWalletResult`)
  - Removed `Crown`, `User`, `Badge` imports
  - Simplified dialog props (no more `walletSource`, `referrerId`)

- **`src/modules/crm/components/patients/LapoCashPatientTransactionDialog.tsx`** (-13 lines)
  - Imports from `useLapoCashWallet.ts` instead of deleted `usePatientLapoCashWallet.ts`
  - Uses `useLapoCashMutationByPatient()` — simpler call with just `patientId`
  - Removed `walletSource`, `referrerId` props

#### Modified — Admin Components
- **`src/modules/admin/components/LapoCashReferrerCard.tsx`** (+9 lines)
  - Added `patientId: string` prop
  - Uses `useLapoCashWalletByPatient(patientId)` instead of `useLapoCashWallet(referrerId)`
  - Passes `patientId` to `LapoCashTransactionDialog`
  - Kept `useReferrerConversionRate(referrerId)` unchanged

- **`src/modules/admin/components/LapoCashTransactionDialog.tsx`** (+6 lines)
  - Added optional `patientId?: string` prop
  - Added `invalidateQueries(["lapo-cash-wallet", patientId])` in `onSuccess`
  - Added `invalidateQueries(["lapo-cash-wallets-all"])` in `onSuccess`
  - Edge Function calls unchanged — still sends `referrer_id`

- **`src/modules/admin/pages/ReferrerDetailPage.tsx`** (+13 / -13 lines)
  - Passes `patientId={referrer.patient_id!}` to `LapoCashReferrerCard` and `TransactionsTabs`
  - `TransactionsTabs` now uses `useLapoCashWalletByPatient(patientId)` instead of `useLapoCashWallet(referrerId)`
  - Removed unused `referrerId` param from `TransactionsTabs`

#### Modified — Types & i18n
- **`src/shared/types/supabase.ts`** — `lapo_cash_wallets` types updated:
  - `Row.patient_id`: `string` (was `string | null`)
  - `Row.referrer_id`: `string | null` (was `string`)
  - `Insert.patient_id`: `string` (required, was optional)
  - `Insert.referrer_id`: `string | null` (optional)

- **`src/i18n/locales/en.json`** & **`fr.json`** — removed `ambassadorAccount` and `patientAccount` keys

---

## What Still Needs to Happen (BEFORE deployment)

### Phase 0: Database Migration (Supabase Dashboard)

These SQL changes must run BEFORE deploying the frontend:

```sql
-- 1. Add patient_id column (nullable first so we can backfill)
ALTER TABLE lapo_cash_wallets
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES patients(id);

-- 2. Backfill patient_id on existing wallets from referrers table
UPDATE lapo_cash_wallets w
SET patient_id = r.patient_id
FROM referrers r
WHERE w.referrer_id = r.id
  AND w.patient_id IS NULL
  AND r.patient_id IS NOT NULL;

-- 3. Make referrer_id nullable, patient_id required + unique
ALTER TABLE lapo_cash_wallets
  ALTER COLUMN referrer_id DROP NOT NULL;

ALTER TABLE lapo_cash_wallets
  ALTER COLUMN patient_id SET NOT NULL;

ALTER TABLE lapo_cash_wallets
  ADD CONSTRAINT lapo_cash_wallets_patient_id_key UNIQUE (patient_id);

-- 4. Auto-populate trigger for Edge Function compatibility
CREATE OR REPLACE FUNCTION populate_wallet_patient_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patient_id IS NULL AND NEW.referrer_id IS NOT NULL THEN
    SELECT patient_id INTO NEW.patient_id
    FROM referrers WHERE id = NEW.referrer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_patient_id
  BEFORE INSERT ON lapo_cash_wallets
  FOR EACH ROW
  EXECUTE FUNCTION populate_wallet_patient_id();

-- 5. Migrate patient_lapo_cash_balances data (if table exists)
INSERT INTO lapo_cash_wallets (patient_id, balance)
SELECT patient_id, balance
FROM patient_lapo_cash_balances
WHERE patient_id NOT IN (
  SELECT patient_id FROM lapo_cash_wallets WHERE patient_id IS NOT NULL
)
ON CONFLICT (patient_id) DO UPDATE
SET balance = lapo_cash_wallets.balance + EXCLUDED.balance;

DROP TABLE IF EXISTS patient_lapo_cash_transactions;
DROP TABLE IF EXISTS patient_lapo_cash_balances;

-- 6. Update RLS policies (adjust to your existing policy names)
CREATE POLICY "staff_full_access" ON lapo_cash_wallets
  FOR ALL TO authenticated
  USING (current_actor_type() = 'staff');

CREATE POLICY "referrer_read_own" ON lapo_cash_wallets
  FOR SELECT TO authenticated
  USING (referrer_id = current_referrer_id());

-- 7. Update create_referrer_account() to use ON CONFLICT pattern
-- instead of transferring balance between tables:
--   IF wallet exists for patient_id: UPDATE SET referrer_id = new_referrer_id
--   IF wallet does not exist: INSERT (patient_id, referrer_id, balance=0)
--   Then credit 20 LC welcome bonus as transaction (unchanged)
```

---

### Edge Functions Impact

| Function | Impact |
|----------|--------|
| `credit-lapo-cash` | Works via DB trigger (auto-fills patient_id from referrer_id) |
| `redeem-lapo-cash` | No change needed (uses wallet_id) |
| `convert-chf-to-lapo-cash` | Works via DB trigger |
| `claim-wheel-prize` | Works via DB trigger |
| `process-birthday-gifts` | Backend should verify — may need patient_id path for non-ambassadors |
| `send-lapo-cash` | Backend to update if needed |
| `send-lapo-cash-voucher` | Backend to update if needed |

**Key point**: The DB trigger handles all Edge Functions. No Edge Function code changes are required for this frontend to work. Backend team can add `patient_id` support to Edge Functions on their own timeline.

---

## Architecture (One Diagram)

```
BEFORE:
  Patient  --> patient_lapo_cash_balances (patient_id)
  Ambassador --> lapo_cash_wallets (referrer_id)
  Patient becomes Ambassador = TRANSFER balance between tables, split history

AFTER:
  Person --> lapo_cash_wallets (patient_id NOT NULL, referrer_id nullable)
  Patient becomes Ambassador = UPDATE referrer_id on same row
  Ambassador deactivated     = SET referrer_id = NULL
  One wallet. One history. Zero transfers.
```

---

## Lifecycle Scenarios

| Scenario | What Happens |
|----------|-------------|
| Patient gets first LC credit | New row: `(patient_id=X, referrer_id=NULL)` |
| Patient becomes ambassador | `UPDATE SET referrer_id=Y WHERE patient_id=X` |
| Ambassador deactivated | `UPDATE SET referrer_id=NULL WHERE patient_id=X` — balance preserved |
| Edge Function credits ambassador | Trigger auto-fills `patient_id` from `referrer_id` |
| Admin credits patient in CRM | Direct insert with `patient_id`, no Edge Function needed |

---

## Testing Checklist

### CRM (Patient View)
- [ ] Open any patient -> LAPO Cash card shows balance
- [ ] Patient with 0 LC -> shows "0.00 LC", Credit enabled, Debit disabled
- [ ] Credit patient -> balance increases, transaction in history
- [ ] Debit patient -> validates insufficient balance
- [ ] Patient who is also ambassador -> same wallet in CRM and admin views
- [ ] French translations work

### Admin (Referrer View)
- [ ] Open a referrer -> same balance as CRM patient view
- [ ] Credit via Edge Function dialog -> balance updates in both views
- [ ] Debit via Edge Function dialog -> balance updates in both views
- [ ] Conversion rate per tier displayed correctly
- [ ] Transaction history shows ALL transactions (CRM + admin)

### Admin (Global View)
- [ ] GiftLapoCashPage -> stats correct (total issued, redeemed, active)
- [ ] Transaction table -> handles NULL referrer_id (patient-only wallets)
- [ ] Filter by type works

### Lifecycle
- [ ] New patient, no wallet -> first credit creates wallet with patient_id
- [ ] Patient becomes ambassador -> same wallet, referrer_id populated
- [ ] Ambassador deactivated -> wallet accessible via patient_id
- [ ] Commission conversion -> Edge Function uses referrer_id, trigger fills patient_id

### Build
- [ ] `tsc -b --noEmit` passes (verified)
- [ ] `npm run build` passes (verified)
- [ ] No console errors in browser

---

*Branch: `claude/final-testing-review-ZhIGi` | Commit: `b54fb74`*
