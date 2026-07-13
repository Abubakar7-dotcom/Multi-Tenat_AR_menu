-- M1 core schema: restaurants, categories, menu_items, admin_users, platform_admins.
-- scan_events and restaurant_billing land in their own migrations with M5 and M4
-- respectively (db-migration skill: don't create a table before the milestone that needs it).
-- Every table gets RLS enabled and policies attached in this same migration — see
-- .claude/skills/db-migration/SKILL.md and PLAN.md section 2.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- platform_admins (create first: restaurants' RLS policies reference it)
-- ---------------------------------------------------------------------------
create table platform_admins (
  id uuid primary key references auth.users(id),
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;

create policy "platform_admins_self_read" on platform_admins for select
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- restaurants
-- ---------------------------------------------------------------------------
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  draft_config jsonb not null default '{}'::jsonb,
  published_config jsonb not null default '{}'::jsonb,
  custom_css text,
  logo_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table restaurants enable row level security;

-- admin_users references restaurants, so it's created next, but its RLS policy on
-- restaurants below needs the table to exist first -- create admin_users now.
create table admin_users (
  id uuid primary key references auth.users(id),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index admin_users_restaurant_id_idx on admin_users(restaurant_id);

alter table admin_users enable row level security;

create policy "admin_users_platform_admin_all" on admin_users for all
  using (exists (select 1 from platform_admins where id = auth.uid()))
  with check (exists (select 1 from platform_admins where id = auth.uid()));

create policy "admin_users_self_read" on admin_users for select
  using (id = auth.uid());

create policy "restaurants_platform_admin_all" on restaurants for all
  using (exists (select 1 from platform_admins where id = auth.uid()))
  with check (exists (select 1 from platform_admins where id = auth.uid()));

create policy "restaurants_own_staff_read" on restaurants for select
  using (id = (select restaurant_id from admin_users where id = auth.uid()));

create policy "restaurants_public_read" on restaurants for select
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create index categories_restaurant_id_idx on categories(restaurant_id);

alter table categories enable row level security;

create policy "categories_platform_admin_all" on categories for all
  using (exists (select 1 from platform_admins where id = auth.uid()))
  with check (exists (select 1 from platform_admins where id = auth.uid()));

create policy "categories_own_staff_all" on categories for all
  using (restaurant_id = (select restaurant_id from admin_users where id = auth.uid()))
  with check (restaurant_id = (select restaurant_id from admin_users where id = auth.uid()));

create policy "categories_public_read" on categories for select
  using (
    exists (
      select 1 from restaurants
      where restaurants.id = categories.restaurant_id
        and restaurants.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  model_glb_url text,
  model_usdz_url text,
  badge_text text,
  is_available boolean not null default true,
  sort_order int not null default 0
);

create index menu_items_restaurant_id_idx on menu_items(restaurant_id);
create index menu_items_category_id_idx on menu_items(category_id);

alter table menu_items enable row level security;

create policy "menu_items_platform_admin_all" on menu_items for all
  using (exists (select 1 from platform_admins where id = auth.uid()))
  with check (exists (select 1 from platform_admins where id = auth.uid()));

create policy "menu_items_own_staff_all" on menu_items for all
  using (restaurant_id = (select restaurant_id from admin_users where id = auth.uid()))
  with check (restaurant_id = (select restaurant_id from admin_users where id = auth.uid()));

create policy "menu_items_public_read" on menu_items for select
  using (
    exists (
      select 1 from restaurants
      where restaurants.id = menu_items.restaurant_id
        and restaurants.is_active = true
    )
  );
-- Note: is_available filtering for the public menu happens in application code
-- (see src/app/r/[slug]/page.tsx), not RLS -- own-staff policy above must still let
-- restaurant staff see/toggle unavailable items from the Merchant Dashboard.
