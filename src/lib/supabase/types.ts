// Hand-written placeholder matching supabase/migrations/*_init_core_tables.sql.
// Regenerate against the real project once it's linked: `npm run db:types`
// (see .claude/skills/db-migration/SKILL.md, step 6). Do not hand-edit after that point.
//
// Shape (Row/Insert/Update/Relationships per table, plus top-level Views/Functions) is
// dictated by @supabase/postgrest-js's GenericSchema/GenericTable — required even when empty,
// or the typed query builder silently falls back to `never` for every column.

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          draft_config: Record<string, unknown>;
          published_config: Record<string, unknown>;
          custom_css: string | null;
          logo_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["restaurants"]["Row"]> & {
          slug: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["restaurants"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          restaurant_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          model_glb_url: string | null;
          model_usdz_url: string | null;
          badge_text: string | null;
          is_available: boolean;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_items"]["Row"]> & {
          restaurant_id: string;
          category_id: string;
          name: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_users: {
        Row: {
          id: string;
          restaurant_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_users"]["Row"]> & {
          id: string;
          restaurant_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_users"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "admin_users_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_admins: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["platform_admins"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_admins"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
