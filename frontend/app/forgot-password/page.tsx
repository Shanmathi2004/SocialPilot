"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setMessage(
      "If an account exists for this email, a verification code will be sent."
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

          <div className="text-center mb-8">

            <h1 className="text-3xl font-bold text-slate-900">
              SocialPilot
            </h1>

            <p className="mt-2 text-slate-500">
              Reset your account password
            </p>

          </div>

          <h2 className="text-2xl font-semibold text-slate-900">
            Forgot password?
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Enter the email address associated with your account.
            We will send you a verification code if the account exists.
          </p>

          {error && (
            <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">

            <div>

              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />

            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 py-3 font-medium text-white hover:bg-slate-800 transition"
            >
              Send verification code
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-slate-500">

            Remember your password?{" "}

            <Link
              href="/login"
              className="font-medium text-slate-900 hover:underline"
            >
              Back to login
            </Link>

          </p>

        </div>

      </div>

    </main>
  );
}