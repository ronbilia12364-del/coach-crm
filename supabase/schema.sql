-- ============================================================
-- Coach CRM + Trainee Portal — Supabase Schema
-- ============================================================

-- הפעל UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- LEADS — לידים
-- ============================================================
create table leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  source text check (source in ('instagram', 'facebook', 'other')) default 'instagram',
  status text check (status in ('new', 'messaged', 'call_scheduled', 'converted', 'lost')) default 'new',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CLIENTS — מתאמנים
-- ============================================================
create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null unique,
  email text,
  plan text check (plan in ('trial', '4months', '10months')) not null,
  status text check (status in ('active', 'lead', 'pending', 'inactive')) default 'pending',
  start_date date,
  weight_goal numeric(5,2),
  notes text,
  lead_id uuid references leads(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PAYMENTS — תשלומים
-- ============================================================
create table payments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  amount numeric(10,2) not null,
  month date not null,
  status text check (status in ('paid', 'unpaid', 'partial')) default 'unpaid',
  method text check (method in ('bit', 'paypal', 'credit_card', 'bank_transfer', 'app')),
  notes text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- CALLS — שיחות
-- ============================================================
create table calls (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  type text check (type in ('onboarding', 'followup', 'sales')) not null,
  scheduled_at timestamptz not null,
  completed boolean default false,
  duration_min integer,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- NUTRITION PLANS — תפריטי תזונה
-- ============================================================
create table nutrition_plans (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  name text not null default 'תפריט נוכחי',
  total_calories integer,
  total_protein integer,
  total_carbs integer,
  total_fat integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table meals (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references nutrition_plans(id) on delete cascade not null,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')) not null,
  name text not null,
  description text,
  calories integer,
  protein integer,
  carbs integer,
  fat integer,
  order_index integer default 0
);

-- ============================================================
-- WEIGHT LOG — יומן שקילות
-- ============================================================
create table weight_logs (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  weight numeric(5,2) not null,
  logged_at date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- TRAINING PLANS — תוכניות אימון
-- ============================================================
create table training_plans (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  week_start date not null,
  name text not null default 'שבוע נוכחי',
  created_at timestamptz default now()
);

create table workouts (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references training_plans(id) on delete cascade not null,
  day text check (day in ('sunday','monday','tuesday','wednesday','thursday','friday','saturday')) not null,
  name text not null,
  description text,
  exercises jsonb,
  completed boolean default false,
  completed_at timestamptz,
  client_notes text,
  order_index integer default 0
);

-- ============================================================
-- MEDIA UPLOADS — תמונות וסרטונים
-- ============================================================
create table media_uploads (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  type text check (type in ('body_photo', 'food_photo', 'workout_video')) not null,
  storage_path text not null,
  caption text,
  uploaded_at timestamptz default now()
);

-- ============================================================
-- WHATSAPP LOG — לוג הודעות WhatsApp
-- ============================================================
create table whatsapp_log (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id),
  client_id uuid references clients(id),
  phone text not null,
  message text not null,
  direction text check (direction in ('outgoing', 'incoming')) default 'outgoing',
  status text check (status in ('sent', 'delivered', 'read', 'failed')) default 'sent',
  sent_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on clients(status);
create index on clients(phone);
create index on leads(status);
create index on payments(client_id, month);
create index on calls(scheduled_at);
create index on weight_logs(client_id, logged_at);
create index on workouts(plan_id);
create index on media_uploads(client_id, type);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at before update on leads
  for each row execute function update_updated_at();

create trigger clients_updated_at before update on clients
  for each row execute function update_updated_at();

create trigger nutrition_plans_updated_at before update on nutrition_plans
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table clients enable row level security;
alter table weight_logs enable row level security;
alter table nutrition_plans enable row level security;
alter table meals enable row level security;
alter table training_plans enable row level security;
alter table workouts enable row level security;
alter table media_uploads enable row level security;

-- מתאמן רואה רק את עצמו (לפי טלפון שמאוחסן ב-JWT metadata)
create policy "client sees own data" on clients
  for select using (phone = current_setting('request.jwt.claims', true)::json->>'phone');

create policy "client sees own weight" on weight_logs
  for all using (
    client_id = (select id from clients where phone = current_setting('request.jwt.claims', true)::json->>'phone')
  );

create policy "client sees own nutrition" on nutrition_plans
  for select using (
    client_id = (select id from clients where phone = current_setting('request.jwt.claims', true)::json->>'phone')
  );

create policy "client sees own meals" on meals
  for select using (
    plan_id in (
      select np.id from nutrition_plans np
      join clients c on c.id = np.client_id
      where c.phone = current_setting('request.jwt.claims', true)::json->>'phone'
    )
  );

create policy "client sees own training" on training_plans
  for select using (
    client_id = (select id from clients where phone = current_setting('request.jwt.claims', true)::json->>'phone')
  );

create policy "client updates own workouts" on workouts
  for all using (
    plan_id in (
      select tp.id from training_plans tp
      join clients c on c.id = tp.client_id
      where c.phone = current_setting('request.jwt.claims', true)::json->>'phone'
    )
  );

create policy "client manages own media" on media_uploads
  for all using (
    client_id = (select id from clients where phone = current_setting('request.jwt.claims', true)::json->>'phone')
  );
