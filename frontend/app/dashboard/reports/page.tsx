"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Campaign = {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
};

type Post = {
  id: number;
  campaign_id?: number | null;
  content: string;
  status: string;
  scheduled_at?: string | null;
};

type PublishingLog = {
  id: number;
  post_id: number;
  platform: string;
  status: string;
  published_at?: string | null;
  error_message?: string | null;
};

type CampaignReport = {
  total: number;
  published: number;
  scheduled: number;
  draft: number;
  failed: number;
};

export default function ReportsPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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

    loadReportData(token);
  }, [router]);

  const loadReportData = async (token: string) => {
    try {
      setLoading(true);
      setError("");

      const [campaignsResponse, postsResponse, logsResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/campaigns`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

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
        ]);

      if (
        campaignsResponse.status === 401 ||
        postsResponse.status === 401 ||
        logsResponse.status === 401
      ) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      if (!campaignsResponse.ok) {
        throw new Error("Failed to load campaigns.");
      }

      if (!postsResponse.ok) {
        throw new Error("Failed to load posts.");
      }

      if (!logsResponse.ok) {
        throw new Error("Failed to load publishing logs.");
      }

      const campaignsData = await campaignsResponse.json();
      const postsData = await postsResponse.json();
      const logsData = await logsResponse.json();

      setCampaigns(
        Array.isArray(campaignsData) ? campaignsData : []
      );

      setPosts(
        Array.isArray(postsData) ? postsData : []
      );

      setLogs(
        Array.isArray(logsData) ? logsData : []
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  const getReport = (
    campaignId: number
  ): CampaignReport => {
    const campaignPosts = posts.filter(
      (post) => post.campaign_id === campaignId
    );

    return {
      total: campaignPosts.length,

      published: campaignPosts.filter(
        (post) => post.status.toLowerCase() === "published"
      ).length,

      scheduled: campaignPosts.filter(
        (post) => post.status.toLowerCase() === "scheduled"
      ).length,

      draft: campaignPosts.filter(
        (post) => post.status.toLowerCase() === "draft"
      ).length,

      failed: campaignPosts.filter(
        (post) => post.status.toLowerCase() === "failed"
      ).length,
    };
  };

  const getSuccessRate = (
    report: CampaignReport
  ) => {
    if (report.total === 0) {
      return 0;
    }

    return Math.round(
      (report.published / report.total) * 100
    );
  };

  const formatDate = (
    date?: string | null
  ) => {
    if (!date) {
      return "Not set";
    }

    return new Date(date).toLocaleDateString();
  };

  const getStatusClasses = (
    campaignStatus: string
  ) => {
    switch (campaignStatus.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";

      case "completed":
        return "bg-blue-100 text-blue-700";

      case "paused":
        return "bg-yellow-100 text-yellow-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const exportCSV = () => {
    const rows = [
      [
        "Campaign",
        "Status",
        "Total Posts",
        "Published",
        "Scheduled",
        "Draft",
        "Failed",
        "Success Rate",
      ],
    ];

    campaigns.forEach((campaign) => {
      const report = getReport(campaign.id);
      const successRate = getSuccessRate(report);

      rows.push([
        campaign.name,
        campaign.status,
        String(report.total),
        String(report.published),
        String(report.scheduled),
        String(report.draft),
        String(report.failed),
        `${successRate}%`,
      ]);
    });

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${value.replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "socialpilot-campaign-report.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const totalPublished = posts.filter(
    (post) => post.status.toLowerCase() === "published"
  ).length;

  const totalScheduled = posts.filter(
    (post) => post.status.toLowerCase() === "scheduled"
  ).length;

  const totalDraft = posts.filter(
    (post) => post.status.toLowerCase() === "draft"
  ).length;

  const totalFailed = posts.filter(
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
      : Math.round(
          (successfulLogs / logs.length) * 100
        );

  return (
    <div className="mx-auto max-w-6xl">
      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Reports
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View campaign performance and publishing statistics.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={exportCSV}
            disabled={campaigns.length === 0}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ↓ Export CSV
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/campaigns")
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            ← Campaigns
          </button>
        </div>
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
            Generating reports...
          </p>
        </div>
      ) : (
        <>
          {/* OVERALL SUMMARY */}

          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Posts
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {posts.length}
              </p>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
              <p className="text-sm text-green-700">
                Published
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {totalPublished}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <p className="text-sm text-blue-700">
                Scheduled
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {totalScheduled}
              </p>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
              <p className="text-sm text-purple-700">
                Campaigns
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-700">
                {campaigns.length}
              </p>
            </div>
          </div>

          {/* PUBLISHING SUMMARY */}

          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Publishing Summary
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          {/* CAMPAIGN REPORTS */}

          {campaigns.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="text-4xl">📊</div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No campaign reports yet
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Create a campaign and assign posts to it
                to generate a report.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/campaigns")
                }
                className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {campaigns.map((campaign) => {
                const report = getReport(campaign.id);
                const campaignSuccessRate =
                  getSuccessRate(report);

                return (
                  <div
                    key={campaign.id}
                    className="rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* CAMPAIGN HEADER */}

                    <div className="border-b border-slate-200 p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-900">
                              {campaign.name}
                            </h2>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                campaign.status
                              )}`}
                            >
                              {campaign.status}
                            </span>
                          </div>

                          {campaign.description && (
                            <p className="mt-2 text-sm text-slate-500">
                              {campaign.description}
                            </p>
                          )}
                        </div>

                        <div className="text-sm text-slate-500">
                          <p>
                            <span className="font-medium text-slate-700">
                              Start:
                            </span>{" "}
                            {formatDate(campaign.start_date)}
                          </p>

                          <p className="mt-1">
                            <span className="font-medium text-slate-700">
                              End:
                            </span>{" "}
                            {formatDate(campaign.end_date)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CAMPAIGN PERFORMANCE */}

                    <div className="p-6">
                      <h3 className="mb-4 text-sm font-semibold text-slate-800">
                        Campaign Performance
                      </h3>

                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs text-slate-500">
                            Total Posts
                          </p>

                          <p className="mt-1 text-2xl font-bold text-slate-900">
                            {report.total}
                          </p>
                        </div>

                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                          <p className="text-xs text-green-600">
                            Published
                          </p>

                          <p className="mt-1 text-2xl font-bold text-green-700">
                            {report.published}
                          </p>
                        </div>

                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <p className="text-xs text-blue-600">
                            Scheduled
                          </p>

                          <p className="mt-1 text-2xl font-bold text-blue-700">
                            {report.scheduled}
                          </p>
                        </div>

                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                          <p className="text-xs text-yellow-600">
                            Draft
                          </p>

                          <p className="mt-1 text-2xl font-bold text-yellow-700">
                            {report.draft}
                          </p>
                        </div>

                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                          <p className="text-xs text-red-600">
                            Failed
                          </p>

                          <p className="mt-1 text-2xl font-bold text-red-700">
                            {report.failed}
                          </p>
                        </div>
                      </div>

                      {/* SUCCESS RATE */}

                      <div className="mt-6 rounded-lg border border-slate-200 p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Campaign Success Rate
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Published posts compared with all
                              campaign posts.
                            </p>
                          </div>

                          <p className="text-2xl font-bold text-slate-900">
                            {campaignSuccessRate}%
                          </p>
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-slate-900 transition-all"
                            style={{
                              width: `${campaignSuccessRate}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            router.push("/dashboard/posts")
                          }
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          View Posts
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            router.push("/dashboard/analytics")
                          }
                          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        >
                          View Analytics
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* OTHER POST COUNTS */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
              <p className="text-sm text-yellow-700">
                Draft Posts
              </p>

              <p className="mt-2 text-2xl font-bold text-yellow-700">
                {totalDraft}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm text-red-700">
                Failed Posts
              </p>

              <p className="mt-2 text-2xl font-bold text-red-700">
                {totalFailed}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}