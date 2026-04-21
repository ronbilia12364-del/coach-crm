# Database Migrations

Run these SQL statements manually in the Supabase SQL editor.

---

## 2026-04-21 — Leads age/goal + Flexible plans + Auto payments

```sql
-- 1. Add age and goal fields to leads (for Facebook form data)
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS goal TEXT;

-- 2. Remove plan check constraint so custom plan strings are allowed
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_plan_check;

-- 3. Add payment automation fields to clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS total_months INTEGER,
ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(10,2);
```

> **Note:** `start_date` already exists on `clients`. No need to add it again.
