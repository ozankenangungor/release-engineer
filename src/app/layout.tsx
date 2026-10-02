import type { Metadata, Viewport } from "next";
import { Header, Footer } from "@/components/brand";
import { MotionSurfaces } from "@/components/motion-surfaces";
import localFont from "next/font/local";
import "./globals.css";
import "./experience.css";

const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "400 700",
});
const title = "Release Engineer — Review public GitHub PRs with Claude";
const description =
  "Review public GitHub pull requests with Claude for potential release risks, missing tests and breaking changes. Evidence, coverage limits and human verification.";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://releaseengineer.tech/#founder",
      name: "Ozan Kenan Güngör",
      url: "https://releaseengineer.tech/about",
      jobTitle: "Founder",
      email: "founder@releaseengineer.tech",
      homeLocation: {
        "@type": "Place",
        name: "Ankara, Türkiye",
      },
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
      provider: { "@id": "https://releaseengineer.tech/#founder" },
      isPartOf: { "@id": "https://releaseengineer.tech/#website" },
      sameAs: "https://github.com/ozankenangungor/release-engineer",
    },
    {
      "@type": "WebSite",
      "@id": "https://releaseengineer.tech/#website",
      name: "Release Engineer",
      alternateName: "releaseengineer.tech",
      url: "https://releaseengineer.tech/",
      publisher: { "@id": "https://releaseengineer.tech/#founder" },
      description,
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#060709",
  colorScheme: "dark",
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
        alt: "Release Engineer — Public GitHub PR reviews with Claude",
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
        <div className="flex-1">
          <MotionSurfaces>{children}</MotionSurfaces>
        </div>
        <Footer />
      </body>
    </html>
  );
}
