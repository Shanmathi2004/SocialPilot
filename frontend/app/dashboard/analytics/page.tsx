"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Post = {
  id: number;
  content: string;
  status: string;
  scheduled_at?: string | null;
  created_at?: string;
};

type PublishingLog = {
  id: number;
  post_id: number;
  platform: string;
  status: string;
  published_at?: string | null;
  error_message?: string | null;
  created_at?: string;
};

export default function AnalyticsPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [logs, setLogs] = useState<PublishingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    loadAnalytics(token);
  }, [router]);

  const loadAnalytics = async (token: string) => {
    try {
      const [postsResponse, logsResponse] = await Promise.all([
        fetch(`${API_URL}/api/posts`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API_URL}/api/publishing-logs`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (
        postsResponse.status === 401 ||
        logsResponse.status === 401
      ) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      if (!postsResponse.ok) {
        throw new Error("Failed to load posts.");
      }

      if (!logsResponse.ok) {
        throw new Error("Failed to load publishing logs.");
      }

      const postsData = await postsResponse.json();
      const logsData = await logsResponse.json();

      setPosts(Array.isArray(postsData) ? postsData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error(error);
      setError("Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  const totalPosts = posts.length;

  const publishedPosts = posts.filter(
    (post) => post.status.toLowerCase() === "published"
  ).length;

  const scheduledPosts = posts.filter(
    (post) => post.status.toLowerCase() === "scheduled"
  ).length;

  const draftPosts = posts.filter(
    (post) => post.status.toLowerCase() === "draft"
  ).length;

  const failedPosts = posts.filter(
    (post) => post.status.toLowerCase() === "failed"
  ).length;

  const successfulLogs = logs.filter(
    (log) => log.status.toLowerCase() === "published"
  ).length;

  const failedLogs = logs.filter(
    (log) => log.status.toLowerCase() === "failed"
  ).length;

  const platformCounts = logs.reduce<Record<string, number>>(
    (result, log) => {
      const platform = log.platform || "unknown";

      result[platform] = (result[platform] || 0) + 1;

      return result;
    },
    {}
  );

  const statusCounts = {
    Published: publishedPosts,
    Scheduled: scheduledPosts,
    Draft: draftPosts,
    Failed: failedPosts,
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) {
      return "0%";
    }

    return `${Math.round((value / total) * 100)}%`;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Analytics
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Monitor your SocialPilot publishing activity and content
          performance.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading analytics...
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}

          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Posts
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalPosts}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                All created posts
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Published
              </p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {publishedPosts}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {formatPercentage(
                  publishedPosts,
                  totalPosts
                )}{" "}
                of all posts
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Scheduled
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {scheduledPosts}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Waiting to publish
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Publishing Logs
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-600">
                {logs.length}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Publishing attempts
              </p>
            </div>
          </div>

          {/* Post Status */}

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Post Status
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current status of your posts.
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Published
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {publishedPosts}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{
                        width: formatPercentage(
                          publishedPosts,
                          totalPosts
                        ),
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Scheduled
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {scheduledPosts}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: formatPercentage(
                          scheduledPosts,
                          totalPosts
                        ),
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Draft
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {draftPosts}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-yellow-500"
                      style={{
                        width: formatPercentage(
                          draftPosts,
                          totalPosts
                        ),
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Failed
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {failedPosts}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{
                        width: formatPercentage(
                          failedPosts,
                          totalPosts
                        ),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Publishing Results */}

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Publishing Results
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Results from publishing activity.
                </p>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2">
                <div className="rounded-lg bg-green-50 p-5">
                  <p className="text-sm text-green-700">
                    Successful
                  </p>

                  <p className="mt-2 text-3xl font-bold text-green-700">
                    {successfulLogs}
                  </p>
                </div>

                <div className="rounded-lg bg-red-50 p-5">
                  <p className="text-sm text-red-700">
                    Failed
                  </p>

                  <p className="mt-2 text-3xl font-bold text-red-700">
                    {failedLogs}
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 p-5">
                  <p className="text-sm text-blue-700">
                    Total Attempts
                  </p>

                  <p className="mt-2 text-3xl font-bold text-blue-700">
                    {logs.length}
                  </p>
                </div>

                <div className="rounded-lg bg-purple-50 p-5">
                  <p className="text-sm text-purple-700">
                    Success Rate
                  </p>

                  <p className="mt-2 text-3xl font-bold text-purple-700">
                    {formatPercentage(
                      successfulLogs,
                      logs.length
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Activity */}

          <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Platform Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Publishing activity grouped by platform.
              </p>
            </div>

            {Object.keys(platformCounts).length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl">📊</div>

                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  No platform activity yet
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Publishing activity will appear here after
                  posts are published.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(platformCounts).map(
                  ([platform, count]) => (
                    <div
                      key={platform}
                      className="rounded-lg border border-slate-200 p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm capitalize text-slate-500">
                            {platform}
                          </p>

                          <p className="mt-2 text-2xl font-bold text-slate-900">
                            {count}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            publishing attempts
                          </p>
                        </div>

                        <div className="text-3xl">
                          {platform.toLowerCase() ===
                            "instagram" && "📸"}

                          {platform.toLowerCase() ===
                            "facebook" && "📘"}

                          {platform.toLowerCase() ===
                            "linkedin" && "💼"}

                          {platform.toLowerCase() ===
                            "youtube" && "▶️"}

                          {(platform.toLowerCase() === "x" ||
                            platform.toLowerCase() ===
                              "twitter") &&
                            "𝕏"}

                          {platform.toLowerCase() ===
                            "pinterest" && "📌"}

                          {![
                            "instagram",
                            "facebook",
                            "linkedin",
                            "youtube",
                            "x",
                            "twitter",
                            "pinterest",
                          ].includes(
                            platform.toLowerCase()
                          ) && "📱"}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Quick Actions
            </h2>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  router.push("/dashboard/create-post")
                }
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                + Create Post
              </button>

              <button
                onClick={() =>
                  router.push("/dashboard/calendar")
                }
                className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                📅 View Calendar
              </button>

              <button
                onClick={() =>
                  router.push("/dashboard/social-accounts")
                }
                className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                📱 Social Accounts
              </button>

              <button
                onClick={() =>
                  router.push("/dashboard/posts")
                }
                className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                📝 View Posts
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}