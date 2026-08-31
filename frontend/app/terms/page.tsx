import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">

      <div className="max-w-3xl mx-auto">

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

          <h1 className="text-3xl font-bold text-slate-900">
            Terms & Conditions
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            SocialPilot
          </p>

          <div className="mt-8 space-y-6 text-slate-700">

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                1. Acceptance of Terms
              </h2>

              <p className="mt-2">
                By creating and using a SocialPilot account, you agree to
                follow these Terms & Conditions and use the platform
                responsibly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                2. Account Responsibility
              </h2>

              <p className="mt-2">
                You are responsible for maintaining the security of your
                account credentials and for activity performed through your
                account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                3. Social Media Accounts
              </h2>

              <p className="mt-2">
                SocialPilot may connect with third-party social media
                platforms. Users are responsible for complying with the
                policies and terms of those platforms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                4. Content
              </h2>

              <p className="mt-2">
                Users are responsible for the content they create, schedule,
                and publish through SocialPilot.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                5. Account Security
              </h2>

              <p className="mt-2">
                SocialPilot will use reasonable security measures to protect
                account information. Users should use strong passwords and
                protect their login credentials.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                6. Changes
              </h2>

              <p className="mt-2">
                These terms may be updated as the SocialPilot platform
                develops.
              </p>
            </section>

          </div>

          <div className="mt-10">

            <Link
              href="/register"
              className="text-sm font-medium text-slate-900 hover:underline"
            >
              Back to Create Account
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}