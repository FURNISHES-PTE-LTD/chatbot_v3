import type React from "react"
import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const manrope = Manrope({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Eva — AI Design Assistant",
  description: "AI-powered design assistant for your space and style preferences.",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`font-sans antialiased ${manrope.className}`}>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
