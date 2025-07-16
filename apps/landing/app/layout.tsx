import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "BitSwitch - Feature Flags & A/B Testing Platform",
    template: "%s | BitSwitch"
  },
  description: "Ship features with confidence using powerful feature flags, A/B testing, and real-time insights. Deploy safely, experiment boldly, and deliver exceptional user experiences.",
  keywords: [
    "feature flags",
    "feature toggles",
    "A/B testing",
    "experimentation",
    "deployment",
    "rollout",
    "kill switch",
    "user targeting",
    "analytics",
    "developer tools",
    "continuous deployment",
    "progressive delivery"
  ],
  authors: [{ name: "BitSwitch Team" }],
  creator: "BitSwitch",
  publisher: "BitSwitch",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://bitswitch.tech"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BitSwitch - Feature Flags & A/B Testing Platform",
    description: "Ship features with confidence using powerful feature flags, A/B testing, and real-time insights. Deploy safely, experiment boldly, and deliver exceptional user experiences.",
    url: "https://bitswitch.tech",
    siteName: "BitSwitch",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BitSwitch - Feature Flags & A/B Testing Platform",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BitSwitch - Feature Flags & A/B Testing Platform",
    description: "Ship features with confidence using powerful feature flags, A/B testing, and real-time insights.",
    images: ["/og-image.jpg"],
    creator: "@bitswitch",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "BitSwitch",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#4f46e5",
    "theme-color": "#4f46e5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
