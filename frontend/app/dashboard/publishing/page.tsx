"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type QueuePost = {
  id: number;
  content: string;
  status: string;
  scheduled_at?: string | null;
  is_recurring: boolean;
  recurrence_type?: string | null;
};

export default function PublishingPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<QueuePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    loadQueue(token);
  }, [router]);

  const loadQueue = async (token: string) => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/publishing-queue`,
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
        throw new Error("Failed to load publishing queue.");
      }

      const data = await response.json();

      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setError("Unable to load publishing queue.");
    } finally {
      setLoading(false);
    }
  };

  const publishPost = async (postId: number) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setError("");
    setSuccess("");
    setPublishingId(postId);

    try {
      const response = await fetch(
        `${API_URL}/api/publishing/publish/${postId}?platform=instagram`,
        {
          method: "POST",
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to publish post."
        );
      }

      setSuccess(
        `Post #${postId} was added to the publishing queue.`
      );

      await loadQueue(token);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to publish post."
      );
    } finally {
      setPublishingId(null);
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) {
      return "Not scheduled";
    }

    return new Date(date).toLocaleString();
  };

  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-50 text-blue-700 border border-blue-100";

      case "queued":
        return "bg-purple-50 text-purple-700 border border-purple-100";

      case "processing":
        return "bg-amber-50 text-amber-700 border border-amber-100";

      case "published":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";

      case "failed":
        return "bg-red-50 text-red-700 border border-red-100";

      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const scheduledCount = posts.filter(
    (post) => post.status.toLowerCase() === "scheduled"
  ).length;

  const processingCount = posts.filter(
    (post) => post.status.toLowerCase() === "processing"
  ).length;

  const queuedCount = posts.filter(
    (post) => post.status.toLowerCase() === "queued"
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">

      {/* PAGE HEADER */}

      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xl text-white shadow-sm">
              🚀
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Publishing
                </h1>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  Publishing Engine
                </span>
              </div>

              <p className="mt-1.5 text-sm text-slate-500">
                Manage scheduled and queued posts waiting to be published.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/create-post")}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Create Post
          </button>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-sm">
            ⚠️
          </div>

          <div>
            <p className="text-sm font-semibold text-red-800">
              Publishing error
            </p>

            <p className="mt-0.5 text-xs leading-5 text-red-700">
              {error}
            </p>
          </div>

        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm">
            ✓
          </div>

          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Publishing started
            </p>

            <p className="mt-0.5 text-xs leading-5 text-emerald-700">
              {success}
            </p>
          </div>

        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Queue
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {posts.length}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Total posts in queue
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">
              📋
            </div>

          </div>

        </div>

        {/* SCHEDULED */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Scheduled
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {scheduledCount}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Waiting for scheduled time
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg">
              🗓️
            </div>

          </div>

        </div>

        {/* QUEUED */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Queued
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-600">
                {queuedCount}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Ready for processing
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-lg">
              📥
            </div>

          </div>

        </div>

        {/* PROCESSING */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Processing
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-600">
                {processingCount}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Currently publishing
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg">
              ⚡
            </div>

          </div>

        </div>

      </div>

      {/* PUBLISHING QUEUE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* SECTION HEADER */}

        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-base font-bold text-slate-950">
              Publishing Queue
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Posts currently waiting to be published.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/posts")}
            className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            View All Posts
          </button>

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="px-5 py-16 text-center">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

            <p className="mt-4 text-xs font-medium text-slate-500">
              Loading publishing queue...
            </p>

          </div>

        ) : posts.length === 0 ? (

          /* EMPTY STATE */

          <div className="px-5 py-16 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
              🚀
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-950">
              Publishing queue is empty
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
              Create or schedule a post to start building your publishing queue.
            </p>

            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/create-post")
                }
                className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Create Post
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/calendar")
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Open Calendar
              </button>

            </div>

          </div>

        ) : (

          /* QUEUE ITEMS */

          <div className="divide-y divide-slate-100">

            {posts.map((post) => (

              <div
                key={post.id}
                className="p-5 transition hover:bg-slate-50/70 sm:p-6"
              >

                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                  {/* POST INFORMATION */}

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                        Post #{post.id}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${getStatusClasses(
                          post.status
                        )}`}
                      >
                        {post.status}
                      </span>

                      {post.is_recurring && (
                        <span className="rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700">
                          🔁 {post.recurrence_type || "Recurring"}
                        </span>
                      )}

                    </div>

                    {/* CONTENT */}

                    <div className="mt-4 max-w-3xl">

                      <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                        {post.content}
                      </p>

                    </div>

                    {/* META */}

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500">

                      <span className="flex items-center gap-1.5">
                        🗓️
                        <span>
                          {formatDate(post.scheduled_at)}
                        </span>
                      </span>

                      {post.is_recurring && (
                        <span className="flex items-center gap-1.5">
                          🔁
                          <span>
                            {post.recurrence_type || "Recurring"}
                          </span>
                        </span>
                      )}

                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">

                    <button
                      type="button"
                      onClick={() => publishPost(post.id)}
                      disabled={publishingId === post.id}
                      className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {publishingId === post.id
                        ? "Publishing..."
                        : "Publish Now"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/posts/${post.id}`
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      View Post
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* DEVELOPMENT NOTE */}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">

        <div className="flex items-start gap-3">

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-sm">
            💡
          </div>

          <div>
            <p className="text-xs font-bold text-amber-900">
              Publishing status
            </p>

            <p className="mt-1 text-[11px] leading-5 text-amber-800">
              Publishing currently uses the backend simulation
              and the Instagram platform value. Real
              multi-platform publishing can be connected later.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}