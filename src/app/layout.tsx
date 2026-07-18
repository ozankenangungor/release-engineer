import type { Metadata } from "next";
import { Header, Footer } from "@/components/brand";
import "./globals.css";

const title = "Release Engineer — Your AI Release Engineer";
const description =
  "Review public GitHub pull requests for regressions, testing gaps, breaking changes and release risks. Powered by Claude.";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://releaseengineer.tech/#organization",
      name: "Release Engineer",
      url: "https://releaseengineer.tech",
      email: "founder@releaseengineer.tech",
      foundingDate: "2026",
      description:
        "Release Engineer is an early-stage, bootstrapped developer-tool startup founded in 2026 in Ankara, Türkiye.",
      founder: { "@id": "https://releaseengineer.tech/#founder" },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ankara",
        addressCountry: "TR",
      },
    },
    {
      "@type": "Person",
      "@id": "https://releaseengineer.tech/#founder",
      name: "Ozan Kenan Güngör",
      url: "https://releaseengineer.tech/about",
      sameAs: [
        "https://github.com/ozankenangungor",
        "https://linkedin.com/in/ozan-kenan-gungor",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://releaseengineer.tech/#software",
      name: "Release Engineer",
      url: "https://releaseengineer.tech",
      description,
      applicationCategory: "DeveloperApplication",
      creator: { "@id": "https://releaseengineer.tech/#founder" },
      provider: { "@id": "https://releaseengineer.tech/#organization" },
      sameAs: "https://github.com/ozankenangungor/release-engineer",
    },
  ],
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
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
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
