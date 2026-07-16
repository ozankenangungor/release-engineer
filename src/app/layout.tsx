import type { Metadata } from "next";
import { Header, Footer } from "@/components/brand";
import "./globals.css";

const title = "Release Engineer — Your AI Release Engineer";
const description =
  "Review public GitHub pull requests for regressions, testing gaps, breaking changes and release risks. Powered by Claude.";

export const metadata: Metadata = {
  metadataBase: new URL("https://releaseengineer.tech"),
  title,
  description,
  alternates: { canonical: "./" },
  openGraph: {
    title,
    description,
    url: "./",
    siteName: "Release Engineer",
    type: "website",
  },
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
