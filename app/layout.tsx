import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteChrome } from "@/components/site-chrome";
import { Cursor } from "@/components/cursor";

export const metadata: Metadata = {
  title: "Syllis — Independent fashion",
  description: "Discover independent fashion, emerging labels and pieces worth knowing.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Cursor />
          <SiteChrome />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
