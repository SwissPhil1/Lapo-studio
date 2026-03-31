# LAPO Studio Backoffice — Integration Context for Referral App

## What is LAPO Studio?

LAPO Studio is a clinic backoffice/CRM built with React 19 + TypeScript + Vite + Supabase. It manages referrals, commissions, LAPO Cash rewards, patient CRM, appointments, campaigns, and workflows. The referral app shares the same Supabase database.

## Supabase Project

- **URL**: Uses `VITE_SUPABASE_URL` env variable
- **Auth**: Supabase Auth with RLS. Anon key for frontend, RLS policies enforce access.

## Shared Database Tables

### `referrers`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| referrer_code | text UNIQUE | Code shared with patients |
| email | text | |
| patient_id | FK → patients | Referrer's own patient profile |
| referrer_type_id | FK → referrer_types | Tier classification |
| company_id | FK → companies | Optional company |
| status | text | active / inactive |
| auto_payout_enabled | boolean | |
| commission_rate | numeric | Custom override (nullable) |
| iban, bank_name, bank_address, tax_id | text | Banking details |
| is_test | boolean | |
| created_at, updated_at, deleted_at | timestamp | |

### `referrals`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| referrer_id | FK → referrers | Who made the referral |
| referred_patient_id | FK → patients | Person referred |
| booking_id | FK → bookings | First appointment (nullable) |
| referral_status | text | pending → booked → confirmed → cancelled / expired |
| origin_type | text | code_scan, direct, link |
| referral_discount_fixed | numeric | Fixed discount for patient |
| referral_discount_percent | numeric | % discount for patient |
| expires_at | timestamp | |
| is_test | boolean | |
| created_at, updated_at | timestamp | |

### `referrer_types` (Tier System)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| code | text UNIQUE | standard, premium, vip |
| name | text | Display name |
| first_purchase_rate | numeric | Commission % for 1st purchase |
| repeat_purchase_rate | numeric | Commission % for repeat |
| default_commission_rate | numeric | Fallback rate (nullable) |
| lapo_cash_conversion_rate | numeric | CHF → LC multiplier (e.g. 1.20) |
| referral_discount_fixed | numeric | Discount offered via tier |
| referral_discount_percent | numeric | % discount via tier |
| is_active, is_default | boolean | |
| display_order | integer | |

### `commission_entries`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| referrer_id | FK → referrers | |
| patient_id | FK → patients | |
| booking_id | FK → bookings | |
| purchase_amount | numeric | Booking value (CHF) |
| commission_amount | numeric | Calculated commission |
| commission_rate | numeric | Applied rate % |
| purchase_type | text | first_purchase / repeat_purchase |
| status | text | pending / blocked / held / paid / converted / reversed / cancelled |
| batch_id | FK → commission_batches | |
| converted_lc_amount | numeric | LC amount if converted |
| split_parent_id | FK → commission_entries | If split commission |
| currency | text | CHF |
| paid_at | timestamp | |

### `commission_batches`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| batch_number | integer | Sequential |
| status | text | open / closed / exported / finalized / reversed |
| is_current | boolean | Active open batch |
| total_entries, total_commission, total_referrers | numeric | |
| closed_at | timestamp | |

### `payouts`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| referrer_id | FK → referrers | |
| status | text | pending / processed / completed / failed / cancelled |
| total_amount | numeric | CHF |
| payout_method | text | bank_transfer / stripe / other |
| payout_reference | text | Payment system ref |
| payout_date | timestamp | |

### `payout_profiles` (Banking Info)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| referrer_id | FK → referrers (1:1) | |
| iban | text | |
| bank_name, address, phone | text | |

### `lapo_cash_wallets`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| referrer_id | FK → referrers (1:1) | |
| balance | numeric | Current LC balance |

### `lapo_cash_transactions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| wallet_id | FK → lapo_cash_wallets | |
| amount | numeric | +credit / -debit |
| type | text | commission_conversion, birthday_gift, workshop_reward, referral_bonus, redemption, adjustment, expiration, other |
| description | text | |
| reference_id | text | Source entity ID |
| performed_by | UUID | Admin user |

### `prizes`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name, description | text | |
| category | text | gift_card / experience / product / discount / other |
| lapo_cash_cost | numeric | Cost in LC |
| stock | integer | Available qty (nullable) |
| redeemed_count | integer | |
| is_active | boolean | |

### `patients`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| first_name, last_name, full_name | text | |
| email, phone | text | |
| normalized_email, normalized_phone | text | For dedup matching |
| date_of_birth | date | |
| gender | text | |
| address_line_1/2, city, postal_code, country | text | |
| tags | jsonb | Array of tags |
| consents | jsonb | Consent + opt-out data |
| deleted_at | timestamp | Soft delete |

### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| patient_id | FK → patients | |
| service | text | Service name |
| booking_date | timestamp | |
| booking_value | numeric | CHF amount |
| discount_applied | numeric | |
| referrer_code | text | Denormalized for speed |
| status | text | scheduled / completed / cancelled / no_show / rescheduled |

