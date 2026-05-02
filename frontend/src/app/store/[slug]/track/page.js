import Link from "next/link";
import TrackOrderClient from "./TrackOrderClient";

export default function TrackOrderPage({ params }) {
  const slug = params?.slug || "";

  return (
    <main className="min-h-screen storefront-shell">
      <div className="storefront-orb orb-1" />
      <div className="storefront-orb orb-2" />
      <div className="storefront-orb orb-3" />

      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <div className="storefront-hero card-outline fade-up rounded-[32px] p-6 sm:p-7">
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="badge">Order tracking</p>
              <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Track your order status</h1>
              <p className="mt-2 text-sm text-ink/70">Enter your phone number to see your recent orders and delivery progress.</p>
            </div>
            <Link
              href={`/store/${slug}`}
              className="secondary-cta"
            >
              Back to storefront
            </Link>
          </div>
        </div>

        <TrackOrderClient slug={slug} />
      </div>
    </main>
  );
}
