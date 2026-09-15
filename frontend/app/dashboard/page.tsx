"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  is_email_verified: boolean;
};

type SocialAccount = {
  id: number;
  platform: string;
  platform_user_id: string;
  platform_username: string | null;
  display_name: string | null;
  status: string;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPlatforms, setShowPlatforms] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);

  // ==========================================================
  // LOAD DASHBOARD DATA
  // ==========================================================

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const getDashboardData = async () => {
      try {
        // ====================================================
        // GET CURRENT USER
        // ====================================================

        const response = await fetch(
          `${API_URL}/api/users/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");

          router.replace("/login");
          return;
        }

        const data = await response.json();

        setUser(data.user);

        // ====================================================
        // GET CONNECTED SOCIAL ACCOUNTS
        // ====================================================

        const socialResponse = await fetch(
          `${API_URL}/api/social-accounts`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (socialResponse.ok) {
          const socialData = await socialResponse.json();

          setSocialAccounts(socialData.accounts);
        }
      } catch (error) {
        console.error(error);

        setError(
          "Unable to connect to the backend."
        );
      } finally {
        setLoading(false);
      }
    };

    getDashboardData();
  }, [router]);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    router.replace("/login");
  };

  // ==========================================================
  // INSTAGRAM CONNECTION
  // ==========================================================
const handleInstagramConnect = async () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    alert("Please log in again.");
    return;
  }

  const response = await fetch(
    `${API_URL}/api/social/instagram/login`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    alert("Unable to start Instagram connection.");
    return;
  }

  const data = await response.json();

  window.location.href = data.login_url;
};
 
  // ==========================================================
  // DISCONNECT SOCIAL ACCOUNT
  // ==========================================================

  const handleDisconnect = async (accountId: number) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to disconnect this social account?"
    );

    if (!confirmed) {
      return;
    }

    setDisconnectingId(accountId);

    try {
      const response = await fetch(
        `${API_URL}/api/social-accounts/${accountId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        alert("Failed to disconnect the account.");
        return;
      }

      // Remove the account from the dashboard
      // Update the account status on the dashboard
setSocialAccounts((accounts) =>
  accounts.map((account) =>
    account.id === accountId
      ? { ...account, status: "disconnected" }
      : account
  )
);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to connect to the backend."
      );
    } finally {
      setDisconnectingId(null);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">
          Loading dashboard...
        </p>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <main className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              SocialPilot
            </h1>

            <p className="text-sm text-slate-500">
              Social Media Scheduler & Campaign Management
            </p>

          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Logout
          </button>

        </div>

      </header>

      {/* =====================================================
          MAIN DASHBOARD
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* ===================================================
            WELCOME
        ==================================================== */}

        <div className="mb-8">

          <h2 className="text-3xl font-bold text-slate-900">
            TEST DASHBOARD - {user.username}!
          </h2>

          <p className="mt-2 text-slate-500">
            Manage your social media accounts and scheduled posts.
          </p>

        </div>

        {/* ===================================================
            ACCOUNT INFORMATION
        ==================================================== */}

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Account Information
          </h3>

          <div className="space-y-2 text-sm">

            <p>
              <span className="font-medium text-slate-700">
                Username:
              </span>{" "}
              {user.username}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Email:
              </span>{" "}
              {user.email}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Role:
              </span>{" "}
              {user.role}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Email verified:
              </span>{" "}
              {user.is_email_verified
                ? "Yes ✓"
                : "No"}
            </p>

          </div>

        </div>

        {/* ===================================================
            DASHBOARD CARDS
        ==================================================== */}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* =================================================
              SOCIAL ACCOUNTS
          ================================================== */}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-slate-900">
              Social Accounts
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Connect Facebook, Instagram, LinkedIn, X, YouTube and Pinterest.
            </p>

            {/* =============================================
                CONNECTED ACCOUNTS
            ============================================== */}

            {socialAccounts.length > 0 && (

              <div className="mt-5 space-y-3">

                {socialAccounts
  .filter((account) => account.status === "connected")
  .map((account) => (

                  <div
                    key={account.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="font-semibold capitalize text-slate-900">
                          {account.platform}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          @{account.platform_username}
                        </p>

                      </div>

                      <span
  className={`text-sm font-medium ${
    account.status === "connected"
      ? "text-green-600"
      : "text-slate-500"
  }`}
>
  ●{" "}
  {account.status === "connected"
    ? "Connected"
    : "Disconnected"}
</span>

                    </div>

                    {/* ===================================
                        DISCONNECT BUTTON
                    ==================================== */}

                    <button
                      onClick={() =>
                        handleDisconnect(account.id)
                      }
                      disabled={
                        disconnectingId === account.id
                      }
                      className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {disconnectingId === account.id
                        ? "Disconnecting..."
                        : "Disconnect"}
                    </button>

                  </div>

                ))}

              </div>

            )}

            {/* =============================================
                NO ACCOUNTS
            ============================================== */}

            {socialAccounts.length === 0 && (

              <p className="mt-5 text-sm text-slate-500">
                No social accounts connected yet.
              </p>

            )}

            {/* =============================================
                CONNECT ACCOUNT BUTTON
            ============================================== */}

            <button
onClick={() => {
  setShowPlatforms(true);
}}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Connect Account
            </button>

          </div>

          {/* =================================================
              CREATE POST
          ================================================== */}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-slate-900">
              Create Post
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create content and publish it to your connected social accounts.
            </p>

            <button
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create Post
            </button>

          </div>

          {/* =================================================
              SCHEDULED POSTS
          ================================================== */}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-slate-900">
              Scheduled Posts
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              View and manage your scheduled social media posts.
            </p>

            <button
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              View Schedule
            </button>

          </div>

        </div>

        {/* ===================================================
            PLATFORM SELECTION
        ==================================================== */}

        {showPlatforms && (

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-xl font-semibold text-slate-900">
                  Connect a Social Account
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Choose a platform to connect to SocialPilot.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowPlatforms(false)
                }
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                Close
              </button>

            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {/* ===========================================
                  INSTAGRAM
              ============================================ */}

              <button
                onClick={handleInstagramConnect}
                className="rounded-lg border border-slate-200 p-5 text-left hover:bg-slate-50"
              >

                <h4 className="font-semibold text-slate-900">
                  Instagram
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Connect your Instagram account.
                </p>

              </button>

              {/* ===========================================
                  FACEBOOK
              ============================================ */}

              <button
                className="rounded-lg border border-slate-200 p-5 text-left hover:bg-slate-50"
              >

                <h4 className="font-semibold text-slate-900">
                  Facebook
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Connect your Facebook account.
                </p>

              </button>

              {/* ===========================================
                  LINKEDIN
              ============================================ */}

              <button
                className="rounded-lg border border-slate-200 p-5 text-left hover:bg-slate-50"
              >

                <h4 className="font-semibold text-slate-900">
                  LinkedIn
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Connect your LinkedIn account.
                </p>

              </button>

              {/* ===========================================
                  X
              ============================================ */}

              <button
                className="rounded-lg border border-slate-200 p-5 text-left hover:bg-slate-50"
              >

                <h4 className="font-semibold text-slate-900">
                  X
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Connect your X account.
                </p>

              </button>

              {/* ===========================================
                  YOUTUBE
              ============================================ */}

              <button
                className="rounded-lg border border-slate-200 p-5 text-left hover:bg-slate-50"
              >

                <h4 className="font-semibold text-slate-900">
                  YouTube
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Connect your YouTube account.
                </p>

              </button>

              {/* ===========================================
                  PINTEREST
              ============================================ */}

              <button
                className="rounded-lg border border-slate-200 p-5 text-left hover:bg-slate-50"
              >

                <h4 className="font-semibold text-slate-900">
                  Pinterest
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Connect your Pinterest account.
                </p>

              </button>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}