import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
	optimizeDeps: {
		exclude: ['@clerk/clerk-js']
	},
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['icons/*.png', 'icons/*.svg'],
			manifest: {
				name: 'Molvicos — AI Operating System',
				short_name: 'Molvicos',
				description: 'Your AI OS. Prompt engineering, local models, and productivity tools.',
				theme_color: '#06090f',
				background_color: '#06090f',
				display: 'standalone',
				orientation: 'any',
				id: '/os',
				start_url: '/os',
				scope: '/',
				categories: ['productivity', 'utilities', 'developer'],
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
					{ src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
				]
			},
			workbox: {
				maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				navigateFallback: null,
				navigateFallbackDenylist: [/^\/api\//],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-stylesheets',
							expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
						}
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-webfonts',
							expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
							cacheableResponse: { statuses: [0, 200] }
						}
					},
					{
						urlPattern: /\/api\//i,
						handler: 'NetworkOnly'
					}
				]
			}
		})
	]
});
