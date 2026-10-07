import type { Metadata } from "next";
import { Header, Footer } from "@/components/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: "Release Engineer — Your AI Release Engineer",
  description:
    "Review public GitHub pull requests for regressions, testing gaps, breaking changes and release risks. Powered by Claude.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
