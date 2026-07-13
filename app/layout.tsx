import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import Shell from "./components/Shell";

// Three deliberate roles: Space Grotesk = display/brand, Inter = body,
// JetBrains Mono = instrument readouts (versions, paths, stars).
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Skill Radar",
  description: "A local-first dashboard for your AI agent skills: detect installed, keep a whitelist, search GitHub, install.",
};

// Set the theme before first paint to avoid a flash of the wrong palette.
const noFlash = `(function(){try{var t=localStorage.getItem('gs.theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
