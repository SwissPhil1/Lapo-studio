# LAPO Cash Architecture — Proposal for Universal Wallet (Pre-Launch)

## To: Frontend Development Team
## From: Product / Architecture Review
## Date: April 2026
## Status: For discussion before beta launch

---

## Context

We reviewed your feedback on the Universal Wallet migration proposal and agree with several points — particularly about query simplicity and avoiding unnecessary complexity. However, we believe the **pre-launch timing** changes the risk/reward equation significantly, and we want to propose a rethought approach based on a broader product vision.

We are NOT dismissing your concerns. We want to have this conversation now, while there's zero live data, rather than 6 months post-launch when migration becomes genuinely painful.

---

## The Core Question

**Should a person's LAPO Cash balance depend on their current role, or should it belong to them as an individual?**

Today's two-table design (`lapo_cash_wallets` for ambassadors, `patient_lapo_cash_balances` for patients) means the balance is tied to a role. This creates questions:

1. **Patient → Ambassador**: `create_referrer_account()` handles this today with `transfer_patient_lc_to_referrer()`. Works. But it's a *transfer* — two transactions, two records. If we add loyalty tiers, birthday bonuses, or prize history later, do we transfer all of that too?

2. **Ambassador → Patient**: What happens if an ambassador is deactivated? Does their LC balance disappear? Transfer back to the patient table? This flow likely doesn't exist yet.

3. **Dual identity**: An ambassador IS a patient. They might receive LC as a patient (birthday bonus from the clinic) AND earn LC as an ambassador (commissions). Two balances, two tables, two queries. Which one does the receptionist see at checkout?

4. **New features**: Every new LC feature (loyalty programs, punch cards, referral bonuses for patients, prize redemptions) needs to be built for both tables. Double the Edge Functions, double the RLS policies, double the test coverage.

---

## What We're Proposing (Revised)

Not the original migration plan. A cleaner rethink:

### Single `lapo_cash_wallets` table, keyed by `patient_id`

```
lapo_cash_wallets:
  id: UUID PK
  patient_id: UUID NOT NULL UNIQUE (FK to patients)
  referrer_id: UUID NULL (FK to referrers, populated when patient is an ambassador)
  balance: number
  created_at, updated_at
```

**Why `patient_id` as the anchor:**
- Every person in the system is a patient (ambassadors are patients with a referrer record)
- `patient_id` never changes — it's the stable identifier
- `referrer_id` is added when a patient becomes an ambassador, removed if deactivated
- ONE balance, ONE transaction history, ONE wallet per person

**Why NOT two tables:**
- `patient_lapo_cash_balances` becomes unnecessary — it's just `lapo_cash_wallets` where `referrer_id IS NULL`
- No transfer logic needed on role change — the wallet stays, only `referrer_id` gets populated
- No orphaned balances, no race conditions during signup flow
- Simpler queries: always `.eq("patient_id", x)` for CRM, resolve `referrer_id → patient_id` for admin

### Edge Function compatibility

The existing Edge Functions (`credit-lapo-cash`, `redeem-lapo-cash`) expect `referrer_id`. Two options:

**Option A (recommended):** Add a DB trigger that auto-resolves `referrer_id → patient_id` on INSERT:
```sql
CREATE TRIGGER trg_wallet_patient_id
  BEFORE INSERT ON lapo_cash_wallets
  FOR EACH ROW EXECUTE FUNCTION populate_wallet_patient_id();
```
Edge Functions keep working unchanged. The trigger fills in `patient_id` automatically.

**Option B:** Update Edge Functions to accept `patient_id` as an alternative parameter. More work but cleaner long-term.

### What about the senior dev's concerns?

| Concern | Response |
|---------|----------|
| "Nullable FKs = code smell" | Agree. In our proposal, `patient_id` is NOT NULL. Only `referrer_id` is nullable (it's optional metadata, not a lookup key). |
| "Every query needs WHERE X OR Y" | No. All queries use `.eq("patient_id", x)`. The `referrer_id` column is only used by Edge Functions and admin display. |
| "Complex RLS" | Same 4 policies. Patient wallet = staff only (same as before). When patient becomes ambassador, RLS doesn't change — the wallet row stays, just `referrer_id` gets populated. |
| "Trigger complexity on signup" | Simpler than current: `UPDATE lapo_cash_wallets SET referrer_id = X WHERE patient_id = Y`. No transfer, no dual transactions, no re-parenting. |
| "High risk, zero benefit" | **Pre-launch = low risk.** Benefit: every future LC feature only needs to be built once. |
| "Users see NO difference" | True for day 1. Not true when we add loyalty tiers, prize catalogs, or patient-facing LC features — those are 2x the work with two tables. |

### The real comparison (pre-launch context)

| Aspect | Two-Table (Current) | Universal (Proposed) |
|--------|---------------------|----------------------|
| Migration risk | **Zero** (no live data) | **Zero** (no live data) |
| Queries | `.eq("referrer_id")` + `.eq("patient_id")` on different tables | `.eq("patient_id")` everywhere |
| Role change handling | Transfer function + dual transactions | `UPDATE SET referrer_id = X` |
| New feature effort | Build for both tables | Build once |
| Edge Function changes | None | Trigger OR param update |
| Rollback | N/A | Easy (no live data) |
| Long-term maintenance | 2x tables, 2x hooks, 2x UI | 1x everything |

---

## What We Want From You

This is not a mandate. We want your expert opinion on:

1. **Do you agree that pre-launch timing makes migration low-risk?**
2. **Is there a technical reason the single-table approach won't work that we're missing?** (e.g., database constraints, Supabase limitations, RLS complexity we haven't considered)
3. **If you agree in principle, what would YOUR implementation plan look like?** We trust your technical judgment on the how — we're proposing the what and why.

If after this discussion you still believe two tables is the right call, we'll go with your quick-fix approach and revisit post-launch. We respect the engineering judgment. We just want to make sure the decision is made with full context.

---

## Summary

- Pre-launch = the cheapest possible time to make architectural changes
- One wallet per person (keyed by `patient_id`) eliminates transfer logic and future double-builds
- Edge Functions keep working via DB trigger or param update
- We're not dismissing the two-table approach — we're asking for a conversation before we lock in the architecture for launch

Let us know your thoughts.
