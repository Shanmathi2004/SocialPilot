
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

type Platform = {
  name: string;
  key: string;
  icon: string;
  description: string;
  available: boolean;
};

const platforms: Platform[] = [
  {
    name: "Instagram",
    key: "instagram",
    icon: "📸",
    description: "Connect your Instagram Business account.",
    available: true,
  },
  {
    name: "Facebook",
    key: "facebook",
    icon: "📘",
    description: "Connect your Facebook Page.",
    available: true,
  },
  {
    name: "LinkedIn",
    key: "linkedin",
    icon: "💼",
    description: "Connect your LinkedIn profile or company page.",
    available: true,
  },
  {
    name: "YouTube",
    key: "youtube",
    icon: "▶️",
    description: "Connect your YouTube channel.",
    available: true,
  },
  {
    name: "X",
    key: "x",
    icon: "𝕏",
    description: "Connect your X account.",
    available: false,
  },
  {
    name: "Pinterest",
    key: "pinterest",
    icon: "📌",
    description: "Connect your Pinterest business account.",
    available: false,
  },
];

export default function SocialAccountsPage() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectingPlatform, setConnectingPlatform] = useState("");
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);

  // --------------------------------------------------
  // LOAD CONNECTED ACCOUNTS
  // --------------------------------------------------

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
      setError("");

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
        setAccounts(
          data.filter(
            (account: SocialAccount) =>
              account.status?.toLowerCase() === "connected"
          )
        );
      } else if (Array.isArray(data.accounts)) {
        setAccounts(
          data.accounts.filter(
            (account: SocialAccount) =>
              account.status?.toLowerCase() === "connected"
          )
        );
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

  // --------------------------------------------------
  // INSTAGRAM CONNECTION
  // --------------------------------------------------

  const connectInstagram = async () => {
    setError("");
    setConnectingPlatform("instagram");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/social/instagram/login?return_to=/dashboard/social-accounts`,
        {
          method: "GET",
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
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Unable to start Instagram connection."
        );
      }

      const data = await response.json();

      if (!data.login_url) {
        throw new Error("Instagram login URL was not returned.");
      }

      window.location.href = data.login_url;
    } catch (error) {
      console.error("Instagram connection error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect Instagram."
      );

      setConnectingPlatform("");
    }
  };

  // --------------------------------------------------
  // FACEBOOK CONNECTION
  // --------------------------------------------------

  const connectFacebook = async () => {
    setError("");
    setConnectingPlatform("facebook");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/social/facebook/login`,
        {
          method: "GET",
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
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Unable to start Facebook connection."
        );
      }

      const data = await response.json();

      if (!data.login_url) {
        throw new Error("Facebook login URL was not returned.");
      }

      window.location.href = data.login_url;
    } catch (error) {
      console.error("Facebook connection error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect Facebook."
      );

      setConnectingPlatform("");
    }
  };

  // --------------------------------------------------
  // LINKEDIN CONNECTION
  // --------------------------------------------------

  const connectLinkedIn = async () => {
    setError("");
    setConnectingPlatform("linkedin");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/social/linkedin/login`,
        {
          method: "GET",
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
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Unable to start LinkedIn connection."
        );
      }

      const data = await response.json();

      if (!data.login_url) {
        throw new Error("LinkedIn login URL was not returned.");
      }

      window.location.href = data.login_url;
    } catch (error) {
      console.error("LinkedIn connection error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect LinkedIn."
      );

      setConnectingPlatform("");
    }
  };

  // --------------------------------------------------
  // YOUTUBE CONNECTION
  // --------------------------------------------------

  const connectYouTube = async () => {
    setError("");
    setConnectingPlatform("youtube");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/social/youtube/login`,
        {
          method: "GET",
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
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Unable to start YouTube connection."
        );
      }

      const data = await response.json();

      if (!data.login_url) {
        throw new Error("YouTube login URL was not returned.");
      }

      window.location.href = data.login_url;
    } catch (error) {
      console.error("YouTube connection error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect YouTube."
      );

      setConnectingPlatform("");
    }
  };

  // --------------------------------------------------
  // OTHER PLATFORM CONNECTION
  // --------------------------------------------------

  const connectPlatform = (platformName: string) => {
    setError("");
    setConnectingPlatform(platformName.toLowerCase());

    setTimeout(() => {
      setConnectingPlatform("");

      setError(
        `${platformName} connection is coming soon. The Connect button is ready and will be enabled when the ${platformName} integration is added.`
      );
    }, 250);
  };

  // --------------------------------------------------
  // MAIN CONNECT HANDLER
  // --------------------------------------------------

  const handleConnect = async (platform: Platform) => {
    if (platform.key === "instagram") {
      await connectInstagram();
      return;
    }

    if (platform.key === "facebook") {
      await connectFacebook();
      return;
    }

    if (platform.key === "linkedin") {
      await connectLinkedIn();
      return;
    }

    if (platform.key === "youtube") {
      await connectYouTube();
      return;
    }

    connectPlatform(platform.name);
  };

  // --------------------------------------------------
  // DISCONNECT ACCOUNT
  // --------------------------------------------------

  const disconnectAccount = async (accountId: number) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setError("");
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
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Failed to disconnect account."
        );
      }

      setAccounts((currentAccounts) =>
        currentAccounts.filter(
          (account) => account.id !== accountId
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to disconnect account."
      );
    } finally {
      setDisconnectingId(null);
    }
  };

  // --------------------------------------------------
  // PLATFORM ICON
  // --------------------------------------------------

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

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">

      {/* PAGE HEADER */}

      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-xl text-white">
                🔗
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Social Accounts
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Connect and manage your social media accounts from one place.
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold text-emerald-700">
              {accounts.length} Connected
            </p>

            <p className="mt-0.5 text-[11px] text-emerald-600">
              Active social accounts
            </p>
          </div>

        </div>

      </div>

      {/* ERROR / INFO MESSAGE */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-sm">
            ℹ️
          </div>

          <div>
            <p className="text-sm font-semibold text-amber-800">
              Connection information
            </p>

            <p className="mt-0.5 text-xs leading-5 text-amber-700">
              {error}
            </p>
          </div>

        </div>
      )}

      {/* PLATFORM SECTION */}

      <div>

        <div className="mb-3 flex items-end justify-between">

          <div>
            <h2 className="text-base font-bold text-slate-950">
              Connect a platform
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Choose a social platform to connect to SocialPilot.
            </p>
          </div>

          <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500 sm:block">
            4 of 6 available
          </span>

        </div>

        {/* PLATFORM CARDS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {platforms.map((platform) => {

            const isConnecting =
              connectingPlatform === platform.key;

            return (
              <div
                key={platform.key}
                className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition ${
                  platform.available
                    ? "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                }`}
              >

                {/* TOP */}

                <div className="flex items-start justify-between">

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                      platform.key === "instagram"
                        ? "bg-pink-50"
                        : platform.key === "facebook"
                          ? "bg-blue-50"
                          : platform.key === "linkedin"
                            ? "bg-sky-50"
                            : platform.key === "youtube"
                              ? "bg-red-50"
                              : "bg-slate-100"
                    }`}
                  >
                    {platform.icon}
                  </div>

                  {platform.available ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                      Available
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">
                      Coming Soon
                    </span>
                  )}

                </div>

                {/* CONTENT */}

                <div className="mt-4">

                  <h3 className="text-base font-bold text-slate-900">
                    {platform.name}
                  </h3>

                  <p className="mt-1.5 min-h-[38px] text-xs leading-5 text-slate-500">
                    {platform.description}
                  </p>

                </div>

                {/* BUTTON */}

                <button
                  type="button"
                  onClick={() => handleConnect(platform)}
                  disabled={isConnecting}
                  className={`mt-5 w-full rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                    platform.available
                      ? "bg-slate-950 text-white hover:bg-slate-800"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  } ${
                    isConnecting
                      ? "cursor-not-allowed opacity-60"
                      : ""
                  }`}
                >
                  {isConnecting
                    ? "Connecting..."
                    : `Connect ${platform.name}`}
                </button>

                {!platform.available && (
                  <p className="mt-2 text-center text-[9px] text-slate-400">
                    Connection will be enabled soon
                  </p>
                )}

              </div>
            );
          })}

        </div>

      </div>

      {/* CONNECTED ACCOUNTS */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-base font-bold text-slate-950">
              Connected Accounts
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Social accounts currently connected to SocialPilot.
            </p>
          </div>

          {accounts.length > 0 && (
            <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
              {accounts.length} Active
            </span>
          )}

        </div>

        {loading ? (

          <div className="p-10 text-center">

            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

            <p className="mt-3 text-xs text-slate-500">
              Loading connected accounts...
            </p>

          </div>

        ) : accounts.length === 0 ? (

          <div className="px-5 py-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              📱
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-900">
              No accounts connected
            </h3>

            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">
              Connect Instagram, Facebook, LinkedIn, or YouTube now, or connect another platform when its integration becomes available.
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">

              <button
                onClick={connectInstagram}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                Connect Instagram
              </button>

              <button
                onClick={connectFacebook}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
              >
                Connect Facebook
              </button>

              <button
                onClick={connectLinkedIn}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-700"
              >
                Connect LinkedIn
              </button>

              <button
                onClick={connectYouTube}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700"
              >
                Connect YouTube
              </button>

            </div>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {accounts.map((account) => (

              <div
                key={account.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                    {getPlatformIcon(account.platform)}
                  </div>

                  <div className="min-w-0">

                    <div className="flex items-center gap-2">

                      <h3 className="text-sm font-bold capitalize text-slate-900">
                        {account.platform}
                      </h3>

                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-700">
                        Connected
                      </span>

                    </div>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {account.display_name ||
                        account.platform_username ||
                        "Connected account"}
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    disconnectAccount(account.id)
                  }
                  disabled={disconnectingId === account.id}
                  className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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

