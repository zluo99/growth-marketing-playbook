/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Inter } from "next/font/google"

import { ThemeProvider } from "@/components/providers/theme-provider"

import { BrandCopy } from "@/features/playbook/copy/page"

import "./globals.css"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface RootLayoutProps {
	children: ReactNode
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" })

const site_url = new URL(
	process.env.NEXT_PUBLIC_SITE_URL ||
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
)

export const metadata: Metadata = {
	metadataBase: site_url,
	title: BrandCopy.title,
	description: BrandCopy.byline,
	robots: { index: true, follow: true },
	openGraph: {
		title: BrandCopy.title,
		description: BrandCopy.byline,
		type: "website",
		url: site_url,
	},
	twitter: {
		card: "summary",
		title: BrandCopy.title,
		description: BrandCopy.byline,
	},
}

export const viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
}

/* -------------------------------------------------------------------------- */
/* Default export                                                             */
/* -------------------------------------------------------------------------- */

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="en" className={inter.variable} suppressHydrationWarning>
			<body className="app-shell min-h-screen [text-size-adjust:100%]">
				<ThemeProvider>
					<div className="app-container">{children}</div>
				</ThemeProvider>
			</body>
		</html>
	)
}

