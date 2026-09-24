"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Campaign = {
  id: number;
  name: string;
  status: string;
};

export default function CreatePostPage() {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("daily");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const [campaignId, setCampaignId] = useState("");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const loadCampaigns = async () => {
      try {
        const response = await fetch(`${API_URL}/api/campaigns`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();

          if (Array.isArray(data)) {
            setCampaigns(data);
          }
        }
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    loadCampaigns();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!content.trim()) {
      setError("Please enter your post content.");
      return;
    }

    if (isRecurring && !scheduledAt) {
      setError("Recurring posts must have a scheduled date and time.");
      return;
    }

    if (isRecurring && !recurrenceType) {
      setError("Please select a recurrence type.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }
const payload = {
  content: content.trim(),
  media_url: mediaUrl.trim() || null,
  campaign_id: campaignId ? Number(campaignId) : null,
  scheduled_at: scheduledAt
    ? new Date(scheduledAt).toISOString()
    : null,
  is_recurring: isRecurring,
  recurrence_type: isRecurring ? recurrenceType : null,
  recurrence_end_date:
    isRecurring && recurrenceEndDate
      ? new Date(recurrenceEndDate).toISOString()
      : null,
};

      const response = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to create post.");
        return;
      }

      setMessage("Post created successfully!");

      setContent("");
      setMediaUrl("");
      setScheduledAt("");
      setIsRecurring(false);
      setRecurrenceType("daily");
      setRecurrenceEndDate("");
      setCampaignId("");

      setTimeout(() => {
        router.push("/dashboard/posts");
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">

      {/* PAGE HEADER */}

      <div className="mb-8">

        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-slate-900">
          Create Post
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Create, schedule and manage your social media content.
        </p>

      </div>

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* CONTENT */}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Post Content
          </h2>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Content
          </label>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to share?"
            rows={7}
            maxLength={5000}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />

          <div className="mt-2 text-right text-xs text-slate-400">
            {content.length}/5000
          </div>

        </div>

        {/* MEDIA */}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Media
          </h2>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Media URL
          </label>

          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />

          <p className="mt-2 text-xs text-slate-500">
            You can add image or video upload functionality later.
          </p>

        </div>

        {/* CAMPAIGN */}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Campaign
          </h2>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Assign to Campaign
          </label>

          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            disabled={loadingCampaigns}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          >

            <option value="">
              {loadingCampaigns
                ? "Loading campaigns..."
                : "No campaign"}
            </option>

            {campaigns.map((campaign) => (
              <option
                key={campaign.id}
                value={campaign.id}
              >
                {campaign.name}
              </option>
            ))}

          </select>

          <p className="mt-2 text-xs text-slate-500">
            Campaign assignment will be connected to the backend next.
          </p>

        </div>

        {/* SCHEDULING */}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Schedule
          </h2>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Schedule Date & Time
          </label>

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />

          <p className="mt-2 text-xs text-slate-500">
            Leave empty to save the post as a draft.
          </p>

        </div>

        {/* RECURRING */}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <input
              id="recurring"
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />

            <label
              htmlFor="recurring"
              className="text-sm font-medium text-slate-700"
            >
              Make this a recurring post
            </label>

          </div>

          {isRecurring && (
            <div className="mt-5 space-y-5">

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Repeat
                </label>

                <select
                  value={recurrenceType}
                  onChange={(e) =>
                    setRecurrenceType(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
                >

                  <option value="daily">
                    Daily
                  </option>

                  <option value="weekly">
                    Weekly
                  </option>

                  <option value="monthly">
                    Monthly
                  </option>

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Recurrence End Date
                </label>

                <input
                  type="datetime-local"
                  value={recurrenceEndDate}
                  onChange={(e) =>
                    setRecurrenceEndDate(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
                />

              </div>

            </div>
          )}

        </div>

        {/* MESSAGES */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* BUTTONS */}

        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Post"}
          </button>

        </div>

      </form>

    </div>
  );
}