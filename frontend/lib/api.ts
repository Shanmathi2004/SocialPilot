const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";


export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
) {

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;


  const headers = new Headers(
    options.headers
  );


  headers.set(
    "Content-Type",
    "application/json"
  );


  if (token) {

    headers.set(
      "Authorization",
      `Bearer ${token}`
    );

  }


  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );


  let data;

  try {

    data = await response.json();

  } catch {

    data = null;

  }


  if (!response.ok) {

    throw new Error(
      data?.detail ||
      "Request failed."
    );

  }


  return data;
}