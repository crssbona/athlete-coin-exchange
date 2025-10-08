-- Execute este SQL no editor SQL do Supabase
-- (Acesse: Projeto > SQL Editor > Nova Query)

-- Create enum for user roles
create type public.app_role as enum ('sponsor', 'sponsored');

-- Create user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (user_id, role)
);

alter table public.user_roles enable row level security;

create policy "Users can view their own roles"
    on public.user_roles for select using (auth.uid() = user_id);

create policy "Users can insert their own roles"
    on public.user_roles for insert with check (auth.uid() = user_id);

-- Update profiles table
alter table public.profiles 
add column if not exists document varchar(18) unique,
add column if not exists phone varchar(20),
add column if not exists active_role app_role default 'sponsor';

-- Update trigger to create profile with new structure
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public 
as $$
begin
  insert into public.profiles (id, name, phone, document)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'first_name' || ' ' || new.raw_user_meta_data->>'last_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'document_number'
  );
  return new;
end;
$$;

-- Recreate trigger if exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Security definer function
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- User tokens table
create table public.user_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    athlete_id text not null,
    quantity integer not null default 0,
    purchase_price decimal(10,2) not null,
    purchased_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_tokens enable row level security;

create policy "Users can view their own tokens" on public.user_tokens for select using (auth.uid() = user_id);
create policy "Users can insert their own tokens" on public.user_tokens for insert with check (auth.uid() = user_id);

-- Athlete tokens table
create table public.athlete_tokens (
    id uuid primary key default gen_random_uuid(),
    athlete_id text unique not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    total_tokens integer not null default 1000000,
    available_tokens integer not null default 1000000,
    price_per_token decimal(10,2) not null default 10.00,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.athlete_tokens enable row level security;

create policy "Anyone can view athlete tokens" on public.athlete_tokens for select to authenticated using (true);
create policy "Athletes can manage their own tokens" on public.athlete_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Athlete videos table
create table public.athlete_videos (
    id uuid primary key default gen_random_uuid(),
    athlete_id text not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    youtube_url text not null,
    title text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.athlete_videos enable row level security;

create policy "Anyone can view athlete videos" on public.athlete_videos for select to authenticated using (true);
create policy "Athletes can manage their own videos" on public.athlete_videos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- User watchlist table
create table public.user_watchlist (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    athlete_id text not null,
    added_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (user_id, athlete_id)
);

alter table public.user_watchlist enable row level security;

create policy "Users can view their own watchlist" on public.user_watchlist for select using (auth.uid() = user_id);
create policy "Users can insert their own watchlist" on public.user_watchlist for insert with check (auth.uid() = user_id);
create policy "Users can delete their own watchlist" on public.user_watchlist for delete using (auth.uid() = user_id);
