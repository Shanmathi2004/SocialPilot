"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type SocialAccount = {
  id: number;
  platform: string;
  platform_username?: string | null;
  display_name?: string | null;
  status: string;
};

export default function SocialAccountsPage() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    loadAccounts(token);
  }, [router]);

  const loadAccounts = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/social-accounts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load social accounts.");
      }
      const data = await response.json();

console.log("Social accounts API response:", data);

if (Array.isArray(data)) {
  setAccounts(data);
} else if (Array.isArray(data.accounts)) {
  setAccounts(data.accounts);
} else {
  setAccounts([]);
}
   
    } catch (error) {
      console.error(error);
      setError("Unable to load social accounts.");
    } finally {
      setLoading(false);
    }
  };

  const connectInstagram = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_URL}/api/social/instagram/login`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to start Instagram connection.");
      }

      const data = await response.json();

      if (data.login_url) {
        window.location.href = data.login_url;
      }
    } catch (error) {
      console.error(error);
      setError("Unable to connect Instagram.");
    }
  };

  const disconnectAccount = async (accountId: number) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
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

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to disconnect account.");
      }

      setAccounts((currentAccounts) =>
        currentAccounts.filter((account) => account.id !== accountId)
      );
    } catch (error) {
      console.error(error);
      setError("Unable to disconnect account.");
    } finally {
      setDisconnectingId(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return "📸";
      case "facebook":
        return "📘";
      case "linkedin":
        return "💼";
      case "youtube":
        return "▶️";
      case "twitter":
      case "x":
        return "𝕏";
      case "pinterest":
        return "📌";
      default:
        return "📱";
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Social Accounts
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Connect and manage your social media accounts.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-3xl">📸</div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Instagram
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Connect your Instagram Business account.
          </p>

          <button
            onClick={connectInstagram}
            className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Connect Instagram
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-3xl">📘</div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Facebook
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Facebook integration will be added next.
          </p>

          <button
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
          >
            Coming Soon
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-3xl">💼</div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            LinkedIn
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            LinkedIn integration will be added next.
          </p>

          <button
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
          >
            Coming Soon
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-3xl">▶️</div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            YouTube
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            YouTube integration will be added next.
          </p>

          <button
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
          >
            Coming Soon
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-3xl">𝕏</div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            X
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            X integration will be added next.
          </p>

          <button
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
          >
            Coming Soon
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-3xl">📌</div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Pinterest
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Pinterest integration will be added next.
          </p>

          <button
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
          >
            Coming Soon
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Connected Accounts
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Social accounts currently connected to SocialPilot.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading connected accounts...
            </p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">📱</div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No accounts connected
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Connect Instagram to start managing your social media.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
                    {getPlatformIcon(account.platform)}
                  </div>

                  <div>
                    <h3 className="font-semibold capitalize text-slate-900">
                      {account.platform}
                    </h3>

                    <p className="text-sm text-slate-500">
                      {account.display_name ||
                        account.platform_username ||
                        "Connected account"}
                    </p>

                    <span className="mt-1 inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      {account.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => disconnectAccount(account.id)}
                  disabled={disconnectingId === account.id}
                  className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {disconnectingId === account.id
                    ? "Disconnecting..."
                    : "Disconnect"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}