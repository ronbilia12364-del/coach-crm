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

---

## 2026-04-21 — Push Notifications subscriptions table

```sql
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on push_subscriptions"
  ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);
```
