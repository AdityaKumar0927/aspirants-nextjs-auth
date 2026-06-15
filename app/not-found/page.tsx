import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="type-display text-7xl leading-none text-ink sm:text-8xl">404</p>
      <h1 className="type-display mt-4 text-2xl text-ink">This page could not be found</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-pencil">
        The page you’re looking for doesn’t exist or may have moved. Let’s get you back to
        studying.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-paper transition-colors hover:bg-ballpoint"
        >
          Back home
        </Link>
        <Link
          href="/question-bank"
          className="inline-flex min-h-11 items-center rounded-md border border-rule bg-paper px-5 text-sm font-medium text-pencil transition-colors hover:border-ballpoint hover:text-ink"
        >
          Go to Question Bank
        </Link>
      </div>
    </div>
  );
}
