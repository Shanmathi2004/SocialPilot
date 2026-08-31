"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validatePassword = (value: string) => {
    return (
      value.length >= 8 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[^A-Za-z0-9]/.test(value)
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validatePassword(password)) {
      setError(
        "Password must contain at least 8 characters, uppercase and lowercase letters, a number, and a special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSuccess("Your password has been reset successfully.");
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

          <div className="text-center">

            <h1 className="text-3xl font-bold text-slate-900">
              Create new password
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Choose a strong password for your SocialPilot account.
            </p>

          </div>

          {error && (
            <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                New password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Create a new password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />

            </div>

            <div>

              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Confirm new password
              </label>

              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />

            </div>

            <div className="text-xs text-slate-500 space-y-1">

              <p>Password must contain:</p>
              <p>• At least 8 characters</p>
              <p>• One uppercase letter</p>
              <p>• One lowercase letter</p>
              <p>• One number</p>
              <p>• One special character</p>

            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 py-3 font-medium text-white hover:bg-slate-800 transition"
            >
              Reset password
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-slate-500">

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