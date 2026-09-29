"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Post = {
  id: number;
  content: string;
  status: string;
  scheduled_at?: string | null;
  is_recurring: boolean;
  recurrence_type?: string | null;
};

export default function CalendarPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());

  // Edit modal
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPosts = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/api/posts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load posts.");
      }

      const data = await response.json();

      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [router]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
  });

  // ==========================================================
  // CALENDAR DAYS
  // ==========================================================

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();

    const days: {
      day: number;
      currentMonth: boolean;
      date: Date;
    }[] = [];

    // Previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: previousMonthDays - i,
        currentMonth: false,
        date: new Date(year, month - 1, previousMonthDays - i),
      });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        currentMonth: true,
        date: new Date(year, month, day),
      });
    }

    // Next month
    let nextDay = 1;

    while (days.length < 42) {
      days.push({
        day: nextDay,
        currentMonth: false,
        date: new Date(year, month + 1, nextDay),
      });

      nextDay++;
    }

    return days;
  }, [year, month]);

  // ==========================================================
  // POSTS FOR DATE
  // ==========================================================

  const getPostsForDate = (date: Date) => {
    return posts.filter((post) => {
      if (!post.scheduled_at) {
        return false;
      }

      const postDate = new Date(post.scheduled_at);

      return (
        postDate.getFullYear() === date.getFullYear() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getDate() === date.getDate()
      );
    });
  };

  // ==========================================================
  // TODAY
  // ==========================================================

  const today = new Date();

  const isToday = (date: Date) => {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // ==========================================================
  // MONTH NAVIGATION
  // ==========================================================

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // ==========================================================
  // POST LISTS
  // ==========================================================

  const scheduledPosts = posts
    .filter((post) => post.scheduled_at)
    .sort(
      (a, b) =>
        new Date(a.scheduled_at!).getTime() -
        new Date(b.scheduled_at!).getTime()
    );

  const upcomingPosts = scheduledPosts.filter(
    (post) => new Date(post.scheduled_at!).getTime() > Date.now()
  );

  const recurringPosts = scheduledPosts.filter(
    (post) => post.is_recurring
  );

  // ==========================================================
  // STATUS COLORS
  // ==========================================================

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

  const formatTime = (dateString?: string | null) => {
    if (!dateString) {
      return "";
    }

    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================================
  // EDIT POST
  // ==========================================================

  const openEditModal = (post: Post) => {
    setEditingPost(post);

    setEditContent(post.content);

    if (post.scheduled_at) {
      const date = new Date(post.scheduled_at);

      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      );

      setEditScheduledAt(
        localDate.toISOString().slice(0, 16)
      );
    } else {
      setEditScheduledAt("");
    }
  };

  const closeEditModal = () => {
    if (saving) {
      return;
    }

    setEditingPost(null);
    setEditContent("");
    setEditScheduledAt("");
  };

  const updatePost = async () => {
    if (!editingPost) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!editContent.trim()) {
      alert("Post content cannot be empty.");
      return;
    }

    if (!editScheduledAt) {
      alert("Please select a scheduled date and time.");
      return;
    }

    try {
      setSaving(true);

      const scheduledDate = new Date(editScheduledAt);

      const response = await fetch(
        `${API_URL}/api/posts/${editingPost.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: editContent,
            media_url: null,
            campaign_id: null,
            status: "scheduled",
            scheduled_at: scheduledDate.toISOString(),
            is_recurring: editingPost.is_recurring,
            recurrence_type: editingPost.recurrence_type,
            recurrence_end_date: null,
            social_account_ids: [],
          }),
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
          data?.detail || "Failed to update post."
        );
      }

      alert("Post updated successfully.");

      closeEditModal();

      await loadPosts();
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to update post."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // DELETE POST
  // ==========================================================

  const deletePost = async (postId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/posts/${postId}`,
        {
          method: "DELETE",
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
          data?.detail || "Failed to delete post."
        );
      }

      alert("Post deleted successfully.");

      await loadPosts();
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to delete post."
      );
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading calendar...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="mx-auto max-w-7xl">

      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Content Calendar
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Plan, schedule and manage your social media content.
          </p>
        </div>

        <button
          onClick={() =>
            router.push("/dashboard/create-post")
          }
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          + Schedule Post
        </button>

      </div>

      {/* SUMMARY CARDS */}

      <div className="mb-6 grid gap-4 md:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Scheduled Posts
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {scheduledPosts.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Upcoming
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {upcomingPosts.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Recurring
          </p>

          <p className="mt-2 text-3xl font-bold text-purple-600">
            {recurringPosts.length}
          </p>
        </div>

      </div>

      {/* CALENDAR */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* CALENDAR HEADER */}

        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-3">

            <button
              onClick={goToPreviousMonth}
              className="rounded-lg border border-slate-200 px-3 py-2 text-lg text-slate-700 hover:bg-slate-100"
            >
              ←
            </button>

            <h2 className="min-w-[180px] text-center text-xl font-bold text-slate-900">
              {monthName} {year}
            </h2>

            <button
              onClick={goToNextMonth}
              className="rounded-lg border border-slate-200 px-3 py-2 text-lg text-slate-700 hover:bg-slate-100"
            >
              →
            </button>

          </div>

          <button
            onClick={goToToday}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Today
          </button>

        </div>

        {/* WEEK DAYS */}

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">

          {[
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
          ].map((day) => (
            <div
              key={day}
              className="border-r border-slate-200 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              {day}
            </div>
          ))}

        </div>

        {/* CALENDAR GRID */}

        <div className="grid grid-cols-7">

          {calendarDays.map((calendarDay, index) => {

            const dayPosts = getPostsForDate(
              calendarDay.date
            );

            return (
              <div
                key={index}
                className={`min-h-[140px] border-b border-r border-slate-200 p-2 ${
                  !calendarDay.currentMonth
                    ? "bg-slate-50"
                    : "bg-white"
                }`}
              >

                {/* DATE */}

                <div className="mb-2 flex justify-between">

                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday(calendarDay.date) &&
                      calendarDay.currentMonth
                        ? "bg-slate-900 text-white"
                        : calendarDay.currentMonth
                        ? "text-slate-700"
                        : "text-slate-400"
                    }`}
                  >
                    {calendarDay.day}
                  </span>

                  {dayPosts.length > 0 && (
                    <span className="text-xs font-medium text-slate-400">
                      {dayPosts.length}
                    </span>
                  )}

                </div>

                {/* POSTS */}

                <div className="space-y-1">

                  {dayPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className={`rounded-md px-2 py-1.5 text-xs ${getStatusClasses(
                        post.status
                      )}`}
                    >

                      <div className="font-semibold">
                        {formatTime(post.scheduled_at)}
                      </div>

                      <div
                        className="truncate"
                        title={post.content}
                      >
                        {post.content}
                      </div>

                      <div className="mt-2 flex gap-1">

                        <button
                          onClick={() =>
                            openEditModal(post)
                          }
                          className="rounded bg-white/70 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-white"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deletePost(post.id)
                          }
                          className="rounded bg-white/70 px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-white"
                        >
                          Delete
                        </button>

                      </div>

                    </div>
                  ))}

                  {dayPosts.length > 3 && (
                    <div className="px-2 text-xs font-semibold text-slate-500">
                      + {dayPosts.length - 3} more
                    </div>
                  )}

                </div>

              </div>
            );
          })}

        </div>

      </div>

      {/* UPCOMING POSTS */}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">

          <h2 className="text-lg font-semibold text-slate-900">
            Upcoming Scheduled Posts
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your next scheduled social media posts.
          </p>

        </div>

        {upcomingPosts.length === 0 ? (

          <div className="p-8 text-center">

            <div className="text-4xl">
              📅
            </div>

            <p className="mt-3 text-sm text-slate-500">
              No upcoming scheduled posts.
            </p>

            <button
              onClick={() =>
                router.push("/dashboard/create-post")
              }
              className="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Schedule a Post
            </button>

          </div>

        ) : (

          <div className="divide-y divide-slate-200">

            {upcomingPosts.slice(0, 10).map((post) => (

              <div
                key={post.id}
                className="flex flex-col gap-3 p-5 hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
              >

                <div className="min-w-0 flex-1">

                  <div className="mb-2 flex flex-wrap items-center gap-2">

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

                  <p className="break-words text-sm text-slate-800">
                    {post.content}
                  </p>

                </div>

                <div className="flex flex-col gap-2 md:min-w-[220px]">

                  <div className="rounded-lg bg-slate-100 px-4 py-3">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Scheduled For
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {new Date(
                        post.scheduled_at!
                      ).toLocaleString()}
                    </p>

                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        openEditModal(post)
                      }
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deletePost(post.id)
                      }
                      className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* ======================================================
          EDIT MODAL
      ====================================================== */}

      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Scheduled Post
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the post content or schedule.
                </p>
              </div>

              <button
                onClick={closeEditModal}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>

            </div>

            {/* CONTENT */}

            <label className="block text-sm font-semibold text-slate-700">
              Post Content
            </label>

            <textarea
              value={editContent}
              onChange={(event) =>
                setEditContent(event.target.value)
              }
              rows={5}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="Write your post..."
            />

            {/* DATE/TIME */}

            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Scheduled Date & Time
            </label>

            <input
              type="datetime-local"
              value={editScheduledAt}
              onChange={(event) =>
                setEditScheduledAt(event.target.value)
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />

            {/* BUTTONS */}

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={closeEditModal}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={updatePost}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}