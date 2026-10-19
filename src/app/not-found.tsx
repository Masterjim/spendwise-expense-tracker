import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}
