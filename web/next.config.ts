import type { NextConfig } from "next";

// ── Security headers (M7-16) ──────────────────────────────────────────────────
// Applied to every route. Values are conservative for an internal SPA:
// - CSP allows same-origin + fonts.googleapis.com (Inter/JetBrains from next/font)
// - Strict-Transport-Security enforced from day 1 for ops discipline
// - No iframe embedding (internal tool, not embeddable)

const securityHeaders = [
	{ key: "X-DNS-Prefetch-Control", value: "on" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=()",
	},
	{
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	},
	{
		key: "Content-Security-Policy",
		value: [
			"default-src 'self'",
			"script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js dev needs unsafe-eval
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data: blob:",
			"connect-src 'self' http://localhost:3001 ws://localhost:3001",
			"frame-ancestors 'none'",
		].join("; "),
	},
];

const nextConfig: NextConfig = {
	experimental: {
		typedRoutes: true,
	},

	// M7-16 — Security response headers
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
		];
	},

	// M7-20 — Production polish
	poweredByHeader: false, // Remove X-Powered-By: Next.js
	compress: true, // Enable gzip/brotli response compression
	logging: {
		fetches: {
			fullUrl: process.env.NODE_ENV === "development",
		},
	},
};

export default nextConfig;
