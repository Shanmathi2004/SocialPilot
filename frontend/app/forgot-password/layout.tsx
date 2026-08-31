import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your SocialPilot account password.",
};

export default function ForgotPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}