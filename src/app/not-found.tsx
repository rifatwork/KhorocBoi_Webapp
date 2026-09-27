import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center p-8 text-center">
      <div>
        <p className="font-display text-5xl font-bold text-primary">404</p>
        <p className="mt-2 text-muted">This page doesn&apos;t exist.</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-primary-strong px-5 py-3 font-semibold text-on-primary">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
