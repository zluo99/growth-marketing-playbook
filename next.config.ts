import type { NextConfig } from "next";

const is_prod = process.env.NODE_ENV === "production"

const script_src = [
	"'self'",
	"'unsafe-inline'",
	...(is_prod ? [] : ["'unsafe-eval'"]),
].join(" ")

const csp = [
	"default-src 'self'",
	"base-uri 'self'",
	"object-src 'none'",
	"frame-ancestors 'none'",
	"img-src 'self' data: blob: https:",
	"font-src 'self' data: https:",
	"style-src 'self' 'unsafe-inline'",
	`script-src ${script_src}`,
	"connect-src 'self' https:",
	"worker-src 'self' blob:",
	"frame-src 'self' https://docs.google.com https://*.google.com",
].join("; ")

const nextConfig: NextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	async headers() {
		const hsts = is_prod ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }] : []
		return [
			{
				source: "/:path*",
				headers: [
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
					{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
					{ key: "Cross-Origin-Resource-Policy", value: "same-origin" },
					{ key: "Content-Security-Policy", value: csp },
					...hsts,
				],
			},
		]
	},
	webpack: (config, { isServer }) => {
		// Only apply these fallbacks on the client
		if (!isServer) {
			config.resolve = config.resolve || {};
			config.resolve.fallback = { ...(config.resolve.fallback || {}), fs: false, path: false };

			// Handle WASM files
			config.module.rules.push({
				test: /\.wasm$/,
				type: "webassembly/async",
			});

			config.experiments = config.experiments || {};
			config.experiments.asyncWebAssembly = true;
		}

		return config;
	}
};

export default nextConfig;
