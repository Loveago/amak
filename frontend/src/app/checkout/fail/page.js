import Link from "next/link";

export default function CheckoutFailPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-6 pb-20 pt-20">
        <div className="card-outline rounded-3xl bg-white/90 p-10 text-center">
          <p className="badge">Payment failed</p>
          <h1 className="mt-4 font-display text-3xl text-ink md:text-4xl">We could not complete the payment.</h1>
          <p className="mt-3 text-sm text-ink/70">
            Please try again or switch payment methods. Your cart is still reserved.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/checkout"
              className="rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Retry checkout
            </Link>
            <Link
              href="/store/ama-store"
              className="rounded-full border border-ink/20 bg-white/70 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
            >
              Return to store
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
