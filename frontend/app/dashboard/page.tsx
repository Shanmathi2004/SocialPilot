"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";


interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_email_verified: boolean;
}


export default function DashboardPage() {

  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    async function loadUser() {

      const token =
        localStorage.getItem(
          "access_token"
        );


      if (!token) {

        router.replace("/login");

        return;

      }


      try {

        const data =
          await apiRequest(
            "/api/users/me"
          );


        setUser(data.user);

      } catch (error) {

        console.error(error);

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "user"
        );

        router.replace("/login");

      } finally {

        setLoading(false);

      }

    }


    loadUser();

  }, [router]);


  function handleLogout() {

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "user"
    );

    router.replace("/login");

  }


  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );

  }


  if (!user) {

    return null;

  }


  return (

    <main className="min-h-screen bg-gray-100 p-8">

      <div className="mx-auto max-w-4xl">

        <div className="mb-8 flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold">
              SocialPilot Dashboard
            </h1>

            <p className="mt-2 text-gray-600">
              Welcome, {user.username}
            </p>

          </div>


          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>

        </div>


        <div className="rounded-xl bg-white p-6 shadow">

          <h2 className="mb-5 text-xl font-semibold">
            My Account
          </h2>


          <div className="space-y-4">

            <div>
              <p className="text-sm text-gray-500">
                Username
              </p>

              <p className="font-medium">
                {user.username}
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="font-medium">
                {user.email}
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Role
              </p>

              <p className="font-medium">
                {user.role}
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Email Verification
              </p>

              <p
                className={
                  user.is_email_verified
                    ? "font-medium text-green-600"
                    : "font-medium text-red-600"
                }
              >
                {user.is_email_verified
                  ? "Verified"
                  : "Not Verified"}
              </p>

            </div>

          </div>

        </div>


        {user.role === "admin" && (

          <div className="mt-6 rounded-xl bg-white p-6 shadow">

            <h2 className="text-xl font-semibold">
              Admin Area
            </h2>

            <p className="mt-2 text-gray-600">
              You have administrator permissions.
            </p>

          </div>

        )}

      </div>

    </main>

  );

}