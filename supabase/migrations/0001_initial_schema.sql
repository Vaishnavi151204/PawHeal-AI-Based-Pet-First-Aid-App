-- PawHeal Initial PostgreSQL Schema & Row Level Security Policies
-- Covers: profiles, pets, injury_assessments, chat_sessions, chat_messages,
--         vaccinations, medications, appointments, health_records

create extension if not exists "pgcrypto";

-- Shared trigger function to maintain updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- 1. Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  phone text default '' not null,
  emergency_vet_contact text default '' not null,
  notifications_enabled boolean default true not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 2. Pets
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 1),
  species text not null check (species in ('Dog', 'Cat', 'Bird', 'Rabbit', 'Other')),
  breed text default '' not null,
  age_years numeric(4,1) not null check (age_years >= 0 and age_years <= 40),
  gender text not null default 'Unknown' check (gender in ('Male', 'Female', 'Unknown')),
  weight_kg numeric(6,2) not null check (weight_kg > 0 and weight_kg <= 250),
  allergies text default '' not null,
  medical_history text default '' not null,
  photo_url text default '' not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create index if not exists idx_pets_user_id on public.pets(user_id);

create trigger trg_pets_updated_at
  before update on public.pets
  for each row execute function public.handle_updated_at();

-- 3. Injury Assessments
create table if not exists public.injury_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  body_area text not null,
  symptoms text default '' not null,
  image_storage_path text default '' not null,
  visible_observations jsonb default '[]'::jsonb not null,
  possible_category text not null,
  urgency_level text not null check (urgency_level in ('low', 'moderate', 'urgent', 'emergency')),
  safe_immediate_actions jsonb default '[]'::jsonb not null,
  actions_to_avoid jsonb default '[]'::jsonb not null,
  veterinary_recommendation text not null,
  emergency_warning_signs jsonb default '[]'::jsonb not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create index if not exists idx_injury_assessments_user_created
  on public.injury_assessments(user_id, created_at desc);

create trigger trg_injury_assessments_updated_at
  before update on public.injury_assessments
  for each row execute function public.handle_updated_at();

-- 4. Chat Sessions
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  title text not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create index if not exists idx_chat_sessions_user_updated
  on public.chat_sessions(user_id, updated_at desc);

create trigger trg_chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute function public.handle_updated_at();

-- 5. Chat Messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  urgency_flag text not null default 'routine' check (urgency_flag in ('routine', 'monitor', 'urgent_vet')),
  suggested_follow_ups jsonb default '[]'::jsonb not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create index if not exists idx_chat_messages_session_created
  on public.chat_messages(session_id, created_at asc);

-- 6. Vaccinations
create table if not exists public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  vaccine_name text not null,
  administered_date date not null,
  next_due_date date,
  clinic_name text default '' not null,
  notes text default '' not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create index if not exists idx_vaccinations_user_pet on public.vaccinations(user_id, pet_id);

-- 7. Medications
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  start_date date not null,
  end_date date,
  reminder_time time not null default '09:00',
  active boolean not null default true,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create index if not exists idx_medications_user_pet on public.medications(user_id, pet_id);

-- 8. Appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  title text not null,
  clinic_name text default '' not null,
  appointment_at timestamptz not null,
  reason text default '' not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create index if not exists idx_appointments_user_at on public.appointments(user_id, appointment_at);

-- 9. Health Records (Weight logs & clinical notes)
create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  record_type text not null check (record_type in ('weight', 'note')),
  title text default '' not null,
  weight_kg numeric(6,2) check (weight_kg is null or (weight_kg > 0 and weight_kg <= 250)),
  notes text default '' not null,
  recorded_at timestamptz default timezone('utc', now()) not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create index if not exists idx_health_records_user_pet on public.health_records(user_id, pet_id, recorded_at desc);

-- Enable Row Level Security across all tables
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.injury_assessments enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.vaccinations enable row level security;
alter table public.medications enable row level security;
alter table public.appointments enable row level security;
alter table public.health_records enable row level security;

-- Ownership RLS policies
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage own pets" on public.pets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own assessments" on public.injury_assessments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own chat sessions" on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own chat messages" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own vaccinations" on public.vaccinations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own medications" on public.medications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own appointments" on public.appointments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own health records" on public.health_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
