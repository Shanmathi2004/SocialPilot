"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type SocialAccount = {
  id: number;
  platform: string;
  platform_username?: string | null;
  display_name?: string | null;
  status: string;
};

type Campaign = {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  budget: number;
  revenue: number;
};

type Post = {
  id: number;
  user_id: number;
  content: string;
  media_url?: string | null;
  campaign_id?: number | null;
  status: string;
  scheduled_at?: string | null;
  is_recurring: boolean;
  recurrence_type?: string | null;
  recurrence_end_date?: string | null;
  created_at: string;
  updated_at: string;
  campaign?: Campaign | null;
  social_accounts: SocialAccount[];
};

export default function PostsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

const campaignFromUrl = searchParams.get("campaign");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const loadPosts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/posts`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            router.replace("/login");
            return;
          }

          throw new Error("Failed to load posts.");
        }

        const data = await response.json();

        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Load posts error:", err);
        setError("Unable to load posts.");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [router]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return "Not scheduled";
    }

    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatPlatform = (platform?: string) => {
    if (!platform) return "Unknown";

    const value = platform.toLowerCase();

    if (value === "instagram") return "Instagram";
    if (value === "facebook") return "Facebook";
    if (value === "linkedin") return "LinkedIn";
    if (value === "youtube") return "YouTube";
    if (value === "twitter" || value === "x") return "X";
    if (value === "pinterest") return "Pinterest";

    return platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  const getPlatformIcon = (platform?: string) => {
    if (!platform) return "🌐";

    const value = platform.toLowerCase();

    if (value === "instagram") return "📸";
    if (value === "facebook") return "📘";
    if (value === "linkedin") return "💼";
    if (value === "youtube") return "▶️";
    if (value === "twitter" || value === "x") return "𝕏";
    if (value === "pinterest") return "📌";

    return "🌐";
  };

  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "scheduled":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "failed":
        return "bg-red-50 text-red-700 border-red-200";

      case "queued":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "cancelled":
        return "bg-slate-100 text-slate-600 border-slate-200";

      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-emerald-500";

      case "scheduled":
        return "bg-blue-500";

      case "failed":
        return "bg-red-500";

      case "queued":
        return "bg-purple-500";

      case "cancelled":
        return "bg-slate-400";

      default:
        return "bg-amber-500";
    }
  };

  const deletePost = async (postId: number) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Failed to delete post."
        );
      }

      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId)
      );
    } catch (error) {
      console.error("Delete post error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete post."
      );
    }
  };

  /*
   * Get unique campaigns from the posts.
   * This allows the campaign filter to automatically
   * show every campaign currently used by posts.
   */
  const campaignOptions = useMemo(() => {
    const campaigns = posts
      .filter((post) => post.campaign)
      .map((post) => post.campaign as Campaign);

    const uniqueCampaigns = Array.from(
      new Map(
        campaigns.map((campaign) => [campaign.id, campaign])
      ).values()
    );

    return uniqueCampaigns.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        searchValue === "" ||
        post.content.toLowerCase().includes(searchValue) ||
        post.campaign?.name?.toLowerCase().includes(searchValue) ||
        post.social_accounts.some(
          (account) =>
            account.platform_username
              ?.toLowerCase()
              .includes(searchValue) ||
            account.display_name
              ?.toLowerCase()
              .includes(searchValue)
        );

      const matchesStatus =
        statusFilter === "all" ||
        post.status.toLowerCase() === statusFilter;

      const matchesPlatform =
        platformFilter === "all" ||
        post.social_accounts.some(
          (account) =>
            account.platform.toLowerCase() === platformFilter
        );

      const matchesCampaign =
        campaignFilter === "all" ||
        post.campaign?.id === Number(campaignFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPlatform &&
        matchesCampaign
      );
    });
  }, [
    posts,
    search,
    statusFilter,
    platformFilter,
    campaignFilter,
  ]);

  const totalPosts = posts.length;

  const draftPosts = posts.filter(
    (post) => post.status.toLowerCase() === "draft"
  ).length;

  const scheduledPosts = posts.filter(
    (post) => post.status.toLowerCase() === "scheduled"
  ).length;

  const publishedPosts = posts.filter(
    (post) => post.status.toLowerCase() === "published"
  ).length;

  const failedPosts = posts.filter(
    (post) => post.status.toLowerCase() === "failed"
  ).length;

  const hasFilters =
    search !== "" ||
    statusFilter !== "all" ||
    platformFilter !== "all" ||
    campaignFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPlatformFilter("all");
    setCampaignFilter("all");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-5">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <span>←</span>
            Dashboard
          </button>

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="mb-1.5 inline-flex rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Content Management
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Posts
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Create, schedule and manage your social media content.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/create-post")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <span className="text-lg leading-none">+</span>
              Create Post
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        {!loading && !error && posts.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {totalPosts}
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Drafts
              </p>

              <p className="mt-1 text-2xl font-bold text-amber-700">
                {draftPosts}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Scheduled
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-700">
                {scheduledPosts}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Published
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {publishedPosts}
              </p>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                Failed
              </p>

              <p className="mt-1 text-2xl font-bold text-red-700">
                {failedPosts}
              </p>
            </div>

          </div>
        )}

        {/* SEARCH + FILTERS */}
        {!loading && !error && posts.length > 0 && (
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">

            <div className="grid gap-2 md:grid-cols-[1fr_170px_170px_190px]">

              {/* SEARCH */}
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  ⌕
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts, campaigns or accounts..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* STATUS FILTER */}
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="queued">Queued</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* PLATFORM FILTER */}
              <select
                value={platformFilter}
                onChange={(e) =>
                  setPlatformFilter(e.target.value)
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                <option value="all">All platforms</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
                <option value="x">X</option>
                <option value="pinterest">Pinterest</option>
              </select>

              {/* CAMPAIGN FILTER */}
              <select
                value={campaignFilter}
                onChange={(e) =>
                  setCampaignFilter(e.target.value)
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                <option value="all">All campaigns</option>

                {campaignOptions.map((campaign) => (
                  <option
                    key={campaign.id}
                    value={campaign.id}
                  >
                    {campaign.name}
                  </option>
                ))}
              </select>

            </div>

            {/* FILTER RESULT / CLEAR */}
            {hasFilters && (
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">

                <p className="text-xs text-slate-400">
                  Showing {filteredPosts.length} of {posts.length}
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-950"
                >
                  Clear filters
                </button>

              </div>
            )}

          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

            <p className="mt-3 text-sm font-medium text-slate-600">
              Loading your posts...
            </p>

          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">

            <p className="text-sm font-bold text-red-800">
              Unable to load posts
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
            >
              Try Again
            </button>

          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && posts.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              📝
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-950">
              No posts yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Create your first post and start managing your social
              media content.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/posts/create")
              }
              className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create Your First Post
            </button>

          </div>
        )}

        {/* NO RESULTS */}
        {!loading &&
          !error &&
          posts.length > 0 &&
          filteredPosts.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
                🔎
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                No matching posts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear Filters
              </button>

            </div>
          )}

        {/* POSTS */}
        {!loading &&
          !error &&
          filteredPosts.length > 0 && (
            <div>

              <div className="mb-3 flex items-center justify-between px-1">

                <div>
                  <h2 className="text-base font-bold text-slate-950">
                    Your Content
                  </h2>

                  <p className="text-xs text-slate-400">
                    {filteredPosts.length} post
                    {filteredPosts.length !== 1 ? "s" : ""}
                  </p>
                </div>

              </div>

              <div className="space-y-3">

                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >

                    {/* COMPACT POST ROW */}
                    <div className="flex flex-col lg:flex-row">

                      {/* MEDIA */}
                      <div className="w-full shrink-0 lg:w-36">

                        {post.media_url ? (
                          <div className="h-48 overflow-hidden bg-slate-100 lg:h-full lg:min-h-[190px]">
                            <img
                              src={post.media_url}
                              alt="Post media"
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                            />
                          </div>
                        ) : (
                          <div className="flex h-32 items-center justify-center bg-slate-50 lg:h-full lg:min-h-[190px]">
                            <div className="text-center">
                              <div className="text-2xl">
                                📝
                              </div>

                              <p className="mt-1 text-[10px] font-medium text-slate-400">
                                No media
                              </p>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* MAIN */}
                      <div className="min-w-0 flex-1">

                        {/* TOP */}
                        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex flex-wrap items-center gap-2">

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusClasses(
                                post.status
                              )}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                  post.status
                                )}`}
                              />

                              {post.status}
                            </span>

                            {post.is_recurring && (
                              <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-purple-700">
                                ↻ {post.recurrence_type || "Recurring"}
                              </span>
                            )}

                            {post.campaign && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                                📣 {post.campaign.name}
                              </span>
                            )}

                          </div>

                          <span className="text-[10px] font-semibold text-slate-400">
                            #{post.id}
                          </span>

                        </div>

                        {/* CONTENT */}
                        <div className="px-4 py-3">

                          <p className="line-clamp-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-800">
                            {post.content}
                          </p>

                          {/* INFO ROW */}
                          <div className="mt-3 flex flex-wrap items-center gap-2">

                            {/* SCHEDULE */}
                            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">

                              <span className="text-sm">
                                🗓️
                              </span>

                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                  Schedule
                                </p>

                                <p className="text-[11px] font-semibold text-slate-700">
                                  {formatDate(post.scheduled_at)}
                                </p>
                              </div>

                            </div>

                            {/* ACCOUNTS */}
                            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">

                              <div className="flex -space-x-1">

                                {post.social_accounts
                                  .slice(0, 4)
                                  .map((account) => (
                                    <span
                                      key={account.id}
                                      title={formatPlatform(
                                        account.platform
                                      )}
                                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-xs shadow-sm"
                                    >
                                      {getPlatformIcon(
                                        account.platform
                                      )}
                                    </span>
                                  ))}

                                {post.social_accounts.length === 0 && (
                                  <span className="text-sm">
                                    🌐
                                  </span>
                                )}

                              </div>

                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                  Publishing To
                                </p>

                                <p className="text-[11px] font-semibold text-slate-700">
                                  {post.social_accounts.length > 0
                                    ? `${post.social_accounts.length} account${
                                        post.social_accounts.length !== 1
                                          ? "s"
                                          : ""
                                      }`
                                    : "No account"}
                                </p>
                              </div>

                            </div>

                            {/* CREATED */}
                            <div className="hidden rounded-lg bg-slate-50 px-3 py-2 xl:block">

                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                Created
                              </p>

                              <p className="text-[11px] font-semibold text-slate-700">
                                {formatDate(post.created_at)}
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* FOOTER */}
                        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">

                          <div className="min-w-0">

                            {post.social_accounts.length > 0 ? (
                              <p className="truncate text-[10px] font-medium text-slate-400">
                                Publishing to{" "}
                                {post.social_accounts
                                  .map((account) =>
                                    formatPlatform(
                                      account.platform
                                    )
                                  )
                                  .join(", ")}
                              </p>
                            ) : (
                              <p className="text-[10px] font-medium text-amber-600">
                                No publishing account selected
                              </p>
                            )}

                          </div>

                          <div className="flex shrink-0 gap-1.5">

                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/dashboard/posts/${post.id}`
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/dashboard/posts/${post.id}/edit`
                                )
                              }
                              className="rounded-lg bg-slate-950 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => deletePost(post.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-100"
                            >
                              Delete
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>

                  </article>
                ))}

              </div>

            </div>
          )}

      </div>
    </div>
  );
}