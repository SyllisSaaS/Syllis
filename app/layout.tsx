import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, Syne } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LookProvider } from "@/components/look-provider";
import { SiteChrome } from "@/components/site-chrome";
import { ColourBlobs } from "@/components/colour-blobs";
import { Cursor } from "@/components/cursor";
import { DEFAULT_LOOK } from "@/lib/look";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Syllis — Independent fashion",
  description: "Discover independent fashion, emerging labels and pieces worth knowing.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${instrument.variable}`}
      data-look={DEFAULT_LOOK}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem("syllis-look");if(l==="colour"||l==="studio"){document.documentElement.setAttribute("data-look",l);}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <LookProvider initialLook={DEFAULT_LOOK}>
            <ColourBlobs />
            <Cursor />
            <SiteChrome />
            <main>{children}</main>
          </LookProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
