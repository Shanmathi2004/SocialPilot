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

type Post = {
  id: number;
  content: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
};

type SocialAccount = {
  id: number;
  platform: string;
  platform_username: string | null;
  display_name: string | null;
  status: string;
};

type PublishingLog = {
  id: number;
  post_id: number;
  platform: string;
  status: string;
  created_at: string;
};

type Campaign = {
  id: number;
  name: string;
  status: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [publishingLogs, setPublishingLogs] = useState<PublishingLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const loadDashboard = async () => {
      try {
        // ---------------------------------------------
        // CURRENT USER
        // ---------------------------------------------

        const userResponse = await fetch(
          `${API_URL}/api/users/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!userResponse.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");

          router.replace("/login");
          return;
        }

        const userData = await userResponse.json();

        setUser(userData.user);

        // ---------------------------------------------
        // POSTS
        // ---------------------------------------------

        try {
          const postsResponse = await fetch(
            `${API_URL}/api/posts`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (postsResponse.ok) {
            const postsData = await postsResponse.json();
            setPosts(postsData);
          }
        } catch (error) {
          console.error("Failed to load posts:", error);
        }

        // ---------------------------------------------
        // SOCIAL ACCOUNTS
        // ---------------------------------------------

        try {
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

            setSocialAccounts(
              socialData.accounts || []
            );
          }
        } catch (error) {
          console.error(
            "Failed to load social accounts:",
            error
          );
        }

        // ---------------------------------------------
        // PUBLISHING LOGS
        // ---------------------------------------------

        try {
          const logsResponse = await fetch(
            `${API_URL}/api/publishing-logs`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (logsResponse.ok) {
            const logsData = await logsResponse.json();

            setPublishingLogs(logsData);
          }
        } catch (error) {
          console.error(
            "Failed to load publishing logs:",
            error
          );
        }

        // ---------------------------------------------
        // CAMPAIGNS
        // ---------------------------------------------

        try {
          const campaignsResponse = await fetch(
            `${API_URL}/api/campaigns`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (campaignsResponse.ok) {
            const campaignsData =
              await campaignsResponse.json();

            setCampaigns(campaignsData);
          }
        } catch (error) {
          console.error(
            "Failed to load campaigns:",
            error
          );
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

    loadDashboard();
  }, [router]);

  // ---------------------------------------------
  // COUNTS
  // ---------------------------------------------

  const totalPosts = posts.length;

  const scheduledPosts = posts.filter(
    (post) => post.status === "scheduled"
  ).length;

  const publishedPosts = posts.filter(
    (post) => post.status === "published"
  ).length;

  const draftPosts = posts.filter(
    (post) => post.status === "draft"
  ).length;

  const connectedAccounts =
    socialAccounts.filter(
      (account) =>
        account.status === "connected"
    ).length;

  const activeCampaigns =
    campaigns.filter(
      (campaign) =>
        campaign.status === "active"
    ).length;

  // ---------------------------------------------
  // LOADING
  // ---------------------------------------------

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <p className="text-slate-600">
          Loading dashboard...
        </p>
      </main>
    );
  }

  // ---------------------------------------------
  // ERROR
  // ---------------------------------------------

  if (error) {
    return (
      <main className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">
          {error}
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // ---------------------------------------------
  // DASHBOARD
  // ---------------------------------------------

  return (
    <div className="space-y-8">

      {/* WELCOME */}

      <section>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {user.username}! 👋
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your social media content,
          campaigns, and publishing activity
          from one place.
        </p>
      </section>

      {/* QUICK ACTIONS */}

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Quick Actions
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          <button
            onClick={() =>
              router.push(
                "/dashboard/create-post"
              )
            }
            className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-400 hover:shadow"
          >
            <div className="text-2xl">
              ✍️
            </div>

            <h3 className="mt-3 font-semibold text-slate-900">
              Create Post
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create a draft or schedule a
              new social media post.
            </p>
          </button>

          <button
            onClick={() =>
              router.push(
                "/dashboard/social-accounts"
              )
            }
            className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-400 hover:shadow"
          >
            <div className="text-2xl">
              📱
            </div>

            <h3 className="mt-3 font-semibold text-slate-900">
              Social Accounts
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Connect and manage your social
              media accounts.
            </p>
          </button>

          <button
            onClick={() =>
              router.push(
                "/dashboard/campaigns"
              )
            }
            className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-400 hover:shadow"
          >
            <div className="text-2xl">
              📢
            </div>

            <h3 className="mt-3 font-semibold text-slate-900">
              Campaigns
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage your marketing
              campaigns.
            </p>
          </button>

          <button
            onClick={() =>
              router.push(
                "/dashboard/analytics"
              )
            }
            className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-400 hover:shadow"
          >
            <div className="text-2xl">
              📊
            </div>

            <h3 className="mt-3 font-semibold text-slate-900">
              Analytics
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              View your publishing and post
              performance.
            </p>
          </button>

        </div>
      </section>

      {/* OVERVIEW */}

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Overview
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL POSTS */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Posts
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalPosts}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/dashboard/posts"
                )
              }
              className="mt-3 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              View posts →
            </button>
          </div>

          {/* SCHEDULED */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Scheduled Posts
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {scheduledPosts}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/dashboard/calendar"
                )
              }
              className="mt-3 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Open calendar →
            </button>
          </div>

          {/* CONNECTED ACCOUNTS */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Connected Accounts
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {connectedAccounts}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/dashboard/social-accounts"
                )
              }
              className="mt-3 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Manage accounts →
            </button>
          </div>

          {/* CAMPAIGNS */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Campaigns
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-600">
              {activeCampaigns}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/dashboard/campaigns"
                )
              }
              className="mt-3 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Manage campaigns →
            </button>
          </div>

        </div>
      </section>

      {/* POST STATUS */}

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Post Status
        </h2>

        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
            <p className="text-sm text-yellow-700">
              Drafts
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-800">
              {draftPosts}
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm text-blue-700">
              Scheduled
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-800">
              {scheduledPosts}
            </p>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm text-green-700">
              Published
            </p>

            <p className="mt-2 text-3xl font-bold text-green-800">
              {publishedPosts}
            </p>
          </div>

        </div>
      </section>

      {/* RECENT POSTS */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Recent Posts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest social media posts.
            </p>
          </div>

          <button
            onClick={() =>
              router.push(
                "/dashboard/posts"
              )
            }
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            View All
          </button>

        </div>

        {posts.length === 0 ? (

          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">

            <p className="text-sm text-slate-500">
              No posts created yet.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/dashboard/create-post"
                )
              }
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create Your First Post
            </button>

          </div>

        ) : (

          <div className="mt-6 space-y-3">

            {posts.slice(0, 5).map(
              (post) => (

                <div
                  key={post.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium text-slate-800">
                        {post.content}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Created:{" "}
                        {new Date(
                          post.created_at
                        ).toLocaleString()}
                      </p>

                      {post.scheduled_at && (
                        <p className="mt-1 text-xs text-blue-600">
                          Scheduled:{" "}
                          {new Date(
                            post.scheduled_at
                          ).toLocaleString()}
                        </p>
                      )}

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        post.status ===
                        "published"
                          ? "bg-green-100 text-green-700"
                          : post.status ===
                            "scheduled"
                          ? "bg-blue-100 text-blue-700"
                          : post.status ===
                            "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {post.status}
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* PUBLISHING ACTIVITY */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Publishing Activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recent publishing activity.
            </p>
          </div>

          <button
            onClick={() =>
              router.push(
                "/dashboard/publishing"
              )
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Publishing
          </button>

        </div>

        {publishingLogs.length === 0 ? (

          <p className="mt-6 text-sm text-slate-500">
            No publishing activity yet.
          </p>

        ) : (

          <div className="mt-6 space-y-3">

            {publishingLogs
              .slice(0, 5)
              .map((log) => (

                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                >

                  <div>

                    <p className="font-medium capitalize text-slate-900">
                      {log.platform}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Post ID: {log.post_id}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(
                        log.created_at
                      ).toLocaleString()}
                    </p>

                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      log.status ===
                      "published"
                        ? "bg-green-100 text-green-700"
                        : log.status ===
                          "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {log.status}
                  </span>

                </div>

              ))}

          </div>

        )}

      </section>

      {/* ACCOUNT INFORMATION */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-slate-900">
          Account Information
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">

          <div>
            <p className="text-sm text-slate-500">
              Username
            </p>

            <p className="mt-1 font-medium text-slate-900">
              {user.username}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Email
            </p>

            <p className="mt-1 font-medium text-slate-900">
              {user.email}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Role
            </p>

            <p className="mt-1 font-medium capitalize text-slate-900">
              {user.role}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Email Verification
            </p>

            <p className="mt-1 font-medium text-slate-900">
              {user.is_email_verified
                ? "Verified ✓"
                : "Not verified"}
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}