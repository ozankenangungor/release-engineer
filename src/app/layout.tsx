import type { Metadata } from "next";
import { Header, Footer } from "@/components/brand";
import "./globals.css";

const title = "Release Engineer — Your AI Release Engineer";
const description =
  "Review public GitHub pull requests for regressions, testing gaps, breaking changes and release risks. Powered by Claude.";

const softwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Release Engineer",
  url: "https://releaseengineer.tech",
  description,
  applicationCategory: "DeveloperApplication",
  creator: { "@type": "Person", name: "Ozan Kenan Güngör" },
  sameAs: "https://github.com/ozankenangungor/release-engineer",
};

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplication).replace(/</g, "\\u003c"),
          }}
        />
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
