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
        return "bg-blue-100 text-blue-700";

      case "queued":
        return "bg-purple-100 text-purple-700";

      case "processing":
        return "bg-yellow-100 text-yellow-700";

      case "published":
        return "bg-green-100 text-green-700";

      case "failed":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Publishing
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage posts waiting to be published.
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

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Queue
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {posts.length}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Posts waiting for publishing
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Scheduled
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {
              posts.filter(
                (post) =>
                  post.status.toLowerCase() === "scheduled"
              ).length
            }
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Scheduled posts
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Processing
          </p>

          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {
              posts.filter(
                (post) =>
                  post.status.toLowerCase() === "processing"
              ).length
            }
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Currently processing
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Publishing Queue
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Posts currently waiting to be published.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading publishing queue...
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">🚀</div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Publishing queue is empty
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create or schedule a post to see it here.
            </p>

            <button
              onClick={() =>
                router.push("/dashboard/create-post")
              }
              className="mt-5 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create Post
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-6 hover:bg-slate-50"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Post #{post.id}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          post.status
                        )}`}
                      >
                        {post.status}
                      </span>

                      {post.is_recurring && (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                          🔁 {post.recurrence_type}
                        </span>
                      )}
                    </div>

                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                      {post.content}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      Scheduled:{" "}
                      {formatDate(post.scheduled_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      onClick={() => publishPost(post.id)}
                      disabled={publishingId === post.id}
                      className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {publishingId === post.id
                        ? "Publishing..."
                        : "Publish Now"}
                    </button>

                    <button
                      onClick={() =>
                        router.push("/dashboard/posts")
                      }
                      className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View Posts
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          <strong>Development note:</strong> publishing currently
          uses the backend simulation and the Instagram platform
          value. Real multi-platform publishing will be connected
          later.
        </p>
      </div>
    </div>
  );
}