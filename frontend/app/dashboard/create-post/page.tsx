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

        if (Array.isArray(data.accounts)) {
          const connectedAccounts = data.accounts.filter(
            (account: SocialAccount) =>
              account.status?.toLowerCase() === "connected"
          );

          setSocialAccounts(connectedAccounts);
        } else if (Array.isArray(data)) {
          const connectedAccounts = data.filter(
            (account: SocialAccount) =>
              account.status?.toLowerCase() === "connected"
          );

          setSocialAccounts(connectedAccounts);
        }
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

      if (!savedData) {
        return;
      }

      try {
        const parsedData: SavedCreatePostData = JSON.parse(savedData);

        setContent(parsedData.content || "");
        setMediaUrl(parsedData.mediaUrl || "");
        setScheduledAt(parsedData.scheduledAt || "");
        setIsRecurring(parsedData.isRecurring || false);

        setRecurrenceType(
          parsedData.recurrenceType || "daily"
        );

        setRecurrenceEndDate(
          parsedData.recurrenceEndDate || ""
        );

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

        sessionStorage.removeItem(
          "socialpilot_create_post_data"
        );
      } catch (err) {
        console.error(
          "Failed to restore Create Post data:",
          err
        );

        sessionStorage.removeItem(
          "socialpilot_create_post_data"
        );
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
    if (!selectedFile) {
      return null;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_URL}/api/uploads/image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

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
          throw new Error(
            "Unable to upload the selected image."
          );
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
          data.detail ||
            "Unable to start Instagram connection."
        );
      }

      if (!data.login_url) {
        throw new Error(
          "Instagram login URL was not returned."
        );
      }

      window.location.href = data.login_url;
    } catch (err) {
      console.error(
        "Instagram connection error:",
        err
      );

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
            ? new Date(
                recurrenceEndDate
              ).toISOString()
            : null,
        social_account_ids:
          selectedSocialAccountIds,
      };

      const response = await fetch(
        `${API_URL}/api/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail || "Failed to create post."
        );
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

  return (
    <div className="mx-auto max-w-4xl">
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

        {/* SOCIAL ACCOUNTS */}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Publish To
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the social accounts where this post should be
                published.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddAccount}
              disabled={uploadingImage}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingImage
                ? "Preparing..."
                : "+ Add account"}
            </button>
          </div>

          <div className="mt-5">
            {loadingSocialAccounts ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Loading connected accounts...
              </div>
            ) : socialAccounts.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-sm font-medium text-amber-800">
                  No social accounts connected.
                </p>

                <p className="mt-1 text-xs text-amber-700">
                  Connect an account before creating a post for social
                  media publishing.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {socialAccounts.map((account) => {
                  const accountName =
                    account.display_name ||
                    account.platform_username ||
                    account.platform_user_id;

                  const isSelected =
                    selectedSocialAccountIds.includes(
                      account.id
                    );

                  return (
                    <label
                      key={account.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-4 transition ${
                        isSelected
                          ? "border-slate-500 bg-slate-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleSocialAccountToggle(
                              account.id
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />

                        <div>
                          <p className="text-sm font-semibold capitalize text-slate-900">
                            {account.platform}
                          </p>

                          <p className="text-xs text-slate-500">
                            {accountName}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Connected
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {selectedSocialAccountIds.length > 0 && (
            <p className="mt-4 text-xs text-slate-500">
              {selectedSocialAccountIds.length} account
              {selectedSocialAccountIds.length !== 1
                ? "s"
                : ""}{" "}
              selected.
            </p>
          )}
        </div>

        {/* MEDIA */}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Media
          </h2>

          <label
            htmlFor="image-upload"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Select Image
          </label>

          <input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
          />

          <p className="mt-2 text-xs text-slate-500">
            Select a JPG, PNG, or WebP image from your computer.
            Maximum size: 10 MB.
          </p>

          {previewUrl && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Image Preview
              </p>

              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={previewUrl}
                  alt="Selected post image"
                  className="max-h-96 w-full object-contain"
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {selectedFile?.name}
                </p>

                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove Image
                </button>
              </div>
            </div>
          )}
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
            Assign this post to an existing campaign.
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
            onChange={(e) =>
              setScheduledAt(e.target.value)
            }
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
              onChange={(e) =>
                setIsRecurring(e.target.checked)
              }
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
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
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
                    setRecurrenceEndDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* MESSAGES */}

        {uploadingImage && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Uploading image...
          </div>
        )}

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
            disabled={loading || uploadingImage}
            className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadingImage
              ? "Uploading..."
              : loading
              ? "Creating..."
              : "Create Post"}
          </button>
        </div>
      </form>
    </div>
  );
}