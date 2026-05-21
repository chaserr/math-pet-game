-- ============================================================
-- 数字积木大冒险 — Supabase 数据库初始化脚本
-- 用法：Supabase 控制台 → SQL Editor → 粘贴本文件 → Run
-- ============================================================

-- 1. 玩家档案（与 auth.users 一对一）
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  points      integer not null default 0,
  main_level  integer not null default 1,
  created_at  timestamptz not null default now()
);

-- 2. 玩家拥有的宠物
create table if not exists public.user_pets (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  pet_id      text not null,
  level       integer not null default 1,
  exp         integer not null default 0,
  intimacy    integer not null default 0,
  last_fed_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, pet_id)
);

-- 3. 玩家口粮库存
create table if not exists public.user_foods (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  food_id   text not null,
  quantity  integer not null default 0,
  unique (user_id, food_id)
);

-- 4. 玩家解锁状态
create table if not exists public.user_unlocks (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  unlock_key  text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, unlock_key)
);

-- 5. 答题历史（错题本基础）
create table if not exists public.answer_history (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  question    text not null,
  answer      integer not null,
  user_answer integer,
  is_correct  boolean not null,
  error_count integer not null default 0,
  time_ms     integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_history_user on public.answer_history(user_id);

-- ============================================================
-- 注册时自动创建 profile 行
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 行级安全（RLS）：每个玩家只能读写自己的数据
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.user_pets     enable row level security;
alter table public.user_foods    enable row level security;
alter table public.user_unlocks  enable row level security;
alter table public.answer_history enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own pets" on public.user_pets;
create policy "own pets" on public.user_pets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own foods" on public.user_foods;
create policy "own foods" on public.user_foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own unlocks" on public.user_unlocks;
create policy "own unlocks" on public.user_unlocks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own history" on public.answer_history;
create policy "own history" on public.answer_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 原子加积分函数（避免读改写竞态）
-- ============================================================
create or replace function public.add_points(delta integer)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare new_points integer;
begin
  update public.profiles
    set points = points + delta
    where id = auth.uid()
    returning points into new_points;
  return new_points;
end;
$$;
