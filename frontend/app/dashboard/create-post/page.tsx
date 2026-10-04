"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Campaign = {
  id: number;
  name: string;
};

type SocialAccount = {
  id: number;
  platform: string;
  platform_username?: string | null;
  display_name?: string | null;
  status: string;
};

export default function CreatePostPage() {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [scheduledAt, setScheduledAt] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("daily");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState("");

  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    loadData(token);
  }, [router]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadData(token: string) {
    try {
      const [campaignResponse, accountResponse] = await Promise.all([
        fetch(`${API_URL}/api/campaigns`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/api/social-accounts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json();

        if (Array.isArray(campaignData)) {
          setCampaigns(campaignData);
        } else if (Array.isArray(campaignData?.campaigns)) {
          setCampaigns(campaignData.campaigns);
        }
      }

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();

        const accounts = Array.isArray(accountData)
          ? accountData
          : accountData?.accounts || [];

        const connectedAccounts = accounts.filter(
          (account: SocialAccount) => account.status === "connected"
        );

        setSocialAccounts(connectedAccounts);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError("");

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Image size must be less than 10 MB.");
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(file);

    setMediaFile(file);
    setPreviewUrl(newPreviewUrl);
  }

  function removeImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setMediaFile(null);
    setPreviewUrl(null);

    const fileInput = document.getElementById(
      "media"
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  }

  function toggleAccount(accountId: number) {
    setSelectedAccountIds((previous) => {
      if (previous.includes(accountId)) {
        return previous.filter((id) => id !== accountId);
      }

      return [...previous, accountId];
    });
  }

  async function uploadImage(token: string): Promise<string | null> {
    if (!mediaFile) {
      return null;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", mediaFile);

      const response = await fetch(`${API_URL}/api/uploads/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Failed to upload image."
        );
      }

      const data = await response.json();

      return data.url || data.path || null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!content.trim()) {
      setError("Please enter your post content.");
      return;
    }

    if (selectedAccountIds.length === 0) {
      setError("Please select at least one social account.");
      return;
    }

    if (isScheduled && !scheduledAt) {
      setError("Please select a scheduled date and time.");
      return;
    }

    if (isRecurring && !isScheduled) {
      setError("Recurring posts must be scheduled.");
      return;
    }

    setLoading(true);

    try {
      let mediaUrl: string | null = null;

      if (mediaFile) {
        mediaUrl = await uploadImage(token);

        if (!mediaUrl) {
          throw new Error("Image upload failed.");
        }
      }

      const postData = {
        content: content.trim(),
        media_url: mediaUrl,
        status: isScheduled ? "scheduled" : "draft",
        scheduled_at: isScheduled
          ? new Date(scheduledAt).toISOString()
          : null,
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : null,
        recurrence_end_date:
          isRecurring && recurrenceEndDate
            ? new Date(recurrenceEndDate).toISOString()
            : null,
        campaign_id: campaignId ? Number(campaignId) : null,
        social_account_ids: selectedAccountIds,
      };

      const response = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to create post."
        );
      }

      setSuccess(
        isScheduled
          ? "Post scheduled successfully!"
          : "Post created successfully!"
      );

      sessionStorage.removeItem("socialpilot_create_post");

      setTimeout(() => {
        router.push("/dashboard/posts");
      }, 1000);
    } catch (err) {
      console.error("Create post error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create post."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleAddAccount() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const postData = {
      content,
      scheduledAt,
      isScheduled,
      isRecurring,
      recurrenceType,
      recurrenceEndDate,
      campaignId,
      selectedAccountIds,
    };

    sessionStorage.setItem(
      "socialpilot_create_post",
      JSON.stringify(postData)
    );

    window.location.href = `${API_URL}/api/social/instagram/login?return_to=/dashboard/create-post`;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mb-4 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Create Post
          </h1>

          <p className="mt-2 text-gray-600">
            Create and schedule content for your connected social
            media accounts.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* LEFT SIDE */}
            <div className="space-y-6">
              {/* CONTENT */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <label
                  htmlFor="content"
                  className="mb-2 block text-sm font-semibold text-gray-900"
                >
                  Post Content
                </label>

                <textarea
                  id="content"
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  placeholder="What do you want to share?"
                  rows={8}
                  className="w-full rounded-lg border border-gray-300 p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <div className="mt-2 text-right text-xs text-gray-500">
                  {content.length} characters
                </div>
              </div>

              {/* IMAGE */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">
                  Media
                </h2>

                {!previewUrl && (
                  <label
                    htmlFor="media"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-10 text-center transition hover:border-blue-400 hover:bg-blue-50"
                  >
                    <div className="mb-3 text-4xl">
                      📷
                    </div>

                    <p className="text-sm font-medium text-gray-700">
                      Select an image
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG or WebP • Maximum 10 MB
                    </p>

                    <input
                      id="media"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}

                {previewUrl && (
                  <div className="relative overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={previewUrl}
                      alt="Selected image preview"
                      className="max-h-[500px] w-full object-contain"
                    />

                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute right-3 top-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
                    >
                      Remove Image
                    </button>

                    {mediaFile && (
                      <div className="border-t bg-white p-3 text-xs text-gray-600">
                        {mediaFile.name}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SCHEDULING */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">
                  Scheduling
                </h2>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(event) => {
                      setIsScheduled(event.target.checked);

                      if (!event.target.checked) {
                        setScheduledAt("");
                        setIsRecurring(false);
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />

                  <span className="text-sm text-gray-700">
                    Schedule this post
                  </span>
                </label>

                {isScheduled && (
                  <div className="mt-4">
                    <label
                      htmlFor="scheduledAt"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Date and Time
                    </label>

                    <input
                      id="scheduledAt"
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(event) =>
                        setScheduledAt(event.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                )}

                {isScheduled && (
                  <div className="mt-5">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(event) =>
                          setIsRecurring(event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />

                      <span className="text-sm text-gray-700">
                        Make this a recurring post
                      </span>
                    </label>
                  </div>
                )}

                {isRecurring && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="recurrenceType"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Repeat
                      </label>

                      <select
                        id="recurrenceType"
                        value={recurrenceType}
                        onChange={(event) =>
                          setRecurrenceType(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500"
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
                      <label
                        htmlFor="recurrenceEndDate"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        End Date
                      </label>

                      <input
                        id="recurrenceEndDate"
                        type="datetime-local"
                        value={recurrenceEndDate}
                        onChange={(event) =>
                          setRecurrenceEndDate(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CAMPAIGN */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">
                  Campaign
                </h2>

                <select
                  value={campaignId}
                  onChange={(event) =>
                    setCampaignId(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">
                    No Campaign
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
              </div>

              {/* SOCIAL ACCOUNTS */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      Publish To
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      Select the social accounts where this post
                      should be published.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAccount}
                    className="rounded-lg border border-blue-600 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    + Add Account
                  </button>
                </div>

                {socialAccounts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                    <p className="text-sm text-gray-600">
                      No connected social accounts.
                    </p>

                    <button
                      type="button"
                      onClick={handleAddAccount}
                      className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Connect Instagram
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {socialAccounts.map((account) => {
                      const isSelected =
                        selectedAccountIds.includes(account.id);

                      return (
                        <label
                          key={account.id}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg">
                              {account.platform === "instagram"
                                ? "📸"
                                : account.platform === "facebook"
                                ? "📘"
                                : account.platform === "linkedin"
                                ? "💼"
                                : "🌐"}
                            </div>

                            <div>
                              <p className="text-sm font-medium capitalize text-gray-900">
                                {account.platform}
                              </p>

                              <p className="text-xs text-gray-500">
                                {account.display_name ||
                                  account.platform_username ||
                                  "Connected account"}
                              </p>
                            </div>
                          </div>

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleAccount(account.id)
                            }
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push("/dashboard/posts")
                  }
                  className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading
                    ? "Uploading Image..."
                    : loading
                    ? "Creating Post..."
                    : isScheduled
                    ? "Schedule Post"
                    : "Create Post"}
                </button>
              </div>
            </div>

            {/* RIGHT SIDE - PREVIEW */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">
                  Preview
                </h2>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                        👤
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Your Account
                        </p>

                        <p className="text-xs text-gray-500">
                          SocialPilot
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {content ? (
                      <p className="whitespace-pre-wrap text-sm text-gray-800">
                        {content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Your post content will appear here...
                      </p>
                    )}
                  </div>

                  {/* IMPORTANT:
                      Image is shown ONLY when previewUrl exists.
                      If no image is selected, this section stays empty.
                  */}
                  {previewUrl && (
                    <div className="border-t border-gray-100">
                      <img
                        src={previewUrl}
                        alt="Post preview"
                        className="max-h-[400px] w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="border-t border-gray-100 px-4 py-3">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Like</span>
                      <span>Comment</span>
                      <span>Share</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-700">
                    Selected Accounts
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {selectedAccountIds.length === 0
                      ? "No accounts selected"
                      : `${selectedAccountIds.length} account${
                          selectedAccountIds.length > 1
                            ? "s"
                            : ""
                        } selected`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}