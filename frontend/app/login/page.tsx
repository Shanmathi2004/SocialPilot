"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed."
        );
      }

      /*
       * Save JWT token.
       *
       * We will use this token later when calling
       * protected backend APIs.
       */
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      /*
       * Save basic user information.
       */
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      /*
       * Send the user to the home page.
       */
      router.push("/");

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

          <div className="text-center mb-8">

            <h1 className="text-3xl font-bold text-slate-900">
              SocialPilot
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Social Media Scheduler & Campaign Management
            </p>

          </div>

          <div className="mb-6">

            <h2 className="text-2xl font-semibold text-slate-900">
              Welcome back
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sign in to manage your social media accounts.
            </p>

          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={`w-full rounded-lg border px-4 py-3 outline-none transition ${
                  email.length > 0 && !emailValid
                    ? "border-red-400"
                    : "border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                }`}
              />

            </div>

            <div>

              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
                >
                  Forgot password?
                </Link>

              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>

          </form>

          <div className="mt-5 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">

            <p className="text-xs text-slate-600">
              Your email must be verified before you can securely access
              your SocialPilot account.
            </p>

            <Link
              href="/verify-email"
              className="mt-1 inline-block text-xs font-medium text-slate-900 hover:underline"
            >
              Verify your email
            </Link>

          </div>

          <div className="my-6 flex items-center gap-3">

            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-xs text-slate-400">
              OR
            </span>

            <div className="h-px flex-1 bg-slate-200" />

          </div>

          <button
            type="button"
            className="w-full rounded-lg border border-slate-300 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Continue with Google
          </button>

          <div className="mt-6 text-center">

            <p className="text-xs text-slate-400">
              Your authentication session is securely
              managed by the SocialPilot backend.
            </p>

          </div>

          <p className="mt-6 text-center text-sm text-slate-500">

            Don't have an account?{" "}

            <Link
              href="/register"
              className="font-medium text-slate-900 hover:underline"
            >
              Create an account
            </Link>

          </p>

        </div>

      </div>

    </main>
  );
}

