"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import type { ThemeProviderProps } from "next-themes"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/* -------------------------------------------------------------------------- */
/* Custom: Theme provider                                                     */
/* -------------------------------------------------------------------------- */

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return (
		<NextThemesProvider attribute="class" defaultTheme="system" disableTransitionOnChange storageKey="gmp-theme" {...props}>
			{children}
		</NextThemesProvider>
	)
}
