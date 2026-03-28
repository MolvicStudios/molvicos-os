import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['icons/*.png'],
			manifest: {
				name: 'Molvicos — AI Operating System',
				short_name: 'Molvicos',
				description: 'Your AI OS. Prompt engineering, local models, and productivity tools.',
				theme_color: '#06090f',
				background_color: '#06090f',
				display: 'standalone',
				orientation: 'landscape',
				start_url: '/os',
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
				]
			},
			workbox: {
			maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
			globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts',
							expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
						}
					}
				]
			}
		})
	]
});
