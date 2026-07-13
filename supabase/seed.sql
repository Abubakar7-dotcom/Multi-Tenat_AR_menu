-- M1 seed data: one hardcoded restaurant for testing the real-data + AR path.
-- image_url values are placeholders -- replace with real R2 URLs once the bucket exists.
--
-- "Zinger Burger" is wired to Google's official model-viewer sample pair
-- (Astronaut.glb/.usdz, CC-BY, github.com/google/model-viewer/tree/master/packages/
-- shared-assets/models) hosted in Supabase Storage (bucket "menu-assets") as a stand-in --
-- this proves the AR mechanism (Scene Viewer + Quick Look, lazy-load) end-to-end before any
-- real photogrammetry output exists. Swap model_glb_url/model_usdz_url for a real optimized
-- dish asset (via .claude/skills/asset-pipeline/optimize.sh, uploaded to R2 per the locked
-- architecture decision) before this restaurant is ever real. See PLAN.md M1 acceptance
-- criteria and CLAUDE.md Hard Rule #4 (versioned URLs, never overwritten in place).

insert into restaurants (id, slug, name, is_active, logo_url)
values (
  '00000000-0000-0000-0000-000000000001',
  'test-bites',
  'Test Bites',
  true,
  null
);

insert into categories (id, restaurant_id, name, sort_order)
values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Burgers', 0),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Sides', 1);

insert into menu_items
  (id, restaurant_id, category_id, name, description, price, image_url, model_glb_url,
   model_usdz_url, badge_text, is_available, sort_order)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000011', 'Zinger Burger',
   'Crispy fried chicken fillet, lettuce, mayo, toasted bun.', 650, null,
   'https://dvmqjkepnykalzelyvki.supabase.co/storage/v1/object/public/menu-assets/test-bites/zinger-burger-v1.glb',
   'https://dvmqjkepnykalzelyvki.supabase.co/storage/v1/object/public/menu-assets/test-bites/zinger-burger-v1.usdz',
   'New', true, 0),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000011', 'Beef Deluxe',
   'Beef patty, cheddar, pickles, house sauce.', 750, null, null, null, null, true, 1),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000012', 'Loaded Fries',
   'Fries topped with cheese sauce and jalapenos.', 450, null, null, null, null, true, 0),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000012', 'Onion Rings',
   'Crispy battered onion rings with dip.', 400, null, null, null, null, true, 1);
