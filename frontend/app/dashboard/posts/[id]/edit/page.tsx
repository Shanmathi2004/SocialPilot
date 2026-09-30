"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
};

type Post = {
  id: number;
  content: string;
  media_url?: string | null;
  campaign_id?: number | null;
  campaign?: Campaign | null;
  status: string;
  scheduled_at?: string | null;
  is_recurring: boolean;
  recurrence_type?: string | null;
  recurrence_end_date?: string | null;
  social_accounts?: SocialAccount[];
};

type CampaignOption = {
  id: number;
  name: string;
};

type AccountOption = {
  id: number;
  platform: string;
  platform_username?: string | null;
  display_name?: string | null;
  status: string;
};

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();

  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);

  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const [campaignId, setCampaignId] = useState<string>("");

  const [scheduledAt, setScheduledAt] = useState("");

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("");
  const [recurrenceEndDate, setRecurrenceEndDate] =
    useState("");

  const [selectedAccountIds, setSelectedAccountIds] =
    useState<number[]>([]);

  const [campaigns, setCampaigns] = useState<
    CampaignOption[]
  >([]);

  const [accounts, setAccounts] = useState<
    AccountOption[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================================
  // LOAD POST
  // ==========================================================

  useEffect(() => {
    const loadPost = async () => {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/posts/${postId}`,
          {
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
          throw new Error(
            "Failed to load post."
          );
        }

        const data: Post =
          await response.json();

        setPost(data);

        setContent(data.content || "");

        setMediaUrl(
          data.media_url || ""
        );

        setCampaignId(
          data.campaign_id
            ? String(data.campaign_id)
            : ""
        );

        // Convert ISO datetime to
        // datetime-local format
        if (data.scheduled_at) {
          const date = new Date(
            data.scheduled_at
          );

          const localDate = new Date(
            date.getTime() -
              date.getTimezoneOffset() *
                60000
          );

          setScheduledAt(
            localDate
              .toISOString()
              .slice(0, 16)
          );
        }

        setIsRecurring(
          data.is_recurring || false
        );

        setRecurrenceType(
          data.recurrence_type || ""
        );

        if (data.recurrence_end_date) {
          const endDate = new Date(
            data.recurrence_end_date
          );

          const localEndDate =
            new Date(
              endDate.getTime() -
                endDate.getTimezoneOffset() *
                  60000
            );

          setRecurrenceEndDate(
            localEndDate
              .toISOString()
              .slice(0, 16)
          );
        }

        setSelectedAccountIds(
          (data.social_accounts || []).map(
            (account) => account.id
          )
        );
      } catch (error) {
        console.error(
          "Load post error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load post."
        );
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId, router]);

  // ==========================================================
  // LOAD CAMPAIGNS + SOCIAL ACCOUNTS
  // ==========================================================

  useEffect(() => {
    const loadOptions = async () => {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      try {
        const [
          campaignsResponse,
          accountsResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/api/campaigns`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(
            `${API_URL}/api/social-accounts`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
        ]);

        if (
          campaignsResponse.ok
        ) {
          const campaignData =
            await campaignsResponse.json();

          setCampaigns(
            Array.isArray(campaignData)
              ? campaignData
              : campaignData.campaigns ||
                  []
          );
        }

        if (
          accountsResponse.ok
        ) {
          const accountData =
            await accountsResponse.json();

          setAccounts(
            Array.isArray(accountData)
              ? accountData
              : accountData.accounts ||
                  []
          );
        }
      } catch (error) {
        console.error(
          "Load options error:",
          error
        );
      }
    };

    loadOptions();
  }, []);

  // ==========================================================
  // TOGGLE SOCIAL ACCOUNT
  // ==========================================================

  const toggleAccount = (
    accountId: number
  ) => {
    setSelectedAccountIds(
      (current) => {
        if (
          current.includes(accountId)
        ) {
          return current.filter(
            (id) =>
              id !== accountId
          );
        }

        return [
          ...current,
          accountId,
        ];
      }
    );
  };

  // ==========================================================
  // SAVE POST
  // ==========================================================

  const handleSave = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!content.trim()) {
      setError(
        "Post content is required."
      );
      return;
    }

    if (
      isRecurring &&
      !scheduledAt
    ) {
      setError(
        "Recurring posts must have a scheduled time."
      );
      return;
    }

    if (
      isRecurring &&
      !recurrenceType
    ) {
      setError(
        "Please select a recurrence type."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/posts/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content:
              content.trim(),

            media_url:
              mediaUrl.trim()
                ? mediaUrl.trim()
                : null,

            campaign_id:
              campaignId
                ? Number(campaignId)
                : null,

            scheduled_at:
              scheduledAt
                ? new Date(
                    scheduledAt
                  ).toISOString()
                : null,

            is_recurring:
              isRecurring,

            recurrence_type:
              isRecurring
                ? recurrenceType
                : null,

            recurrence_end_date:
              isRecurring &&
              recurrenceEndDate
                ? new Date(
                    recurrenceEndDate
                  ).toISOString()
                : null,

            social_account_ids:
              selectedAccountIds,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "user"
        );

        router.replace("/login");
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to update post."
        );
      }

      setSuccess(
        "Post updated successfully."
      );

      setTimeout(() => {
        router.push(
          `/dashboard/posts/${postId}`
        );
      }, 700);
    } catch (error) {
      console.error(
        "Update post error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update post."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-500">
              Loading post...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR / POST NOT FOUND
  // ==========================================================

  if (!post) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-slate-900">
              Unable to load post
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error ||
                "Post not found."}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/dashboard/posts"
                )
              }
              className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Back to Posts
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // EDIT PAGE
  // ==========================================================

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="mb-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
              Content Studio
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Edit Post
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update your post content and publishing settings.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/posts/${post.id}`
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSave}
          className="space-y-6"
        >

          {/* CONTENT */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Post Content
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Edit the text of your post.
              </p>
            </div>

            <textarea
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value
                )
              }
              rows={8}
              placeholder="Write your post..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />

            <div className="mt-2 text-right text-xs text-slate-400">
              {content.length} characters
            </div>
          </section>

          {/* MEDIA */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Media
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the media URL for this post.
              </p>
            </div>

            <input
              type="text"
              value={mediaUrl}
              onChange={(event) =>
                setMediaUrl(
                  event.target.value
                )
              }
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />

            {mediaUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <img
                  src={mediaUrl}
                  alt="Post media"
                  className="max-h-72 w-full object-contain bg-slate-100"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              </div>
            )}
          </section>

          {/* SOCIAL ACCOUNTS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Publish To
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the connected social accounts.
              </p>
            </div>

            {accounts.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No connected social accounts found.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">

                {accounts.map(
                  (account) => {
                    const selected =
                      selectedAccountIds.includes(
                        account.id
                      );

                    return (
                      <button
                        key={
                          account.id
                        }
                        type="button"
                        onClick={() =>
                          toggleAccount(
                            account.id
                          )
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">

                          <div>
                            <p className="font-semibold capitalize text-slate-900">
                              {account.platform}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {account.display_name ||
                                account.platform_username ||
                                "Connected account"}
                            </p>
                          </div>

                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                              selected
                                ? "border-indigo-500 bg-indigo-500 text-white"
                                : "border-slate-300 text-transparent"
                            }`}
                          >
                            ✓
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}

              </div>
            )}
          </section>

          {/* CAMPAIGN */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Campaign
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Assign this post to a campaign.
              </p>
            </div>

            <select
              value={campaignId}
              onChange={(event) =>
                setCampaignId(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">
                No Campaign
              </option>

              {campaigns.map(
                (campaign) => (
                  <option
                    key={
                      campaign.id
                    }
                    value={
                      campaign.id
                    }
                  >
                    {campaign.name}
                  </option>
                )
              )}
            </select>
          </section>

          {/* SCHEDULING */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Publishing Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update when this post should be published.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Scheduled Time
                </label>

                <input
                  type="datetime-local"
                  value={
                    scheduledAt
                  }
                  onChange={(
                    event
                  ) =>
                    setScheduledAt(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <input
                    type="checkbox"
                    checked={
                      isRecurring
                    }
                    onChange={(
                      event
                    ) =>
                      setIsRecurring(
                        event.target
                          .checked
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Recurring Post
                    </p>

                    <p className="text-xs text-slate-500">
                      Publish this post repeatedly.
                    </p>
                  </div>
                </label>
              </div>

            </div>

            {isRecurring && (
              <div className="mt-5 grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Recurrence
                  </label>

                  <select
                    value={
                      recurrenceType
                    }
                    onChange={(
                      event
                    ) =>
                      setRecurrenceType(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">
                      Select recurrence
                    </option>

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
                    value={
                      recurrenceEndDate
                    }
                    onChange={(
                      event
                    ) =>
                      setRecurrenceEndDate(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

              </div>
            )}
          </section>

          {/* ERROR */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/posts/${post.id}`
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}