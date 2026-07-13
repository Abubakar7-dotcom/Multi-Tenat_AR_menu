---
name: db-migration
description: Use when adding or altering a Supabase/Postgres table or column for this project — new tables, new columns, index changes. Enforces the RLS-mandatory rule, restaurant_id requirement, migration naming, and TypeScript type regeneration.
---

# DB Migration

Every table in this project is tenant-scoped. A migration that creates a table without RLS
is a critical bug (Hard Rule #1) — restaurant A must never be able to read restaurant B's
rows, even by accident, even temporarily between migration and feature code landing.

## Migration naming

Supabase CLI migrations: `supabase/migrations/<timestamp>_<snake_case_description>.sql`,
e.g. `20260713120000_add_scan_events_table.sql`. Use `supabase migration new <description>`
to generate the timestamped filename rather than hand-rolling it.

## Checklist for every new table

1. **`restaurant_id` column is mandatory** (except `restaurants` itself and any genuinely
   global lookup table — confirm with the team before treating anything as global). Type
   `uuid references restaurants(id)`, `not null`.

2. **Enable RLS immediately, in the same migration that creates the table** — never in a
   follow-up:
   ```sql
   alter table <table_name> enable row level security;
   ```

3. **Apply the RLS policy template** (adjust per role — this is the baseline pattern for
   restaurant-scoped tables):
   ```sql
   -- Staff can only read/write rows belonging to their own restaurant.
   create policy "<table_name>_tenant_isolation"
     on <table_name>
     for all
     using (
       restaurant_id = (
         select restaurant_id from admin_users where id = auth.uid()
       )
     )
     with check (
       restaurant_id = (
         select restaurant_id from admin_users where id = auth.uid()
       )
     );

   -- Public read policy (only if the table is meant to be publicly readable, e.g.
   -- menu_items/categories for the public menu page). Scope narrowly — e.g. only
   -- is_available rows, only for active restaurants — do not default to unrestricted select.
   create policy "<table_name>_public_read"
     on <table_name>
     for select
     using (
       exists (
         select 1 from restaurants
         where restaurants.id = <table_name>.restaurant_id
           and restaurants.is_active = true
       )
     );
   ```
   Never write a policy that trusts a client-supplied `restaurant_id` directly (e.g. from a
   request body or query param) without deriving the allowed `restaurant_id` from
   `auth.uid()` server-side — that reintroduces the cross-tenant leak RLS exists to prevent.

4. **Index `restaurant_id`** on every tenant-scoped table (and any additional foreign keys
   used in hot query paths), since every query filters by it:
   ```sql
   create index <table_name>_restaurant_id_idx on <table_name>(restaurant_id);
   ```

5. **Pooled-connection reminder:** migrations themselves run fine over the direct connection
   (Supabase CLI/dashboard), but confirm the app's runtime `DATABASE_URL` used by
   Next.js/Vercel is the **pooled** pgBouncer string (port 6543), never the direct connection
   — serverless functions exhaust direct connections under concurrent load.

6. **Regenerate TypeScript types** after the migration is applied:
   ```sh
   supabase gen types typescript --project-id <project-ref> --schema public > src/lib/db/types.ts
   ```
   Commit the regenerated types in the same PR as the migration so the two never drift.

7. **Verify RLS isolation** with two test tenants before merging: create rows for tenant A
   and tenant B, authenticate as A's staff user, confirm B's rows are invisible on every new
   query path touching this table (see PLAN.md's testing strategy for the standard two-tenant
   test procedure).

8. Run the `tenant-security-reviewer` subagent on the migration + any new query code before
   merging.
