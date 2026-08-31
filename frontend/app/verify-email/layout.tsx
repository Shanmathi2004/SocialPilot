import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your SocialPilot email address.",
};

export default function VerifyEmailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
