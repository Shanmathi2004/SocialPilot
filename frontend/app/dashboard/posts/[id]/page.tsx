
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Post = {
  id: number;
  content: string;
  media_url?: string | null;
  status: string;
  scheduled_at?: string | null;
  is_recurring?: boolean;
  recurrence_type?: string | null;
  recurrence_end_date?: string | null;
  campaign_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export default function PostDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/posts/${postId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            router.push("/login");
            return;
          }

          throw new Error("Failed to load post");
        }

        const data = await response.json();

        setPost(data.post ?? data);
      } catch (err) {
        console.error(err);
        setError("Unable to load this post.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, router]);

  const formatDate = (date?: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-green-100 text-green-700";
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "draft":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse space-y-4">
            <div className="h-7 w-48 rounded bg-gray-200" />
            <div className="h-4 w-72 rounded bg-gray-200" />
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="mt-4 h-20 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => router.push("/dashboard/posts")}
            className="mb-4 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Posts
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="text-base font-semibold text-red-700">
              Post not found
            </h2>
            <p className="mt-1 text-sm text-red-600">
              {error || "This post could not be loaded."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => router.push("/dashboard/posts")}
              className="mb-1 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              ← Back to Posts
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Post Details
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View  your post
            </p>
          </div>

          
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-4 lg:col-span-2">
            {/* Post Content */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Content
                </h2>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                    post.status
                  )}`}
                >
                  {post.status}
                </span>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {post.content}
                </p>
              </div>
            </div>

            {/* Media */}
            {post.media_url && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-base font-semibold text-gray-900">
                  Media
                </h2>

                <div className="overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={post.media_url}
                    alt="Post media"
                    className="max-h-[420px] w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Post Information */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                Post Information
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Post ID
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    #{post.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-medium capitalize text-gray-800">
                    {post.status}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Campaign
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {post.campaign_id
                      ? `Campaign #${post.campaign_id}`
                      : "No campaign"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Created
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {formatDate(post.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Updated
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {formatDate(post.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                Scheduling
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Scheduled For
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {formatDate(post.scheduled_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Recurring
                  </p>

                  <p className="mt-1 text-sm capitalize text-gray-700">
                    {post.is_recurring
                      ? post.recurrence_type || "Yes"
                      : "No"}
                  </p>
                </div>

                {post.is_recurring && post.recurrence_end_date && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Recurrence Ends
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {formatDate(post.recurrence_end_date)}
                    </p>
                  </div>
                )}
              </div>
            </div>

          
          </div>
        </div>
      </div>
    </div>
  );
}
