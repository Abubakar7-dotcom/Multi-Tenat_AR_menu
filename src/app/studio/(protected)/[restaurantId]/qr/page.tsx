import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { createSupabaseSessionClient } from "@/lib/supabase/server-session";

interface QrPageProps {
  params: Promise<{ restaurantId: string }>;
}

// Print-resolution QR code encoding the restaurant's PERMANENT public URL (slug is immutable —
// see onboard-restaurant SKILL.md step 3). Generated server-side as a PNG data URL; the
// download link just saves that data URL, no separate export step needed.
export default async function StudioQrPage({ params }: QrPageProps) {
  const { restaurantId } = await params;
  const supabase = await createSupabaseSessionClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const targetUrl = `${siteUrl}/r/${restaurant.slug}`;

  const dataUrl = await QRCode.toDataURL(targetUrl, {
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-8 text-center">
      <Link href={`/studio/${restaurant.id}`} className="self-start text-sm underline">
        ← Back to editor
      </Link>
      <h1 className="text-xl font-bold">{restaurant.name} — QR Code</h1>
      <p className="break-all text-xs text-gray-500">{targetUrl}</p>

      {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not a remote asset. */}
      <img
        src={dataUrl}
        alt={`QR code linking to ${targetUrl}`}
        className="w-64 rounded border border-gray-200"
      />

      <a
        href={dataUrl}
        download={`${restaurant.slug}-qr.png`}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Download PNG (1024px)
      </a>

      <p className="text-xs text-gray-400">
        Test scan distance/angle on a physical printout before finalizing print files
        (onboard-restaurant SKILL.md step 3).
      </p>
    </main>
  );
}
