"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type DashboardLayoutProps = {
  children: ReactNode;
};

type User = {
  username: string;
  email: string;
  role: string;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const loadUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        const data = await response.json();

        setUser(data.user);
      } catch (error) {
        console.error(error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    router.replace("/login");
  };

  const navigationItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "🏠",
    },
    {
      name: "Posts",
      path: "/dashboard/posts",
      icon: "📝",
    },
    {
      name: "Create Post",
      path: "/dashboard/create-post",
      icon: "✍️",
    },
    {
      name: "Calendar",
      path: "/dashboard/calendar",
      icon: "📅",
    },
    {
      name: "Social Accounts",
      path: "/dashboard/social-accounts",
      icon: "📱",
    },
    {
      name: "Campaigns",
      path: "/dashboard/campaigns",
      icon: "📢",
    },
    {
      name: "Analytics",
      path: "/dashboard/analytics",
      icon: "📊",
    },
    {
      name: "Publishing",
      path: "/dashboard/publishing",
      icon: "🚀",
    },
    {
      name: "Notifications",
      path: "/dashboard/notifications",
      icon: "🔔",
    },
    {
      name: "Reports",
      path: "/dashboard/reports",
      icon: "📄",
    },
    {
      name: "Team",
      path: "/dashboard/team",
      icon: "👥",
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: "⚙️",
    },
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">
          Loading SocialPilot...
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white">

        {/* LOGO */}

        <div className="border-b border-slate-200 px-6 py-5">

          <h1 className="text-2xl font-bold text-slate-900">
            SocialPilot
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Social Media Scheduler
          </p>

        </div>

        {/* NAVIGATION */}

        <nav className="px-3 py-5">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">

            {navigationItems.map((item) => {

              const isActive =
                pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() =>
                    router.push(item.path)
                  }
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >

                  <span className="text-base">
                    {item.icon}
                  </span>

                  <span>
                    {item.name}
                  </span>

                </button>
              );
            })}

          </div>

        </nav>

        {/* USER / LOGOUT */}

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4">

          {user && (
            <div className="mb-3">

              <p className="truncate text-sm font-semibold text-slate-900">
                {user.username}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user.email}
              </p>

            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      {/* MAIN AREA */}

      <div className="ml-64 min-h-screen">

        {/* TOP BAR */}

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">

          <div className="flex items-center justify-between px-8 py-4">

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Social Media Scheduler & Campaign Management
              </h2>

              <p className="text-xs text-slate-500">
                Manage your social media from one place
              </p>
            </div>

            <div className="flex items-center gap-4">

              <button
                onClick={() =>
                  router.push("/dashboard/notifications")
                }
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                title="Notifications"
              >
                🔔
              </button>

              <button
                onClick={() =>
                  router.push("/dashboard/settings")
                }
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                title="Settings"
              >
                ⚙️
              </button>

            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main className="p-8">
          {children}
        </main>

      </div>

    </div>
  );
}