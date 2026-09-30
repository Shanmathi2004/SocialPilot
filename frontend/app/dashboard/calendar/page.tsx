"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  status: string;
};

type Post = {
  id: number;
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

type CalendarDay = {
  day: number;
  currentMonth: boolean;
  date: Date;
};

export default function CalendarPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayPosts, setSelectedDayPosts] = useState<Post[]>([]);

  // --------------------------------------------------
  // LOAD POSTS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // CURRENT MONTH
  // --------------------------------------------------

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
  });

  // --------------------------------------------------
  // CALENDAR DAYS
  // --------------------------------------------------

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const firstDay = new Date(year, month, 1).getDay();

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const previousMonthDays = new Date(
      year,
      month,
      0
    ).getDate();

    const days: CalendarDay[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: previousMonthDays - i,
        currentMonth: false,
        date: new Date(
          year,
          month - 1,
          previousMonthDays - i
        ),
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        currentMonth: true,
        date: new Date(year, month, day),
      });
    }

    let nextDay = 1;

    while (days.length % 7 !== 0) {
      days.push({
        day: nextDay,
        currentMonth: false,
        date: new Date(
          year,
          month + 1,
          nextDay
        ),
      });

      nextDay++;
    }

    return days;
  }, [year, month]);

  // --------------------------------------------------
  // POSTS FOR DATE
  // --------------------------------------------------

  const getPostsForDate = (date: Date) => {
    return posts
      .filter((post) => {
        if (!post.scheduled_at) {
          return false;
        }

        const postDate = new Date(post.scheduled_at);

        return (
          postDate.getFullYear() === date.getFullYear() &&
          postDate.getMonth() === date.getMonth() &&
          postDate.getDate() === date.getDate()
        );
      })
      .sort((a, b) => {
        return (
          new Date(a.scheduled_at!).getTime() -
          new Date(b.scheduled_at!).getTime()
        );
      });
  };

  // --------------------------------------------------
  // TODAY
  // --------------------------------------------------

  const today = new Date();

  const isToday = (date: Date) => {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // --------------------------------------------------
  // MONTH NAVIGATION
  // --------------------------------------------------

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(year, month - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(year, month + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // --------------------------------------------------
  // COUNTS
  // --------------------------------------------------

  const scheduledPosts = posts
    .filter((post) => post.scheduled_at)
    .sort(
      (a, b) =>
        new Date(a.scheduled_at!).getTime() -
        new Date(b.scheduled_at!).getTime()
    );

  const upcomingPosts = scheduledPosts.filter(
    (post) =>
      new Date(post.scheduled_at!).getTime() >
      Date.now()
  );

  const recurringPosts = scheduledPosts.filter(
    (post) => post.is_recurring
  );

  const publishedPosts = posts.filter(
    (post) =>
      post.status.toLowerCase() === "published"
  );

  // --------------------------------------------------
  // STATUS
  // --------------------------------------------------

  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";

      case "scheduled":
        return "bg-blue-50 text-blue-700 border-blue-100";

      case "failed":
        return "bg-red-50 text-red-700 border-red-100";

      case "cancelled":
        return "bg-slate-100 text-slate-600 border-slate-200";

      case "queued":
        return "bg-purple-50 text-purple-700 border-purple-100";

      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
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

      default:
        return "bg-amber-500";
    }
  };

  // --------------------------------------------------
  // FORMATTING
  // --------------------------------------------------

  const formatTime = (
    dateString?: string | null
  ) => {
    if (!dateString) {
      return "";
    }

    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (
    dateString?: string | null
  ) => {
    if (!dateString) {
      return "Not scheduled";
    }

    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatPlatform = (platform: string) => {
    const value = platform.toLowerCase();

    if (value === "instagram") return "Instagram";
    if (value === "facebook") return "Facebook";
    if (value === "linkedin") return "LinkedIn";
    if (value === "youtube") return "YouTube";

    if (value === "twitter" || value === "x") {
      return "X";
    }

    if (value === "pinterest") {
      return "Pinterest";
    }

    return platform;
  };

  const getPlatformIcon = (platform: string) => {
    const value = platform.toLowerCase();

    if (value === "instagram") return "◎";
    if (value === "facebook") return "f";
    if (value === "linkedin") return "in";
    if (value === "youtube") return "▶";

    if (value === "twitter" || value === "x") {
      return "𝕏";
    }

    if (value === "pinterest") return "P";

    return "•";
  };

  // --------------------------------------------------
  // VIEW POST
  // --------------------------------------------------

  const viewPost = (postId: number) => {
    if (!postId) {
      console.error("Invalid post ID:", postId);
      return;
    }

    setSelectedDay(null);
    setSelectedDayPosts([]);

    router.push(`/dashboard/posts/${postId}`);
  };

  // --------------------------------------------------
  // EDIT POST
  // --------------------------------------------------

  const editPost = (postId: number) => {
    if (!postId) {
      console.error("Invalid post ID:", postId);
      return;
    }

    console.log("Opening edit page for post:", postId);

    // Close modal before navigation
    setSelectedDay(null);
    setSelectedDayPosts([]);

    // IMPORTANT:
    // This must match:
    // app/dashboard/posts/[id]/edit/page.tsx
    router.push(`/dashboard/posts/${postId}/edit`);
  };

  // --------------------------------------------------
  // SCHEDULE POST
  // --------------------------------------------------

  const schedulePost = () => {
    router.push("/dashboard/create-post");
  };

  // --------------------------------------------------
  // OPEN DAY MODAL
  // --------------------------------------------------

  const openDayModal = (date: Date) => {
    const dayPosts = getPostsForDate(date);

    if (dayPosts.length === 0) {
      return;
    }

    setSelectedDay(date);
    setSelectedDayPosts(dayPosts);
  };

  const closeDayModal = () => {
    setSelectedDay(null);
    setSelectedDayPosts([]);
  };

  // --------------------------------------------------
  // DELETE POST
  // --------------------------------------------------

  const deletePost = async (postId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

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

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to delete post."
        );
      }

      setSelectedDayPosts((current) =>
        current.filter(
          (post) => post.id !== postId
        )
      );

      setPosts((current) =>
        current.filter(
          (post) => post.id !== postId
        )
      );
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to delete post."
      );
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

            <p className="mt-3 text-xs font-medium text-slate-500">
              Loading calendar...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-800">
            Unable to load calendar
          </p>

          <p className="mt-1 text-xs text-red-600">
            {error}
          </p>

          <button
            onClick={loadPosts}
            className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="mx-auto max-w-7xl space-y-3 pb-4">

      {/* HEADER */}

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">

        <div className="flex min-w-0 items-center gap-2.5">

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm text-white">
            ▦
          </div>

          <div className="min-w-0">

            <div className="flex items-center gap-2">

              <h1 className="truncate text-base font-bold tracking-tight text-slate-950">
                Content Calendar
              </h1>

              <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-500 sm:inline-flex">
                Planning
              </span>

            </div>

            <p className="hidden text-[10px] text-slate-400 sm:block">
              Plan and manage your scheduled content.
            </p>

          </div>

        </div>

        <div className="flex shrink-0 items-center gap-1.5">

          <button
            onClick={goToToday}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Today
          </button>

          <button
            onClick={schedulePost}
            className="rounded-lg bg-slate-950 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Schedule Post
          </button>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-4 gap-1.5">

        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-medium text-slate-500">
              Scheduled
            </span>

            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          </div>

          <p className="mt-0.5 text-base font-bold text-slate-900">
            {scheduledPosts.length}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-medium text-slate-500">
              Upcoming
            </span>

            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          </div>

          <p className="mt-0.5 text-base font-bold text-indigo-600">
            {upcomingPosts.length}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-medium text-slate-500">
              Recurring
            </span>

            <span className="text-[10px] text-purple-500">
              ↻
            </span>
          </div>

          <p className="mt-0.5 text-base font-bold text-purple-600">
            {recurringPosts.length}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-medium text-slate-500">
              Published
            </span>

            <span className="text-[10px] text-emerald-500">
              ✓
            </span>
          </div>

          <p className="mt-0.5 text-base font-bold text-emerald-600">
            {publishedPosts.length}
          </p>
        </div>

      </div>

      {/* CALENDAR */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* TOOLBAR */}

        <div className="flex h-10 items-center justify-between border-b border-slate-200 px-2.5 sm:px-3">

          <div className="flex items-center gap-1">

            <button
              onClick={goToPreviousMonth}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
            >
              ←
            </button>

            <h2 className="min-w-[105px] text-center text-xs font-bold text-slate-900">
              {monthName} {year}
            </h2>

            <button
              onClick={goToNextMonth}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
            >
              →
            </button>

          </div>

          <div className="hidden items-center gap-2.5 sm:flex">

            <span className="flex items-center gap-1 text-[8px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Scheduled
            </span>

            <span className="flex items-center gap-1 text-[8px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Published
            </span>

            <span className="flex items-center gap-1 text-[8px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Failed
            </span>

          </div>

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
              className="border-r border-slate-200 px-1 py-1 text-center text-[8px] font-bold uppercase tracking-wide text-slate-400"
            >
              <span className="sm:hidden">
                {day.slice(0, 1)}
              </span>

              <span className="hidden sm:inline">
                {day}
              </span>
            </div>
          ))}

        </div>

        {/* CALENDAR GRID */}

        <div className="grid grid-cols-7">

          {calendarDays.map(
            (calendarDay, index) => {
              const dayPosts =
                getPostsForDate(calendarDay.date);

              const visiblePosts =
                dayPosts.slice(0, 2);

              const remainingCount =
                dayPosts.length -
                visiblePosts.length;

              return (
                <div
                  key={index}
                  className={`group relative min-h-[92px] border-b border-r border-slate-200 p-1 transition hover:bg-slate-50 sm:min-h-[104px] ${
                    !calendarDay.currentMonth
                      ? "bg-slate-50/70"
                      : "bg-white"
                  }`}
                >

                  {/* DATE */}

                  <div className="mb-0.5 flex items-center justify-between">

                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold ${
                        isToday(calendarDay.date) &&
                        calendarDay.currentMonth
                          ? "bg-slate-950 text-white"
                          : calendarDay.currentMonth
                            ? "text-slate-600"
                            : "text-slate-300"
                      }`}
                    >
                      {calendarDay.day}
                    </span>

                    {dayPosts.length > 0 && (
                      <span className="text-[7px] font-semibold text-slate-300">
                        {dayPosts.length}
                      </span>
                    )}

                  </div>

                  {/* POSTS */}

                  <div className="space-y-1">

                    {visiblePosts.map(
                      (post) => (
                        <div
                          key={post.id}
                          className={`rounded border px-1 py-1 ${getStatusClasses(
                            post.status
                          )}`}
                        >

                          <div className="flex min-w-0 items-center gap-1">

                            <span
                              className={`h-1 w-1 shrink-0 rounded-full ${getStatusDot(
                                post.status
                              )}`}
                            />

                            <span className="shrink-0 text-[7px] font-bold">
                              {formatTime(
                                post.scheduled_at
                              )}
                            </span>

                            <span
                              className="min-w-0 truncate text-[7px] font-semibold"
                              title={
                                post.content ||
                                "Untitled post"
                              }
                            >
                              {post.content ||
                                "Untitled"}
                            </span>

                            {post.is_recurring && (
                              <span className="ml-auto shrink-0 text-[7px]">
                                ↻
                              </span>
                            )}

                          </div>

                          {/* ACTION BUTTONS */}

                          <div className="mt-1 flex items-center gap-1">

                            <button
                              type="button"
                              onClick={() =>
                                viewPost(post.id)
                              }
                              className="rounded bg-white/80 px-1.5 py-0.5 text-[7px] font-bold text-slate-600 shadow-sm hover:bg-white"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                editPost(post.id)
                              }
                              className="rounded bg-slate-950 px-1.5 py-0.5 text-[7px] font-bold text-white hover:bg-slate-800"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deletePost(post.id)
                              }
                              className="rounded bg-white/80 px-1.5 py-0.5 text-[7px] font-bold text-red-500 shadow-sm hover:bg-red-50"
                            >
                              Delete
                            </button>

                          </div>

                        </div>
                      )
                    )}

                    {remainingCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          openDayModal(
                            calendarDay.date
                          )
                        }
                        className="w-full rounded px-1 py-0.5 text-left text-[7px] font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        +{remainingCount} more
                      </button>
                    )}

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>

      {/* UPCOMING POSTS */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">

          <div>
            <h2 className="text-xs font-bold text-slate-950">
              Upcoming Posts
            </h2>

            <p className="text-[9px] text-slate-400">
              Your next scheduled content.
            </p>
          </div>

          {upcomingPosts.length > 0 && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-bold text-blue-600">
              {upcomingPosts.length} scheduled
            </span>
          )}

        </div>

        {upcomingPosts.length === 0 ? (
          <div className="px-4 py-6 text-center">

            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
              +
            </div>

            <p className="mt-2 text-[10px] font-semibold text-slate-700">
              No upcoming posts
            </p>

            <button
              onClick={schedulePost}
              className="mt-2 rounded-lg bg-slate-950 px-3 py-1.5 text-[9px] font-semibold text-white hover:bg-slate-800"
            >
              Schedule Post
            </button>

          </div>
        ) : (
          <div className="grid gap-1.5 p-2 md:grid-cols-2">

            {upcomingPosts
              .slice(0, 6)
              .map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 transition hover:border-slate-300 hover:bg-slate-50"
                >

                  {post.media_url ? (
                    <img
                      src={post.media_url}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
                      ◇
                    </div>
                  )}

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-1">

                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[7px] font-bold ${getStatusClasses(
                          post.status
                        )}`}
                      >
                        {post.status}
                      </span>

                      {post.is_recurring && (
                        <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[7px] font-bold text-purple-600">
                          ↻
                        </span>
                      )}

                    </div>

                    <p className="mt-0.5 truncate text-[9px] font-semibold text-slate-700">
                      {post.content ||
                        "Untitled post"}
                    </p>

                    <div className="mt-0.5 flex min-w-0 items-center gap-1">

                      <span className="truncate rounded bg-blue-50 px-1 py-0.5 text-[7px] font-semibold text-blue-600">
                        {formatDate(
                          post.scheduled_at
                        )}
                      </span>

                      {post.campaign && (
                        <span className="max-w-[100px] truncate rounded bg-purple-50 px-1 py-0.5 text-[7px] font-semibold text-purple-600">
                          {post.campaign.name}
                        </span>
                      )}

                    </div>

                  </div>

                  {/* UPCOMING ACTIONS */}

                  <div className="flex shrink-0 items-center gap-1">

                    <button
                      type="button"
                      onClick={() =>
                        viewPost(post.id)
                      }
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[8px] font-bold text-slate-600 hover:bg-slate-100"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        editPost(post.id)
                      }
                      className="rounded-md bg-slate-950 px-2 py-1 text-[8px] font-bold text-white hover:bg-slate-800"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deletePost(post.id)
                      }
                      className="rounded-md border border-red-100 bg-white px-2 py-1 text-[8px] font-bold text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))}

          </div>
        )}

      </div>

      {/* SELECTED DAY MODAL */}

      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={closeDayModal}
        >

          <div
            className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">

              <div>

                <div className="flex items-center gap-2">

                  <h2 className="text-sm font-bold text-slate-950">
                    {selectedDay.toLocaleDateString(
                      undefined,
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </h2>

                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-bold text-blue-600">
                    {selectedDayPosts.length} posts
                  </span>

                </div>

                <p className="mt-0.5 text-[9px] text-slate-400">
                  All scheduled content for this day.
                </p>

              </div>

              <button
                type="button"
                onClick={closeDayModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>

            </div>

            {/* POSTS */}

            <div className="max-h-[60vh] space-y-1.5 overflow-y-auto p-3">

              {selectedDayPosts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No posts scheduled for this day.
                </div>
              ) : (
                selectedDayPosts.map(
                  (post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 transition hover:border-slate-300 hover:bg-slate-50"
                    >

                      {/* TIME */}

                      <div className="w-12 shrink-0 text-center">

                        <div className="text-[9px] font-bold text-slate-900">
                          {formatTime(
                            post.scheduled_at
                          )}
                        </div>

                        <div
                          className={`mx-auto mt-1 h-1.5 w-1.5 rounded-full ${getStatusDot(
                            post.status
                          )}`}
                        />

                      </div>

                      {/* MEDIA */}

                      {post.media_url && (
                        <img
                          src={post.media_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-md object-cover"
                        />
                      )}

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-1">

                          <span
                            className={`rounded-full border px-1.5 py-0.5 text-[7px] font-bold ${getStatusClasses(
                              post.status
                            )}`}
                          >
                            {post.status}
                          </span>

                          {post.is_recurring && (
                            <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[7px] font-bold text-purple-600">
                              ↻{" "}
                              {post.recurrence_type ||
                                "Recurring"}
                            </span>
                          )}

                          {post.campaign && (
                            <span className="max-w-[120px] truncate rounded-full bg-purple-50 px-1.5 py-0.5 text-[7px] font-semibold text-purple-600">
                              {post.campaign.name}
                            </span>
                          )}

                        </div>

                        <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-slate-700">
                          {post.content ||
                            "Untitled post"}
                        </p>

                        <div className="mt-0.5 flex flex-wrap gap-1">

                          {post.social_accounts.map(
                            (account) => (
                              <span
                                key={account.id}
                                className="rounded bg-slate-100 px-1 py-0.5 text-[7px] font-semibold text-slate-600"
                              >
                                {getPlatformIcon(
                                  account.platform
                                )}{" "}
                                {formatPlatform(
                                  account.platform
                                )}
                              </span>
                            )
                          )}

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex shrink-0 gap-1">

                        <button
                          type="button"
                          onClick={() =>
                            viewPost(
                              post.id
                            )
                          }
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[8px] font-bold text-slate-600 hover:bg-slate-100"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            editPost(
                              post.id
                            )
                          }
                          className="rounded-md bg-slate-950 px-2 py-1 text-[8px] font-bold text-white hover:bg-slate-800"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deletePost(
                              post.id
                            )
                          }
                          className="rounded-md border border-red-100 bg-white px-2 py-1 text-[8px] font-bold text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>

                      </div>

                    </div>
                  )
                )
              )}

            </div>

            {/* FOOTER */}

            <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-4 py-2">

              <button
                type="button"
                onClick={() => {
                  closeDayModal();
                  schedulePost();
                }}
                className="rounded-lg bg-slate-950 px-3 py-1.5 text-[9px] font-semibold text-white hover:bg-slate-800"
              >
                + Schedule Post
              </button>

              <button
                type="button"
                onClick={closeDayModal}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}