"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Post = {
  id: number;
  user_id: number;
  content: string;
  media_url?: string | null;
  status: string;
  scheduled_at?: string | null;
  is_recurring: boolean;
  recurrence_type?: string | null;
  recurrence_end_date?: string | null;
  created_at: string;
  updated_at: string;
};

export default function PostsPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        console.error(err);
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

    return new Date(dateString).toLocaleString();
  };

  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-green-100 text-green-700";

      case "scheduled":
        return "bg-blue-100 text-blue-700";

      case "failed":
        return "bg-red-100 text-red-700";

      case "cancelled":
        return "bg-slate-100 text-slate-700";

      case "queued":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Posts
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View and manage your social media posts.
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/create-post")}
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + Create Post
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading posts...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">
            📝
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No posts yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create your first post to start managing your social media
            content.
          </p>

          <button
            onClick={() => router.push("/dashboard/create-post")}
            className="mt-5 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Create Your First Post
          </button>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
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

                  {post.media_url && (
                    <a
                      href={post.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      🔗 View Media
                    </a>
                  )}
                </div>

                <div className="text-left lg:min-w-[220px] lg:text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Scheduled
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(post.scheduled_at)}
                  </p>

                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Created
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(post.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}