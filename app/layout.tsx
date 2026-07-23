import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import NavBar from "@/components/NavBar";

// Runs before paint so the page never flashes the wrong theme: an explicit
// choice in localStorage wins, otherwise it falls back to the OS preference.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stranger Chat",
  description: "Talk to random people over text and video",
};

// Baseline for pre-hydration / no-JS — matched purely by the OS's
// prefers-color-scheme, no reliance on the theme-init script. The manual
// in-app toggle additionally updates this meta tag live (see writeTheme in
// ThemeContext) so it stays correct after an explicit override too.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      {/* suppressHydrationWarning: some browser extensions (antivirus/ad-block
          tools) inject attributes like bis_skin_checked into <body> before
          React hydrates. That's a mismatch React can't do anything about —
          this only silences the warning for this element, it doesn't affect
          hydration of anything inside it. */}
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <NavBar />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
