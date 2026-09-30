"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Campaign = {
  id: number;
  name: string;
  status: string;
};

type SocialAccount = {
  id: number;
  platform: string;
  platform_user_id: string;
  platform_username: string | null;
  display_name: string | null;
  status: string;
};

type SavedCreatePostData = {
  content: string;
  mediaUrl: string;
  scheduledAt: string;
  isRecurring: boolean;
  recurrenceType: string;
  recurrenceEndDate: string;
  campaignId: string;
  selectedSocialAccountIds: number[];
};

export default function CreatePostPage() {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("daily");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const [campaignId, setCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [selectedSocialAccountIds, setSelectedSocialAccountIds] =
    useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingSocialAccounts, setLoadingSocialAccounts] = useState(true);

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

    const loadSocialAccounts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/social-accounts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load social accounts.");
        }

        const data = await response.json();

        const accounts = Array.isArray(data.accounts)
          ? data.accounts
          : Array.isArray(data)
          ? data
          : [];

        setSocialAccounts(
          accounts.filter(
            (account: SocialAccount) =>
              account.status?.toLowerCase() === "connected"
          )
        );
      } catch (err) {
        console.error("Failed to load social accounts:", err);
      } finally {
        setLoadingSocialAccounts(false);
      }
    };

    const restoreCreatePostData = () => {
      const savedData = sessionStorage.getItem(
        "socialpilot_create_post_data"
      );

      if (!savedData) return;

      try {
        const parsedData: SavedCreatePostData = JSON.parse(savedData);

        setContent(parsedData.content || "");
        setMediaUrl(parsedData.mediaUrl || "");
        setScheduledAt(parsedData.scheduledAt || "");
        setIsRecurring(parsedData.isRecurring || false);
        setRecurrenceType(parsedData.recurrenceType || "daily");
        setRecurrenceEndDate(parsedData.recurrenceEndDate || "");
        setCampaignId(parsedData.campaignId || "");

        setSelectedSocialAccountIds(
          Array.isArray(parsedData.selectedSocialAccountIds)
            ? parsedData.selectedSocialAccountIds
            : []
        );

        if (parsedData.mediaUrl) {
          setPreviewUrl(parsedData.mediaUrl);
        }

        setMessage(
          "Instagram account connected. Your post details have been restored."
        );

        sessionStorage.removeItem("socialpilot_create_post_data");
      } catch (err) {
        console.error("Failed to restore Create Post data:", err);
        sessionStorage.removeItem("socialpilot_create_post_data");
      }
    };

    loadCampaigns();
    loadSocialAccounts();
    restoreCreatePostData();
  }, [router]);

  const handleSocialAccountToggle = (accountId: number) => {
    setSelectedSocialAccountIds((currentIds) => {
      if (currentIds.includes(accountId)) {
        return currentIds.filter((id) => id !== accountId);
      }

      return [...currentIds, accountId];
    });
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError("");
    setMessage("");

    const file = event.target.files?.[0];

    if (!file) return;

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

    setSelectedFile(file);

    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    setMediaUrl("");
    setPreviewUrl("");

    const fileInput = document.getElementById(
      "image-upload"
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const uploadImage = async (token: string) => {
    if (!selectedFile) return null;

    setUploadingImage(true);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/api/uploads/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to upload image."
        );
      }

      if (!data.url) {
        throw new Error(
          "Image upload succeeded but no image URL was returned."
        );
      }

      return data.url;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddAccount = async () => {
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      let savedMediaUrl = mediaUrl;

      if (selectedFile && !mediaUrl) {
        savedMediaUrl = await uploadImage(token);

        if (!savedMediaUrl) {
          throw new Error("Unable to upload the selected image.");
        }

        setMediaUrl(savedMediaUrl);
      }

      sessionStorage.setItem(
        "socialpilot_create_post_data",
        JSON.stringify({
          content,
          mediaUrl: savedMediaUrl || "",
          scheduledAt,
          isRecurring,
          recurrenceType,
          recurrenceEndDate,
          campaignId,
          selectedSocialAccountIds,
        })
      );

      const response = await fetch(
        `${API_URL}/api/social/instagram/login?return_to=/dashboard/create-post`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to start Instagram connection."
        );
      }

      if (!data.login_url) {
        throw new Error(
          "Instagram login URL was not returned."
        );
      }

      window.location.href = data.login_url;
    } catch (err) {
      console.error("Instagram connection error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect Instagram."
      );
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!content.trim()) {
      setError("Please enter your post content.");
      return;
    }

    if (isRecurring && !scheduledAt) {
      setError(
        "Recurring posts must have a scheduled date and time."
      );
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

      let finalMediaUrl = mediaUrl;

      if (selectedFile) {
        finalMediaUrl = await uploadImage(token);

        if (!finalMediaUrl) {
          throw new Error("Unable to upload image.");
        }
      }

      const payload = {
        content: content.trim(),
        media_url: finalMediaUrl || null,
        campaign_id: campaignId
          ? Number(campaignId)
          : null,
        scheduled_at: scheduledAt
          ? new Date(scheduledAt).toISOString()
          : null,
        is_recurring: isRecurring,
        recurrence_type: isRecurring
          ? recurrenceType
          : null,
        recurrence_end_date:
          isRecurring && recurrenceEndDate
            ? new Date(recurrenceEndDate).toISOString()
            : null,
        social_account_ids: selectedSocialAccountIds,
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

      sessionStorage.removeItem(
        "socialpilot_create_post_data"
      );

      setMessage("Post created successfully!");

      setContent("");
      setMediaUrl("");
      setSelectedFile(null);
      setPreviewUrl("");
      setScheduledAt("");
      setIsRecurring(false);
      setRecurrenceType("daily");
      setRecurrenceEndDate("");
      setCampaignId("");
      setSelectedSocialAccountIds([]);

      const fileInput = document.getElementById(
        "image-upload"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      setTimeout(() => {
        router.push("/dashboard/posts");
      }, 1000);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedAccounts = socialAccounts.filter((account) =>
    selectedSocialAccountIds.includes(account.id)
  );

  const selectedCampaign = campaigns.find(
    (campaign) => String(campaign.id) === campaignId
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">

          <div>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mb-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              ← Dashboard
            </button>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                Create Post
              </h1>

              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Content Studio
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Create, schedule and publish content from one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Accounts
              </span>
              <p className="text-sm font-bold text-slate-900">
                {selectedSocialAccountIds.length}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Status
              </span>
              <p className="text-sm font-bold text-slate-900">
                {scheduledAt ? "Scheduled" : "Draft"}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
        >

          {/* LEFT */}
          <div className="space-y-4">

            {/* CONTENT + MEDIA */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Post Content
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Write your message and optionally add media.
                  </p>
                </div>

                <span className="text-[11px] font-medium text-slate-400">
                  {content.length}/5000
                </span>
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_250px]">

                {/* TEXT */}
                <div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write something your audience will love..."
                    rows={7}
                    maxLength={5000}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  />

                  <div className="mt-2 flex justify-between">
                    <span className="text-[10px] text-slate-400">
                      Keep your message clear and engaging.
                    </span>

                    <span
                      className={`text-[10px] font-semibold ${
                        content.length > 4500
                          ? "text-amber-600"
                          : "text-slate-400"
                      }`}
                    >
                      {content.length}/5000
                    </span>
                  </div>
                </div>

                {/* MEDIA */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700">
                      Media
                    </p>

                    {previewUrl && (
                      <button
                        type="button"
                        onClick={removeSelectedImage}
                        className="text-[10px] font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {!previewUrl ? (
                    <label
                      htmlFor="image-upload"
                      className="flex h-[175px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-slate-400 hover:bg-white"
                    >
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
                        ↑
                      </div>

                      <p className="text-xs font-bold text-slate-700">
                        Upload image
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        JPG, PNG or WebP · Max 10 MB
                      </p>

                      <span className="mt-3 rounded-md bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-white">
                        Choose Image
                      </span>

                      <input
                        id="image-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img
                        src={previewUrl}
                        alt="Selected post image"
                        className="h-[175px] w-full object-cover"
                      />

                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
                        <p className="truncate text-[10px] font-medium text-white">
                          {selectedFile?.name || "Uploaded image"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </section>

            {/* SOCIAL ACCOUNTS */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Publish To
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Select the accounts for this post.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddAccount}
                  disabled={uploadingImage}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  + Add Account
                </button>
              </div>

              <div className="p-4">

                {loadingSocialAccounts ? (
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                    <span className="text-xs text-slate-500">
                      Loading accounts...
                    </span>
                  </div>
                ) : socialAccounts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-5 text-center">
                    <p className="text-xs font-bold text-amber-900">
                      No connected accounts
                    </p>

                    <p className="mt-1 text-[10px] text-amber-700">
                      Connect Instagram before publishing.
                    </p>

                    <button
                      type="button"
                      onClick={handleAddAccount}
                      className="mt-3 rounded-lg bg-amber-900 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-amber-800"
                    >
                      Connect Instagram
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {socialAccounts.map((account) => {
                      const accountName =
                        account.display_name ||
                        account.platform_username ||
                        account.platform_user_id;

                      const isSelected =
                        selectedSocialAccountIds.includes(account.id);

                      return (
                        <label
                          key={account.id}
                          className={`cursor-pointer rounded-lg border p-3 transition ${
                            isSelected
                              ? "border-slate-900 bg-slate-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">

                            <div className="flex min-w-0 items-center gap-2.5">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                                  account.platform.toLowerCase() ===
                                  "instagram"
                                    ? "bg-pink-100 text-pink-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {account.platform
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-bold capitalize text-slate-900">
                                  {account.platform}
                                </p>

                                <p className="truncate text-[10px] text-slate-400">
                                  {accountName}
                                </p>
                              </div>
                            </div>

                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                handleSocialAccountToggle(account.id)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Connected
                            </span>

                            {isSelected && (
                              <span className="text-[9px] font-bold text-slate-900">
                                Selected ✓
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {selectedSocialAccountIds.length > 0 && (
                  <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-semibold text-slate-500">
                      {selectedSocialAccountIds.length} account
                      {selectedSocialAccountIds.length !== 1 ? "s" : ""}{" "}
                      selected for publishing.
                    </p>
                  </div>
                )}

              </div>
            </section>

            {/* PUBLISHING SETTINGS */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-bold text-slate-950">
                  Publishing Settings
                </h2>

                <p className="text-[11px] text-slate-400">
                  Campaign, scheduling and recurring options.
                </p>
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-2">

                {/* CAMPAIGN */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Campaign
                  </label>

                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    disabled={loadingCampaigns}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
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

                  <p className="mt-1 text-[10px] text-slate-400">
                    {selectedCampaign
                      ? `Assigned to ${selectedCampaign.name}`
                      : "Optional campaign"}
                  </p>
                </div>

                {/* SCHEDULE */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Schedule
                  </label>

                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  />

                  <p className="mt-1 text-[10px] text-slate-400">
                    Empty = save as draft
                  </p>
                </div>

                {/* RECURRING */}
                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">

                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) =>
                        setIsRecurring(e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Recurring post
                      </p>

                      <p className="text-[10px] text-slate-400">
                        Automatically repeat this content.
                      </p>
                    </div>
                  </label>

                  {isRecurring && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Repeat
                        </label>

                        <select
                          value={recurrenceType}
                          onChange={(e) =>
                            setRecurrenceType(e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          End Date
                        </label>

                        <input
                          type="datetime-local"
                          value={recurrenceEndDate}
                          onChange={(e) =>
                            setRecurrenceEndDate(e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </section>

            {/* MESSAGES */}
            {uploadingImage && (
              <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
                Uploading image...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-bold text-red-800">
                  Something went wrong
                </p>
                <p className="mt-1 text-xs text-red-700">
                  {error}
                </p>
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-bold text-emerald-800">
                  Success
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  {message}
                </p>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="rounded-lg bg-slate-950 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingImage
                  ? "Uploading..."
                  : loading
                  ? "Creating..."
                  : scheduledAt
                  ? "Schedule Post"
                  : "Create Draft"}
              </button>

            </div>
          </div>

          {/* RIGHT - COMPACT PREVIEW */}
          <aside className="lg:sticky lg:top-4 lg:h-fit">

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Live Preview
                  </p>

                  <h2 className="text-sm font-bold text-slate-950">
                    Your Post
                  </h2>
                </div>

                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
                  LIVE
                </span>
              </div>

              <div className="p-3">

                {/* SOCIAL PREVIEW */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                  <div className="flex items-center gap-2.5 p-3">

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 text-xs font-bold text-white">
                      {selectedAccounts.length > 0
                        ? selectedAccounts[0].platform
                            .charAt(0)
                            .toUpperCase()
                        : "S"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">
                        {selectedAccounts.length > 0
                          ? selectedAccounts[0].display_name ||
                            selectedAccounts[0].platform_username ||
                            "Connected account"
                          : "Your SocialPilot account"}
                      </p>

                      <p className="text-[9px] text-slate-400">
                        {selectedAccounts.length > 0
                          ? `@${selectedAccounts[0].platform}`
                          : "Preview"}
                      </p>
                    </div>

                    <span className="text-xs text-slate-400">
                      •••
                    </span>
                  </div>

                  {previewUrl ? (
                    <div className="aspect-square bg-slate-100">
                      <img
                        src={previewUrl}
                        alt="Post preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-slate-50">
                      <div className="text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
                          ◇
                        </div>

                        <p className="text-[10px] font-semibold text-slate-500">
                          Image preview
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500">
                    ♡
                    <span>◌</span>
                    <span>↗</span>
                  </div>

                  <div className="px-3 pb-4">
                    <p className="line-clamp-5 whitespace-pre-wrap break-words text-xs leading-5 text-slate-800">
                      {content ||
                        "Your post caption will appear here..."}
                    </p>
                  </div>

                </div>

                {/* QUICK INFO */}
                <div className="mt-3 grid grid-cols-2 gap-2">

                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Status
                    </p>

                    <p className="mt-0.5 text-[10px] font-bold text-slate-800">
                      {scheduledAt ? "Scheduled" : "Draft"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Accounts
                    </p>

                    <p className="mt-0.5 text-[10px] font-bold text-slate-800">
                      {selectedSocialAccountIds.length}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Campaign
                    </p>

                    <p className="mt-0.5 truncate text-[10px] font-bold text-slate-800">
                      {selectedCampaign?.name || "None"}
                    </p>
                  </div>

                  {isRecurring && (
                    <div className="col-span-2 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2">
                      <p className="text-[10px] font-bold text-purple-800">
                        ↻ Recurring · {recurrenceType}
                      </p>
                    </div>
                  )}

                </div>

              </div>
            </div>
          </aside>

        </form>
      </div>
    </div>
  );
}