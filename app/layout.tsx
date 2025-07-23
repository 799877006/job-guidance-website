import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { SpeedInsights } from "@vercel/speed-insights/next"
import ClientOnly from "@/components/client-only"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "向日offer - Job Hunting Support Service",
  description: "Comprehensive job hunting support platform for students and instructors",
  generator: 'v0.dev'
}

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ClientOnly fallback={<LoadingFallback />}>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ClientOnly>
      <SpeedInsights />
      </body>
    </html>
  )
}