### `profiles` (Auth Users)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Profile's own ID |
| auth_user_id | UUID | FK to Supabase auth.users |
| first_name, last_name | text | |
| email | text | |
| role | text | admin / clinic_staff / referrer / patient / user |

### `system_settings`
| Key | Purpose |
|-----|---------|
| lapo_cash_conversion_rate | Base CHF → LC rate (fallback) |
| zapier_booking_webhook_url | Webhook for booking sync |

## Referral Lifecycle Flow

```
1. REFERRER REGISTRATION
   -> referrers row created with unique referrer_code
   -> referrer_type_id assigned (default tier)
   -> lapo_cash_wallet created (balance = 0)
   -> payout_profile created (initially empty)

2. REFERRAL CREATION
   -> Patient uses referrer_code (via code, link, or manual)
   -> referrals row: status = "pending", origin_type set

3. BOOKING LINKS TO REFERRAL
   -> Patient books (bookings.referrer_code set)
   -> referral_status -> "booked", booking_id linked

4. BOOKING COMPLETES -> COMMISSION CREATED
   -> booking.status = "completed"
   -> RPC: detect_or_create_referral()
   -> Determines purchase_type (first vs repeat)
   -> Gets rate from referrer_type (or referrer override)
   -> commission_entries created: status = "pending"
   -> commission_amount = booking_value * rate / 100

5. COMMISSION BATCHING (Weekly admin task)
   -> Admin reviews pending commissions
   -> Adds to current batch (commission_batches.is_current = true)
   -> Closes batch -> creates payouts

6. PAYOUT OR LAPO CASH CONVERSION
   Option A: Bank payout (payouts table, status: pending -> completed)
   Option B: Convert to LAPO Cash
     -> Edge Function: credit-lapo-cash
     -> commission_entries.status = "converted"
     -> lapo_cash_wallets.balance += amount * tier_conversion_rate

7. LAPO CASH REDEMPTION
   -> Referrer redeems prize (prizes.lapo_cash_cost)
   -> Edge Function: redeem-lapo-cash
   -> lapo_cash_transactions: type = "redemption", amount = negative
```

## Supabase Edge Functions

| Endpoint | Method | Body | Purpose |
|----------|--------|------|---------|
| `/functions/v1/credit-lapo-cash` | POST | `{ referrer_id, amount, type, description, performed_by }` | Credit LC to wallet |
| `/functions/v1/redeem-lapo-cash` | POST | `{ referrer_id, wallet_id, amount, type, description, performed_by }` | Debit LC from wallet |
| `/functions/v1/delete-referrer` | POST | `{ referrer_id }` | Delete referrer |
| `/functions/v1/delete-referral` | POST | `{ referral_id }` | Delete referral |
| `/functions/v1/zapier-webhook` | POST | Booking events | Receives ClinicMinds booking updates |
| `/functions/v1/payments-webhook` | POST | Payment events | Receives payment confirmations |

All require `Authorization: Bearer <session.access_token>`.

## Key RPC Functions

**Commission**: `detect_or_create_referral()`, `ensure_current_batch()`, `add_commissions_to_batch()`, `sync_current_payout_batch()`, `close_current_payout_batch()`, `finalize_batch()`, `reverse_batch()`

**Payout**: `get_missing_payout_fields()`, `is_payout_profile_complete()`, `sync_payout_profile()`, `profile_completeness_score()`

**Admin**: `rpc_get_admin_dashboard()`, `rpc_commission_dashboard()`, `get_net_revenue_kpi()`, `ensure_referrer_record()`, `upgrade_guest_to_active()`

## Key Database Views

| View | Purpose |
|------|---------|
| v_referrals_enriched | Referrals joined with referrer + patient + booking data |
| v_referrer_performance | Aggregated referrer metrics (total referrals, commissions, conversion) |
| v_referrer_commissions | Pending/paid commission summary per referrer |
| v_commission_overview | Batch-level commission summary |
| v_admin_commission_entries | Denormalized commission list for admin |
| v_referrers_with_company | Referrer + company join |

## Auth Roles

| Role | Access |
|------|--------|
| admin | Full system (CRM + Admin + all referral management) |
| clinic_staff | CRM only (patients, appointments, communications) |
| referrer | Referrer portal (own referrals, LC balance, prizes) |
| patient | Patient portal |
| user | Default/guest |

The referral app should authenticate referrers with `role = "referrer"` and show them their own data filtered by `referrer_id`.

## What the Referral App Needs to Read/Write

**Read**: referrers (own record), referrals (own), commission_entries (own), lapo_cash_wallets (own balance), lapo_cash_transactions (own history), prizes (active catalog), referrer_types (own tier info), payouts (own history)

**Write**: referrals (create new referrals), bookings (link referrer_code when patient books)

**Call**: `credit-lapo-cash` / `redeem-lapo-cash` Edge Functions for LC operations, `detect_or_create_referral()` RPC when booking completes

## Tech Stack Summary

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- **State**: TanStack Query v5 for data fetching
- **i18n**: react-i18next (EN/FR bilingual)
- **External**: ClinicMinds calendar sync via Zapier webhooks
