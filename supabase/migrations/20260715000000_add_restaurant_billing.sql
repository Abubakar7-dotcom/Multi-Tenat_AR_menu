-- M4: restaurant_billing. Deliberately a separate table from `restaurants`, not columns on it
-- (see PLAN.md §2 "Why restaurant_billing is a separate table") -- `restaurants` has a public
-- RLS read policy for the menu page; Stripe IDs must never be reachable through that policy,
-- even accidentally via a future `select *`. This table has NO public/anon policy at all.

create table restaurant_billing (
  restaurant_id uuid primary key references restaurants(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'trialing', -- trialing|active|past_due|canceled
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table restaurant_billing enable row level security;

create policy "billing_platform_admin_all" on restaurant_billing for all
  using (exists (select 1 from platform_admins where id = auth.uid()))
  with check (exists (select 1 from platform_admins where id = auth.uid()));

create policy "billing_own_staff_read" on restaurant_billing for select
  using (restaurant_id = (select restaurant_id from admin_users where id = auth.uid()));
-- No insert/update/delete policy for admin_users -- writes only via the Stripe webhook
-- handler using the service-role key (server-only, never exposed to any client bundle).
-- No public/anon policy at all.
