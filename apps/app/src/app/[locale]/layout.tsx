import "@v1/ui/globals.css";
import "@/styles/globals.css";
import { Footer } from "@/components/footer";
import { cn } from "@v1/ui/cn";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import dynamic from 'next/dynamic';

// Dynamically import the ErrorBoundary to avoid issues with SSR
const ErrorBoundary = dynamic(
  () => import('@/components/error-boundary'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Create v1",
  description: "Production ready Next.js app",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={params.locale} suppressHydrationWarning>
      <body
        className={cn(
          `${GeistSans.variable} ${GeistMono.variable}`,
          "antialiased",
        )}
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            
            <Footer />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
