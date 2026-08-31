import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Create a new password for your SocialPilot account.",
};

export default function ResetPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
