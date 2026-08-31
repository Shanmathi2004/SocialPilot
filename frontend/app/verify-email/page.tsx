"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

export default function VerifyEmailPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail =
      localStorage.getItem("verification_email");

    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Email address is missing. Please register again."
      );
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError(
        "Please enter a valid 6-digit verification code."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Email verification failed."
        );
      }

      setMessage(
        "Email verified successfully. Redirecting to login..."
      );

      // Verification is complete.
      localStorage.removeItem("verification_email");

      setTimeout(() => {
        router.push("/login");
      }, 1500);

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

          <div className="text-center">

            <h1 className="text-3xl font-bold text-slate-900">
              Verify your email
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Enter the 6-digit verification code sent to your email address.
            </p>

            {email && (
              <p className="mt-2 text-sm font-medium text-slate-700">
                {email}
              </p>
            )}

          </div>

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

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >

            <div>

              <label
                htmlFor="code"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Verification code
              </label>

              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value.replace(/\D/g, "")
                  )
                }
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center tracking-[0.4em] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 py-3 font-medium text-white hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Verifying..."
                : "Verify email"}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-slate-500">

            Already verified?{" "}

            <Link
              href="/login"
              className="font-medium text-slate-900 hover:underline"
            >
              Sign in
            </Link>

          </p>

        </div>

      </div>

    </main>
  );
}

