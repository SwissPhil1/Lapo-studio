# Universal LAPO Cash Wallet — Migration Plan

## Problem

LAPO Cash wallets are currently keyed by `referrer_id`. This creates friction:
- Patients who aren't ambassadors need a separate wallet path (via `patient_id`)
- When a patient becomes an ambassador, their wallet doesn't carry over
- Two hooks, two mutation paths, two dialogs — divergent logic and bugs
- A "source" badge (Ambassador/Patient) tries to paper over the split

## Solution

**ONE wallet per person, keyed by `patient_id`.**

Every referrer already has a `patient_id` in the `referrers` table. The wallet becomes universal — same wallet visible from both the CRM patient view and the admin referrer view. When a patient becomes an ambassador, the wallet just stays. Zero migration.

---

## Database Migration (Supabase Dashboard)

These SQL changes must be run BEFORE the frontend deploy:

```sql
-- 1. Backfill patient_id on existing referrer wallets
UPDATE lapo_cash_wallets w
SET patient_id = r.patient_id
FROM referrers r
WHERE w.referrer_id = r.id
  AND w.patient_id IS NULL;

-- 2. Make referrer_id nullable (keep for Edge Function backwards compat)
ALTER TABLE lapo_cash_wallets
  ALTER COLUMN referrer_id DROP NOT NULL;

-- 3. Add unique constraint on patient_id (one wallet per patient)
ALTER TABLE lapo_cash_wallets
  ADD CONSTRAINT lapo_cash_wallets_patient_id_unique UNIQUE (patient_id);
```

After migration, every wallet has a `patient_id`. The `referrer_id` stays populated on existing wallets for backwards compatibility with Edge Functions.

---

## Frontend Architecture

### Lookup pattern

```
CRM Patient View:  patient_id → lapo_cash_wallets.patient_id → wallet
Admin Referrer View: referrer_id → referrers.patient_id → lapo_cash_wallets.patient_id → wallet
```

Both views hit the **same wallet row**.

### Mutation pattern

```
CRM Patient Dialog:  Direct Supabase insert/update (patient_id based)
Admin Referrer Dialog: Edge Functions (credit-lapo-cash / redeem-lapo-cash with referrer_id)
```

Both write to the **same wallet row** via different paths. Edge Functions continue using `referrer_id` (not modified — they live server-side).

### Cache invalidation

One unified cache key: `["lapo-cash-wallet", patientId]`
Both CRM and admin invalidate the same key after mutations.

---

## Frontend Changes (9 files)

### Hooks (`src/shared/hooks/`)

| File | Change |
|------|--------|
| `useLapoCashWallet.ts` | Add `useLapoCashWalletByPatient(patientId)` and `useLapoCashMutationByPatient()`. Update `useAllLapoCashWallets()` to join patients via patient_id. |
| `usePatientLapoCashWallet.ts` | **DELETE** — merged into useLapoCashWallet.ts |

### CRM Patient Components (`src/modules/crm/components/patients/`)

| File | Change |
|------|--------|
| `LapoCashPatientCard.tsx` | Use `useLapoCashWalletByPatient(patientId)` directly. Remove dual-source lookup and Ambassador/Patient badge. |
| `LapoCashPatientTransactionDialog.tsx` | Remove `walletSource`/`referrerId` props. Use `useLapoCashMutationByPatient()` with just `patientId`. |

### Admin Referrer Components (`src/modules/admin/`)

| File | Change |
|------|--------|
| `LapoCashReferrerCard.tsx` | Resolve `referrerId → patient_id` via referrers table query, then use `useLapoCashWalletByPatient(patientId)`. |
| `LapoCashTransactionDialog.tsx` | **NO CHANGE** — keeps calling Edge Functions with `referrer_id`. |
| `ReferrerDetailPage.tsx` | Use `referrer.patient_id` (already in data) → `useLapoCashWalletByPatient()`. |

### Shared Hooks

| File | Change |
|------|--------|
| `useLatestActivities.ts` | Resolve `commission.referrer_id → referrer.patient_id → wallet.patient_id` instead of direct `referrer_id` lookup. |

### i18n

| File | Change |
|------|--------|
| `en.json`, `fr.json` | Remove `ambassadorAccount`/`patientAccount` keys (no more dual badge). |

---

## What Stays Unchanged

- `LapoCashTransactionDialog.tsx` (admin) — still calls Edge Functions with `referrer_id`
- `useLapoCashTransactions(walletId)` — already universal (wallet-id based)
- `useLapoCashStats()` — aggregates by balance/amount, no owner filter
- Edge Functions (`credit-lapo-cash`, `redeem-lapo-cash`) — server-side, not in this repo
- `lapo_cash_transactions` table — no schema change needed

---

## Key Scenarios

### Patient has no wallet yet
- CRM card shows "0.00 LC" with Credit enabled, Debit disabled
- First credit creates wallet with `patient_id`

### Patient becomes ambassador
- Wallet already exists via `patient_id` — no migration needed
- Admin referrer view resolves `referrerId → patient_id` → finds the same wallet
- Edge Functions can still write to the wallet via `referrer_id` (if populated)

### Ambassador already has a wallet (existing data)
- DB migration backfills `patient_id` from `referrers.patient_id`
- Wallet now queryable by BOTH `referrer_id` (Edge Functions) and `patient_id` (frontend)

### Credit via CRM, view in Admin (or vice versa)
- Same wallet row → same balance → same transaction history
- Cache invalidation uses `patient_id` key → both views update

---

## Implementation Order

1. **DB migration** (Supabase Dashboard) — prerequisite
2. **Step 1**: Unify hooks in `useLapoCashWallet.ts`, delete `usePatientLapoCashWallet.ts`
3. **Step 2**: Simplify CRM patient card + dialog
4. **Step 3**: Update admin referrer card + detail page
5. **Step 4**: Update activity feed + admin pages
6. **Step 5**: Clean up i18n, build, push

Each step ends with `npm run build` check + commit.

---

## Verification Checklist

- [ ] `npm run build` passes
- [ ] CRM: Open any patient → LAPO Cash card shows balance
- [ ] CRM: Credit/debit works via direct Supabase mutations
- [ ] Admin: Open a referrer → same wallet/balance as CRM patient view
- [ ] Admin: Credit via Edge Function dialog → balance updates in both views
- [ ] Patient becomes referrer → same wallet, no migration
- [ ] Activity feed shows commission conversions correctly
- [ ] GiftLapoCashPage stats and transactions load
- [ ] FR/EN translations work
