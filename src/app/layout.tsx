import type { Metadata } from "next";
import { Header, Footer } from "@/components/brand";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "400 700",
});
const title = "Release Engineer — Claude-native release readiness";
const description =
  "Claude-powered release-readiness reviews of bounded public GitHub pull-request metadata and patches, with explicit coverage limitations.";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://releaseengineer.tech/#organization",
      name: "Release Engineer",
      url: "https://releaseengineer.tech",
      logo: "https://releaseengineer.tech/release-engineer-logo.svg",
      email: "founder@releaseengineer.tech",
      foundingDate: "2026-10",
      description:
        "Release Engineer is an early-stage, bootstrapped developer-tool startup founded in October 2026 in Ankara, Türkiye.",
      founder: { "@id": "https://releaseengineer.tech/#founder" },
      sameAs: ["https://github.com/ozankenangungor/release-engineer"],
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
      jobTitle: "Founder",
      worksFor: { "@id": "https://releaseengineer.tech/#organization" },
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
      operatingSystem: "Web",
      creator: { "@id": "https://releaseengineer.tech/#founder" },
      provider: { "@id": "https://releaseengineer.tech/#organization" },
      isPartOf: { "@id": "https://releaseengineer.tech/#website" },
      sameAs: "https://github.com/ozankenangungor/release-engineer",
    },
    {
      "@type": "WebSite",
      "@id": "https://releaseengineer.tech/#website",
      name: "Release Engineer",
      alternateName: "releaseengineer.tech",
      url: "https://releaseengineer.tech/",
      publisher: { "@id": "https://releaseengineer.tech/#organization" },
      description,
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://releaseengineer.tech"),
  title,
  description,
  alternates: { canonical: "./" },
  verification: {
    google: "Q6JeeJ0ggduEaYxk6bkgjARI7CQn9a8vbBMz5wh7G4E",
  },
  openGraph: {
    title,
    description,
    url: "./",
    siteName: "Release Engineer",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Release Engineer — Claude-native release readiness for GitHub pull requests",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} flex min-h-screen flex-col`}>
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
