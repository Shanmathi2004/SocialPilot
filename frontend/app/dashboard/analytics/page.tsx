
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Post = {
  id: number;
  campaign_id?: number | null;
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

type Campaign = {
  id: number;
  name: string;
  status: string;
};

export default function AnalyticsPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [logs, setLogs] = useState<PublishingLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
      setLoading(true);
      setError("");

      const [postsResponse, logsResponse, campaignsResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/posts`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/api/publishing-logs`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/api/campaigns`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      if (
        postsResponse.status === 401 ||
        logsResponse.status === 401 ||
        campaignsResponse.status === 401
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

      if (!campaignsResponse.ok) {
        throw new Error("Failed to load campaigns.");
      }

      const postsData = await postsResponse.json();
      const logsData = await logsResponse.json();
      const campaignsData = await campaignsResponse.json();

      setPosts(Array.isArray(postsData) ? postsData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load analytics."
      );
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

  const successRate =
    logs.length === 0
      ? 0
      : Math.round((successfulLogs / logs.length) * 100);

  const platformCounts = logs.reduce<Record<string, number>>(
    (result, log) => {
      const platform = log.platform || "unknown";

      result[platform] = (result[platform] || 0) + 1;

      return result;
    },
    {}
  );

  const formatPercentage = (
    value: number,
    total: number
  ) => {
    if (total === 0) {
      return "0%";
    }

    return `${Math.round((value / total) * 100)}%`;
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
      case "x":
      case "twitter":
        return "𝕏";
      case "pinterest":
        return "📌";
      default:
        return "📱";
    }
  };

  const getCampaignStats = (campaignId: number) => {
    const campaignPosts = posts.filter(
      (post) => post.campaign_id === campaignId
    );

    const campaignPostIds = new Set(
      campaignPosts.map((post) => post.id)
    );

    const campaignLogs = logs.filter((log) =>
      campaignPostIds.has(log.post_id)
    );

    const published = campaignPosts.filter(
      (post) => post.status.toLowerCase() === "published"
    ).length;

    const scheduled = campaignPosts.filter(
      (post) => post.status.toLowerCase() === "scheduled"
    ).length;

    const failed = campaignPosts.filter(
      (post) => post.status.toLowerCase() === "failed"
    ).length;

    const attempts = campaignLogs.length;

    const successfulAttempts = campaignLogs.filter(
      (log) => log.status.toLowerCase() === "published"
    ).length;

    const rate =
      attempts === 0
        ? 0
        : Math.round(
            (successfulAttempts / attempts) * 100
          );

    return {
      total: campaignPosts.length,
      published,
      scheduled,
      failed,
      attempts,
      rate,
    };
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Analytics
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Monitor SocialPilot publishing activity,
          campaign performance, engagement and audience metrics.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>
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
          {/* SUMMARY */}

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

            <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
              <p className="text-sm text-green-700">
                Published
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {publishedPosts}
              </p>

              <p className="mt-2 text-xs text-green-600">
                {formatPercentage(
                  publishedPosts,
                  totalPosts
                )}{" "}
                of all posts
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <p className="text-sm text-blue-700">
                Scheduled
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {scheduledPosts}
              </p>

              <p className="mt-2 text-xs text-blue-600">
                Waiting to publish
              </p>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
              <p className="text-sm text-purple-700">
                Campaigns
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-700">
                {campaigns.length}
              </p>

              <p className="mt-2 text-xs text-purple-600">
                Campaigns created
              </p>
            </div>
          </div>

          {/* PUBLISHING PERFORMANCE */}

          <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Publishing Performance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Real publishing activity recorded by SocialPilot.
              </p>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
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
                  {successRate}%
                </p>
              </div>
            </div>
          </div>

          {/* ENGAGEMENT ANALYTICS */}

          <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Engagement Analytics
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Social engagement metrics from connected platforms.
              </p>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Likes", "Not available"],
                ["Comments", "Not available"],
                ["Shares", "Not available"],
                ["Reach", "Not available"],
                ["Impressions", "Not available"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-sm text-slate-500">
                    {label}
                  </p>

                  <p className="mt-3 text-lg font-bold text-slate-700">
                    {value}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    Requires platform analytics API
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AUDIENCE GROWTH */}

          <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Audience Growth
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track audience and follower growth across social platforms.
              </p>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Followers
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-700">
                  Not available
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Requires platform account insights
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Growth
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-700">
                  Not available
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Historical follower data required
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Audience Trend
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-700">
                  Not available
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Requires platform analytics API
                </p>
              </div>
            </div>
          </div>

          {/* PLATFORM ACTIVITY */}

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
                  Publishing activity will appear here after posts
                  are published.
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
                          {getPlatformIcon(platform)}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* CAMPAIGN COMPARISON */}

          <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Campaign Comparison
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Compare campaign publishing performance using recorded data.
              </p>
            </div>

            {campaigns.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">
                  No campaigns available for comparison.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto p-6">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Campaign
                      </th>

                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Posts
                      </th>

                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Published
                      </th>

                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Scheduled
                      </th>

                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Attempts
                      </th>

                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Success
                      </th>

                      <th className="px-4 py-3 font-semibold text-slate-700">
                        ROI
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {campaigns.map((campaign) => {
                      const stats = getCampaignStats(
                        campaign.id
                      );

                      return (
                        <tr
                          key={campaign.id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-4 py-4 font-medium text-slate-900">
                            {campaign.name}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {stats.total}
                          </td>

                          <td className="px-4 py-4 text-green-600">
                            {stats.published}
                          </td>

                          <td className="px-4 py-4 text-blue-600">
                            {stats.scheduled}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {stats.attempts}
                          </td>

                          <td className="px-4 py-4 font-semibold text-purple-600">
                            {stats.rate}%
                          </td>

                          <td className="px-4 py-4 text-slate-400">
                            Not available
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <p className="text-xs text-slate-500">
                ROI requires campaign cost and revenue data.
                Engagement and audience metrics require connected
                platform analytics APIs.
              </p>
            </div>
          </div>

          {/* POST STATUS */}

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
                {[
                  {
                    label: "Published",
                    value: publishedPosts,
                    color: "bg-green-500",
                  },
                  {
                    label: "Scheduled",
                    value: scheduledPosts,
                    color: "bg-blue-500",
                  },
                  {
                    label: "Draft",
                    value: draftPosts,
                    color: "bg-yellow-500",
                  },
                  {
                    label: "Failed",
                    value: failedPosts,
                    color: "bg-red-500",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        {item.label}
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        {item.value}
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{
                          width: formatPercentage(
                            item.value,
                            totalPosts
                          ),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DATA AVAILABILITY */}

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Analytics Data Sources
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current availability of analytics data.
                </p>
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
                  <span className="text-sm font-medium text-slate-700">
                    Publishing statistics
                  </span>

                  <span className="font-semibold text-green-700">
                    Available ✓
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
                  <span className="text-sm font-medium text-slate-700">
                    Campaign statistics
                  </span>

                  <span className="font-semibold text-green-700">
                    Available ✓
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-4">
                  <span className="text-sm font-medium text-slate-700">
                    Engagement metrics
                  </span>

                  <span className="font-semibold text-yellow-700">
                    API required
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-4">
                  <span className="text-sm font-medium text-slate-700">
                    Audience growth
                  </span>

                  <span className="font-semibold text-yellow-700">
                    API required
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-4">
                  <span className="text-sm font-medium text-slate-700">
                    ROI
                  </span>

                  <span className="font-semibold text-yellow-700">
                    Cost data required
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}

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
                  router.push("/dashboard/reports")
                }
                className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                📊 Reports
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
