"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const usernameValid = /^[A-Za-z0-9]{3,20}$/.test(username);

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passwordValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;

  const passwordsMatch =
    password.length > 0 &&
    password === confirmPassword;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    // -----------------------------
    // Frontend validation
    // -----------------------------

    if (!usernameValid) {
      setError(
        "Username must contain 3–20 letters or numbers only."
      );
      return;
    }

    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!passwordValid) {
      setError(
        "Please satisfy all password requirements."
      );
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError(
        "You must accept the Terms & Conditions."
      );
      return;
    }

    // -----------------------------
    // Send request to FastAPI
    // -----------------------------

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },

          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            confirm_password: confirmPassword,
          }),
        }
      );

      // Try to read backend response
      const data = await response.json();

      // -----------------------------
      // Backend error
      // -----------------------------

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          setError(
            data.detail
              .map((item: any) => item.msg)
              .join(", ")
          );
        } else {
          setError(
            data.detail ||
              "Registration failed. Please try again."
          );
        }

        return;
      }

      // -----------------------------
      // Registration successful
      // -----------------------------

      setMessage(
        data.message ||
          "Account created successfully. Please check your email."
      );

      // Save email so verification page can use it
      localStorage.setItem(
        "verification_email",
        email
      );

      // Move to verification page
      window.location.href = "/verify-email";

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(
        "Failed to connect to the backend. Make sure the FastAPI server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

          {/* Logo */}

          <div className="text-center mb-8">

            <h1 className="text-3xl font-bold text-slate-900">
              SocialPilot
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Social Media Scheduler & Campaign Management
            </p>

          </div>

          {/* Heading */}

          <div className="mb-6">

            <h2 className="text-2xl font-semibold text-slate-900">
              Create an account
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create your SocialPilot account to get started.
            </p>

          </div>

          {/* Error */}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}

          {message && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {/* Form */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Username */}

            <div>

              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="socialpilot123"
                required
                minLength={3}
                maxLength={20}
                autoComplete="username"
                className={`w-full rounded-lg border px-4 py-3 outline-none transition ${
                  username.length > 0 &&
                  !usernameValid
                    ? "border-red-400"
                    : "border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                }`}
              />

              <p className="mt-1 text-xs text-slate-500">
                3–20 characters. Letters and numbers only.
              </p>

            </div>

            {/* Email */}

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
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={`w-full rounded-lg border px-4 py-3 outline-none transition ${
                  email.length > 0 &&
                  !emailValid
                    ? "border-red-400"
                    : "border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                }`}
              />

              <p className="mt-1 text-xs text-slate-500">
                We'll use this email for account verification.
              </p>

            </div>

            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Create a strong password"
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />

              <div className="mt-3 rounded-lg bg-slate-50 p-3">

                <p className="mb-2 text-xs font-medium text-slate-700">
                  Password must contain:
                </p>

                <PasswordRule
                  valid={passwordRules.length}
                  text="At least 8 characters"
                />

                <PasswordRule
                  valid={passwordRules.uppercase}
                  text="One uppercase letter"
                />

                <PasswordRule
                  valid={passwordRules.lowercase}
                  text="One lowercase letter"
                />

                <PasswordRule
                  valid={passwordRules.number}
                  text="One number"
                />

                <PasswordRule
                  valid={passwordRules.special}
                  text="One special character"
                />

              </div>

            </div>

            {/* Confirm password */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                className={`w-full rounded-lg border px-4 py-3 outline-none transition ${
                  confirmPassword.length > 0 &&
                  !passwordsMatch
                    ? "border-red-400"
                    : "border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                }`}
              />

              {confirmPassword.length > 0 && (
                <p
                  className={`mt-1 text-xs ${
                    passwordsMatch
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {passwordsMatch
                    ? "Passwords match."
                    : "Passwords do not match."}
                </p>
              )}

            </div>

            {/* Terms */}

            <div className="flex items-start gap-3">

              <input
                id="terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) =>
                  setAcceptedTerms(
                    e.target.checked
                  )
                }
                className="mt-1 h-4 w-4"
              />

              <label
                htmlFor="terms"
                className="text-sm text-slate-600"
              >
                I agree to the{" "}

                <Link
                  href="/terms"
                  className="font-medium text-slate-900 hover:underline"
                >
                  Terms & Conditions
                </Link>

                .
              </label>

            </div>

            {/* Create account */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : "Create account"}
            </button>

          </form>

          {/* Divider */}

          <div className="my-6 flex items-center gap-3">

            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-xs text-slate-400">
              OR
            </span>

            <div className="h-px flex-1 bg-slate-200" />

          </div>

          {/* Google */}

          <button
            type="button"
            onClick={() =>
              console.log(
                "Google signup - integration pending"
              )
            }
            className="w-full rounded-lg border border-slate-300 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Continue with Google
          </button>

          {/* Login */}

          <p className="mt-6 text-center text-sm text-slate-500">

            Already have an account?{" "}

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


function PasswordRule({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">

      <span
        className={
          valid
            ? "text-green-600"
            : "text-slate-400"
        }
      >
        {valid ? "✓" : "○"}
      </span>

      <span
        className={
          valid
            ? "text-green-600"
            : "text-slate-500"
        }
      >
        {text}
      </span>

    </div>
  );
}