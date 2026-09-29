"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Campaign = {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
};

type Post = {
  id: number;
  campaign_id?: number | null;
  content: string;
  status: string;
  scheduled_at?: string | null;
  created_at?: string;
};

type CampaignStats = {
  total: number;
  published: number;
  scheduled: number;
  draft: number;
  failed: number;
};

export default function CampaignsPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    loadCampaignData(token);
  }, [router]);

  const loadCampaignData = async (token: string) => {
    try {
      setError("");

      const [campaignsResponse, postsResponse] = await Promise.all([
        fetch(`${API_URL}/api/campaigns`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API_URL}/api/posts`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (
        campaignsResponse.status === 401 ||
        postsResponse.status === 401
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

      const campaignsData = await campaignsResponse.json();
      const postsData = await postsResponse.json();

      setCampaigns(
        Array.isArray(campaignsData) ? campaignsData : []
      );

      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error) {
      console.error(error);
      setError("Unable to load campaign data.");
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Campaign name is required.");
      return;
    }

    if (
      startDate &&
      endDate &&
      new Date(endDate).getTime() <
        new Date(startDate).getTime()
    ) {
      setError("End date must be after the start date.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to create campaign."
        );
      }

      setCampaigns((current) => [data, ...current]);

      setName("");
      setDescription("");
      setStatus("active");
      setStartDate("");
      setEndDate("");

      setSuccess("Campaign created successfully.");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create campaign."
      );
    } finally {
      setCreating(false);
    }
  };

  const getCampaignStats = (
    campaignId: number
  ): CampaignStats => {
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

  const getStatusClasses = (campaignStatus: string) => {
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

  const formatDate = (date?: string | null) => {
    if (!date) {
      return "Not set";
    }

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Campaigns
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Create and manage your social media campaigns.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* CREATE CAMPAIGN */}

      <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Create Campaign
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create a campaign to organize and track your posts.
          </p>
        </div>

        <form onSubmit={createCampaign} className="p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Campaign Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Example: Summer Product Launch"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe your campaign..."
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating
                ? "Creating..."
                : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>

      {/* CAMPAIGNS */}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Your Campaigns
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Campaigns created in your SocialPilot account.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading campaigns...
            </p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">📢</div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No campaigns yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create your first campaign using the form above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {campaigns.map((campaign) => {
              const stats = getCampaignStats(campaign.id);

              return (
                <div
                  key={campaign.id}
                  className="p-6 hover:bg-slate-50"
                >
                  {/* CAMPAIGN HEADER */}

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {campaign.name}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            campaign.status
                          )}`}
                        >
                          {campaign.status}
                        </span>
                      </div>

                      {campaign.description && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {campaign.description}
                        </p>
                      )}
                    </div>

                    <div className="rounded-lg bg-slate-100 px-5 py-3 lg:min-w-[220px]">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-400">
                            Start
                          </p>

                          <p className="mt-1 font-medium text-slate-800">
                            {formatDate(
                              campaign.start_date
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            End
                          </p>

                          <p className="mt-1 font-medium text-slate-800">
                            {formatDate(
                              campaign.end_date
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CAMPAIGN TRACKING */}

                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-semibold text-slate-800">
                      Campaign Tracking
                    </h4>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">
                          Total Posts
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {stats.total}
                        </p>
                      </div>

                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <p className="text-xs text-green-600">
                          Published
                        </p>

                        <p className="mt-1 text-2xl font-bold text-green-700">
                          {stats.published}
                        </p>
                      </div>

                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="text-xs text-blue-600">
                          Scheduled
                        </p>

                        <p className="mt-1 text-2xl font-bold text-blue-700">
                          {stats.scheduled}
                        </p>
                      </div>

                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <p className="text-xs text-yellow-600">
                          Draft
                        </p>

                        <p className="mt-1 text-2xl font-bold text-yellow-700">
                          {stats.draft}
                        </p>
                      </div>

                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-xs text-red-600">
                          Failed
                        </p>

                        <p className="mt-1 text-2xl font-bold text-red-700">
                          {stats.failed}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* VIEW POSTS */}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        router.push("/dashboard/posts")
                      }
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      View All Posts
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        router.push("/dashboard/create-post")
                      }
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Create Campaign Post
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}