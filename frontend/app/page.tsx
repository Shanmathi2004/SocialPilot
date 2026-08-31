import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">

      <nav className="border-b border-slate-200 bg-white">

        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          <Link
            href="/"
            className="text-2xl font-bold text-slate-900"
          >
            SocialPilot
          </Link>

          <div className="flex items-center gap-3">

            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Get started
            </Link>

          </div>

        </div>

      </nav>

      <section className="max-w-6xl mx-auto px-6 py-24 text-center">

        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          Manage all your social media
          <span className="block mt-2">
            from one place.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto mt-6 text-lg text-slate-600">
          SocialPilot helps creators, businesses, and marketing teams
          schedule, publish, manage, and analyze social media content.
        </p>

        <div className="mt-8 flex justify-center gap-4">

          <Link
            href="/register"
            className="rounded-lg bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800"
          >
            Create your account
          </Link>

          <Link
            href="/login"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign in
          </Link>

        </div>

      </section>

    </main>
  );
}