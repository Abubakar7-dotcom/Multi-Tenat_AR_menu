import {
  createSupabaseSessionClient,
  getCurrentRestaurantStaff,
} from "@/lib/supabase/server-session";

const statusLabel: Record<string, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
};

const statusColor: Record<string, string> = {
  trialing: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  past_due: "bg-amber-100 text-amber-700",
  canceled: "bg-gray-100 text-gray-600",
};

// Read-only subscription status + (once Stripe is wired up) a Customer Portal link. Stripe
// integration itself lands in a later pass — this page degrades gracefully if no billing row
// exists yet rather than erroring, since restaurant_billing rows aren't backfilled for
// restaurants created before Stripe was connected.
export default async function DashboardBillingPage() {
  const staff = await getCurrentRestaurantStaff();
  if (!staff) return null; // layout already redirects; satisfies TS narrowing

  const supabase = await createSupabaseSessionClient();
  const { data: billing } = await supabase
    .from("restaurant_billing")
    .select("subscription_status, current_period_end")
    .eq("restaurant_id", staff.restaurantId)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Billing</h1>

      {billing ? (
        <div className="flex flex-col gap-3 rounded border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                statusColor[billing.subscription_status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {statusLabel[billing.subscription_status] ?? billing.subscription_status}
            </span>
          </div>
          {billing.current_period_end ? (
            <p className="text-sm text-gray-600">
              Renews {new Date(billing.current_period_end).toLocaleDateString()}
            </p>
          ) : null}
          <p className="text-xs text-gray-400">
            Manage payment method and invoices via the billing portal (coming soon).
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Billing isn&apos;t set up for this restaurant yet — contact the platform team.
        </p>
      )}
    </main>
  );
}
