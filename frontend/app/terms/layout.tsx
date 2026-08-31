import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "SocialPilot Terms and Conditions.",
};

export default function TermsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
