<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { storage } from '$lib/storage/local.js';
	import { detectLang } from '$lib/i18n/index.js';

	let ready = false;

	const apps = [
		{ emoji: '🔧', name: 'Prompt Lab', desc: 'Optimize & save prompts with AI scoring' },
		{ emoji: '🎯', name: 'Prospectly', desc: 'B2B outreach messages powered by AI' },
		{ emoji: '💼', name: 'AIWorkSuite', desc: 'Freelance productivity & project management' },
		{ emoji: '📝', name: 'Repurposer', desc: 'Transform content into 6 formats instantly' },
		{ emoji: '🔍', name: 'Brief Gen', desc: 'Generate complete SEO briefs in seconds' },
		{ emoji: '⚙️', name: 'Workflow Builder', desc: 'Visual prompt-to-automation pipelines' },
		{ emoji: '🤖', name: 'Local Models', desc: 'Run AI locally via Ollama bridge' },
		{ emoji: '💻', name: 'AI Terminal', desc: 'Conversational CLI for power users' },
		{ emoji: '📊', name: 'Dashboard', desc: 'Track usage & stats' },
		{ emoji: '💰', name: 'QuoteForge', desc: 'Generate professional project quotes with AI' },
		{ emoji: '📑', name: 'ContractGen', desc: 'AI-powered freelance contracts in seconds' },
		{ emoji: '🧾', name: 'InvoiceAI', desc: 'Smart invoices with tax-aware formatting' },
	];

	const features = [
		{ icon: '🧠', title: 'AI-Native Desktop', desc: 'Every app is built around AI — not bolted on. Your entire workflow, reimagined.' },
		{ icon: '🔒', title: 'Privacy First', desc: 'Runs in your browser. API keys stay local. No data leaves your machine.' },
		{ icon: '⚡', title: '12+ Built-in Apps', desc: 'From prompt engineering to outreach to invoicing — everything in one OS.' },
		{ icon: '🌍', title: '5 Languages', desc: 'Full i18n support: English, Español, Deutsch, Français, 中文.' },
		{ icon: '🎨', title: 'Themeable', desc: 'Multiple themes — Cyberpunk dark, warm light, and more. All free.' },
		{ icon: '🤖', title: 'MIRA Assistant', desc: 'Built-in AI copilot that understands your OS and helps across all apps.' },
	];

	const faqs = [
		{ q: 'Is Molvicos really free?', a: 'Yes, 100% free with no registration required. All features are unlocked. Just open the app and start working.' },
		{ q: 'What happens to my data?', a: 'Everything stays in your browser\'s localStorage. API keys never leave your device. We don\'t collect or store any of your data.' },
		{ q: 'Can I use my own API keys?', a: 'Absolutely. Bring your OpenAI, Groq, Anthropic, or Ollama keys. You\'re always in control.' },
		{ q: 'Do I need to create an account?', a: 'No. There is no sign-up, no login, no registration. Just open and use.' },
		{ q: 'Is it a real OS?', a: 'It\'s a Progressive Web App that looks and feels like an OS. Install it on any device — it works offline too.' },
		{ q: 'What AI providers are supported?', a: 'Groq, OpenAI, Anthropic, Gemini, Mistral, GitHub Models, and local Ollama models.' },
	];

	let openFaq = -1;
	let mobileMenuOpen = false;

	function toggleFaq(i) { openFaq = openFaq === i ? -1 : i; }

	onMount(() => {
		detectLang();
		ready = true;

		// Adsterra Native Banner
		const adContainer = document.getElementById('adsterra-container');
		if (adContainer) {
			const s = document.createElement('script');
			s.async = true;
			s.dataset.cfasync = 'false';
			s.src = 'https://pl29050767.profitablecpmratenetwork.com/895f21b3d4e69e3a0245b9adbdc68c23/invoke.js';
			adContainer.appendChild(s);
		}
	});
</script>

<svelte:head>
	<title>Molvicos — AI Operating System for Creators & Freelancers</title>
	<meta name="description" content="The AI-powered operating system with 12+ built-in apps for prompt engineering, outreach, SEO, content repurposing, invoicing and more. 100% free, no registration." />
	<meta property="og:title" content="Molvicos — AI Operating System for Creators & Freelancers" />
	<meta property="og:description" content="12+ AI apps in one cyberpunk desktop. Prompt engineering, outreach, invoicing & more. 100% free." />
	<meta property="og:image" content="https://molvicos.pro/og-image.png" />
	<meta property="og:url" content="https://molvicos.pro" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Molvicos" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:locale:alternate" content="es_ES" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Molvicos — AI Operating System" />
	<meta name="twitter:description" content="12+ AI apps in one cyberpunk desktop. 100% free." />
	<meta name="twitter:image" content="https://molvicos.pro/og-image.png" />
	{@html '<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Molvicos","description":"AI Operating System with 12+ built-in apps for creators and freelancers. 100% free.","url":"https://molvicos.pro","applicationCategory":"ProductivityApplication","operatingSystem":"Web","offers":{"@type":"Offer","price":"0","priceCurrency":"EUR","description":"Free — all features unlocked"},"creator":{"@type":"Organization","name":"MolvicStudios","url":"https://molvicstudios.pro"}}</script>'}
</svelte:head>

{#if ready}
<div class="landing">

	<!-- NAV -->
	<nav class="nav">
		<a href="/" class="logo">
			<span class="logo-icon">◈</span> Molvicos
		</a>
		<button class="hamburger" aria-label="Toggle menu" on:click={() => mobileMenuOpen = !mobileMenuOpen}>
			<span class="hamburger-line" class:open={mobileMenuOpen}></span>
			<span class="hamburger-line" class:open={mobileMenuOpen}></span>
			<span class="hamburger-line" class:open={mobileMenuOpen}></span>
		</button>
		<div class="nav-links" class:mobile-open={mobileMenuOpen}>
			<a href="#features" on:click={() => mobileMenuOpen = false}>Features</a>
			<a href="#apps" on:click={() => mobileMenuOpen = false}>Apps</a>
			<a href="#faq" on:click={() => mobileMenuOpen = false}>FAQ</a>
			<a href="/os" class="btn-nav">Abrir app →</a>
		</div>
	</nav>

	<!-- HERO -->
	<section class="hero">
		<div class="hero-badge">✦ 100% Free — No registration required</div>
	<div class="social-proof-bar" style="text-align:center;padding:0.5rem;font-size:0.78rem;color:var(--lp-text2);margin-top:-1rem;margin-bottom:1.5rem;">
		✅ Made by MolvicStudios · Built in Spain · Support in Spanish & English
	</div>
		<h1>Your AI Operating System</h1>
		<p class="hero-sub">
			12+ built-in apps for prompt engineering, outreach, SEO, invoicing &amp; automation.
			<br/>Runs in your browser. Privacy-first. 100% free.
		</p>
		<div class="hero-ctas">
			<a href="/os" class="btn btn-primary">Usar ahora →</a>
		</div>
		<p class="hero-note">No registration · No credit card · Installs as PWA · Works offline</p>
	</section>

	<!-- PREVIEW -->
	<section class="preview">
		<div class="preview-window">
			<div class="preview-bar">
				<span class="dot red"></span>
				<span class="dot yellow"></span>
				<span class="dot green"></span>
				<span class="preview-title">Molvicos OS</span>
			</div>
			<div class="preview-screen">
				<div class="preview-dock">
					{#each apps.slice(0, 5) as app}
						<div class="dock-icon" title={app.name}>{app.emoji}</div>
					{/each}
				</div>
				<div class="preview-grid">
					<div class="preview-card accent">
						<span class="pc-icon">🧠</span>
						<span>MIRA</span>
					</div>
					<div class="preview-card">
						<span class="pc-icon">🔧</span>
						<span>Prompt Lab</span>
					</div>
					<div class="preview-card">
						<span class="pc-icon">🎯</span>
						<span>Prospectly</span>
					</div>
				</div>
				<div class="preview-scanline"></div>
			</div>
		</div>
	</section>

	<!-- FEATURES -->
	<section id="features" class="features">
		<h2>Built Different</h2>
		<p class="section-sub">Not another SaaS dashboard. A full AI-native operating system.</p>
		<div class="features-grid">
			{#each features as f}
				<div class="feature-card">
					<span class="feature-icon">{f.icon}</span>
					<h3>{f.title}</h3>
					<p>{f.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- ADSTERRA NATIVE BANNER -->
	<div id="adsterra-container" style="width:100%; max-width:900px; margin: 2rem auto; overflow:hidden;">
		<div id="container-895f21b3d4e69e3a0245b9adbdc68c23"></div>
	</div>

	<!-- APPS -->
	<section id="apps" class="apps-section">
		<h2>12+ Apps. One Desktop.</h2>
		<p class="section-sub">Every tool you need — integrated, not scattered.</p>
		<div class="apps-grid">
			{#each apps as app}
				<div class="app-card">
					<span class="app-emoji">{app.emoji}</span>
					<h3>{app.name}</h3>
					<p>{app.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- FAQ -->
	<section id="faq" class="faq">
		<h2>FAQ</h2>
		<div class="faq-list">
			{#each faqs as faq, i}
				<button class="faq-item" class:open={openFaq === i} on:click={() => toggleFaq(i)}>
					<div class="faq-q">
						<span>{faq.q}</span>
						<span class="faq-chevron">{openFaq === i ? '−' : '+'}</span>
					</div>
					{#if openFaq === i}
						<div class="faq-a">{faq.a}</div>
					{/if}
				</button>
			{/each}
		</div>
	</section>

	<!-- FINAL CTA -->
	<section class="final-cta">
		<h2>Ready to run your AI desktop?</h2>
		<p>All features unlocked. No sign-up needed. Start now.</p>
		<div class="hero-ctas">
			<a href="/os" class="btn btn-primary">Abrir app →</a>
		</div>
	</section>

	<!-- FOOTER -->
	<footer class="footer">
		<div class="footer-inner">
			<span class="logo-icon">◈</span>
			<span>Molvicos · © {new Date().getFullYear()} Molvic Studios</span>
			<div class="footer-links">
				<a href="#features">Features</a>
				<a href="#apps">Apps</a>
				<a href="/legal/privacy.html">Privacy</a>
				<a href="/legal/terms.html">Terms</a>
				<a href="/legal/cookies.html">Cookies</a>
			</div>
		</div>
	</footer>

</div>
{/if}

<style>
	/* ─── LANDING GLOBALS ─── */
	.landing {
		--lp-bg: var(--bg-base, #06090f);
		--lp-surface: var(--bg-surface, #0a0f1a);
		--lp-elevated: var(--bg-elevated, #0f1520);
		--lp-accent: var(--accent, #00ff88);
		--lp-accent2: var(--accent2, #00ccff);
		--lp-text: var(--text-primary, #c8dfd4);
		--lp-text2: var(--text-secondary, #5a7a6a);
		--lp-muted: var(--text-muted, #2a3a30);
		--lp-border: var(--border, #1a2a20);
		--lp-radius: 12px;

		font-family: var(--font-mono, 'Space Mono', monospace);
		color: var(--lp-text);
		background: var(--lp-bg);
		min-height: 100vh;
		overflow-x: hidden;
	}

	h1, h2, h3 {
		font-family: var(--font-display, 'Syne', sans-serif);
		color: #fff;
	}

	h2 {
		font-size: clamp(1.8rem, 4vw, 2.8rem);
		text-align: center;
		margin-bottom: 0.3em;
	}

	.section-sub {
		text-align: center;
		color: var(--lp-text2);
		margin-bottom: 3rem;
		font-size: 0.95rem;
	}

	a { color: var(--lp-accent); text-decoration: none; }

	/* ─── BUTTONS ─── */
	.btn {
		display: inline-flex; align-items: center; justify-content: center;
		padding: 0.8em 1.8em;
		border-radius: var(--lp-radius);
		font-family: var(--font-display, 'Syne', sans-serif);
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		border: none;
	}
	.btn-primary {
		background: var(--lp-accent);
		color: var(--lp-bg);
	}
	.btn-primary:hover {
		box-shadow: 0 0 24px var(--lp-accent);
		transform: translateY(-1px);
	}
	.btn-outline {
		background: transparent;
		border: 1.5px solid var(--lp-accent);
		color: var(--lp-accent);
	}
	.btn-outline:hover {
		background: rgba(0,255,136,0.08);
	}
	.full-w { width: 100%; }

	/* ─── NAV ─── */
	.nav {
		display: flex; align-items: center; justify-content: space-between;
		padding: 1.2rem 2rem;
		position: sticky; top: 0; z-index: 100;
		background: rgba(6,9,15,0.85);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--lp-border);
	}
	.logo {
		font-family: var(--font-display, 'Syne', sans-serif);
		font-weight: 800; font-size: 1.3rem; color: #fff;
		display: flex; align-items: center; gap: 0.4em;
	}
	.logo-icon { color: var(--lp-accent); font-size: 1.4em; }
	.nav-links { display: flex; align-items: center; gap: 1.5rem; font-size: 0.85rem; }
	.nav-links a { color: var(--lp-text2); transition: color 0.15s; }
	.nav-links a:hover { color: var(--lp-accent); }
	.btn-nav {
		background: var(--lp-accent); color: var(--lp-bg);
		padding: 0.5em 1.2em; border-radius: 8px;
		font-weight: 700; font-size: 0.85rem;
	}

	/* ─── HERO ─── */
	.hero {
		text-align: center;
		padding: 6rem 1.5rem 3rem;
		max-width: 780px;
		margin: 0 auto;
	}
	.hero-badge {
		display: inline-block;
		background: rgba(0,255,136,0.08);
		border: 1px solid rgba(0,255,136,0.2);
		border-radius: 99px;
		padding: 0.4em 1.2em;
		font-size: 0.8rem;
		color: var(--lp-accent);
		margin-bottom: 2rem;
		letter-spacing: 0.05em;
	}
	.hero h1 {
		font-size: clamp(2.4rem, 6vw, 4rem);
		line-height: 1.1;
		margin-bottom: 1rem;
		background: linear-gradient(135deg, #fff 40%, var(--lp-accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	.hero-sub {
		font-size: clamp(0.95rem, 2vw, 1.15rem);
		color: var(--lp-text2);
		line-height: 1.6;
		margin-bottom: 2.5rem;
	}
	.hero-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
	.hero-note { margin-top: 1.5rem; font-size: 0.78rem; color: var(--lp-muted); }

	/* ─── PREVIEW ─── */
	.preview {
		padding: 0 1.5rem 5rem;
		display: flex; justify-content: center;
	}
	.preview-window {
		width: 100%; max-width: 700px;
		border-radius: 14px;
		border: 1px solid var(--lp-border);
		overflow: hidden;
		box-shadow: 0 8px 60px rgba(0,255,136,0.06), 0 0 0 1px rgba(0,255,136,0.04);
	}
	.preview-bar {
		display: flex; align-items: center; gap: 6px;
		padding: 10px 14px;
		background: var(--lp-elevated);
		border-bottom: 1px solid var(--lp-border);
	}
	.dot { width: 10px; height: 10px; border-radius: 50%; }
	.dot.red { background: #ff4455; }
	.dot.yellow { background: #ffaa00; }
	.dot.green { background: #00ff88; }
	.preview-title {
		margin-left: auto; font-size: 0.72rem; color: var(--lp-text2); letter-spacing: 0.04em;
	}
	.preview-screen {
		background: var(--lp-surface);
		padding: 2rem;
		position: relative;
		min-height: 220px;
	}
	.preview-dock {
		display: flex; gap: 12px; justify-content: center; margin-bottom: 1.5rem;
	}
	.dock-icon {
		width: 42px; height: 42px;
		display: flex; align-items: center; justify-content: center;
		font-size: 1.3rem;
		background: var(--lp-elevated);
		border: 1px solid var(--lp-border);
		border-radius: 10px;
		transition: transform 0.2s;
	}
	.dock-icon:hover { transform: translateY(-3px); }
	.preview-grid {
		display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
	}
	.preview-card {
		background: var(--lp-elevated);
		border: 1px solid var(--lp-border);
		border-radius: 10px;
		padding: 1rem;
		display: flex; align-items: center; gap: 0.5em;
		font-size: 0.78rem; color: var(--lp-text2);
	}
	.preview-card.accent { border-color: rgba(0,255,136,0.25); }
	.pc-icon { font-size: 1.1rem; }
	.preview-scanline {
		position: absolute; left: 0; right: 0; top: 0; height: 2px;
		background: var(--lp-accent); opacity: 0.15;
		animation: scanDown 4s linear infinite;
	}

	@keyframes scanDown {
		0% { top: 0; }
		100% { top: 100%; }
	}

	/* ─── FEATURES ─── */
	.features {
		padding: 5rem 1.5rem;
		max-width: 1000px; margin: 0 auto;
	}
	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.2rem;
	}
	.feature-card {
		background: var(--lp-surface);
		border: 1px solid var(--lp-border);
		border-radius: var(--lp-radius);
		padding: 1.6rem;
		transition: border-color 0.2s, transform 0.2s;
	}
	.feature-card:hover {
		border-color: rgba(0,255,136,0.25);
		transform: translateY(-2px);
	}
	.feature-icon { font-size: 1.6rem; display: block; margin-bottom: 0.6rem; }
	.feature-card h3 { font-size: 1.05rem; margin-bottom: 0.4rem; }
	.feature-card p { font-size: 0.82rem; color: var(--lp-text2); line-height: 1.5; }

	/* ─── APPS ─── */
	.apps-section {
		padding: 5rem 1.5rem;
		max-width: 1000px; margin: 0 auto;
	}
	.apps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}
	.app-card {
		background: var(--lp-surface);
		border: 1px solid var(--lp-border);
		border-radius: var(--lp-radius);
		padding: 1.4rem;
		text-align: center;
		transition: border-color 0.2s, transform 0.2s;
	}
	.app-card:hover {
		border-color: rgba(0,204,255,0.3);
		transform: translateY(-2px);
	}
	.app-emoji { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
	.app-card h3 { font-size: 0.95rem; margin-bottom: 0.3rem; }
	.app-card p { font-size: 0.75rem; color: var(--lp-text2); line-height: 1.4; }

	/* ─── PRICING (removed) ─── */

	/* ─── FAQ ─── */
	/* ─── FAQ ─── */
	.faq {
		padding: 5rem 1.5rem;
		max-width: 650px; margin: 0 auto;
	}
	.faq-list { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 2rem; }
	.faq-item {
		background: var(--lp-surface);
		border: 1px solid var(--lp-border);
		border-radius: var(--lp-radius);
		padding: 1rem 1.2rem;
		cursor: pointer;
		text-align: left;
		width: 100%;
		font-family: inherit;
		color: inherit;
		transition: border-color 0.2s;
	}
	.faq-item:hover, .faq-item.open {
		border-color: rgba(0,255,136,0.2);
	}
	.faq-q {
		display: flex; justify-content: space-between; align-items: center;
		font-size: 0.92rem; color: #fff;
		font-family: var(--font-display, 'Syne', sans-serif);
		font-weight: 600;
	}
	.faq-chevron { color: var(--lp-accent); font-size: 1.2rem; }
	.faq-a {
		margin-top: 0.8rem;
		font-size: 0.82rem;
		color: var(--lp-text2);
		line-height: 1.6;
	}

	/* ─── FINAL CTA ─── */
	.final-cta {
		text-align: center;
		padding: 5rem 1.5rem;
		background: linear-gradient(180deg, transparent, rgba(0,255,136,0.03));
	}
	.final-cta h2 { margin-bottom: 0.5rem; }
	.final-cta p { color: var(--lp-text2); margin-bottom: 2rem; font-size: 0.95rem; }

	/* ─── FOOTER ─── */
	.footer {
		border-top: 1px solid var(--lp-border);
		padding: 1.5rem 2rem;
	}
	.footer-inner {
		max-width: 1000px; margin: 0 auto;
		display: flex; align-items: center; justify-content: space-between;
		font-size: 0.78rem; color: var(--lp-text2);
	}
	.footer-links { display: flex; gap: 1.2rem; }
	.footer-links a { color: var(--lp-text2); }
	.footer-links a:hover { color: var(--lp-accent); }

	/* ─── RESPONSIVE ─── */
	.hamburger {
		display: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 6px;
		z-index: 1001;
	}
	.hamburger-line {
		display: block;
		width: 22px;
		height: 2px;
		background: var(--lp-text);
		margin: 5px 0;
		transition: transform 0.2s, opacity 0.2s;
		border-radius: 1px;
	}
	.hamburger-line.open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
	.hamburger-line.open:nth-child(2) { opacity: 0; }
	.hamburger-line.open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

	@media (max-width: 640px) {
		.hamburger { display: block; }
		.nav-links {
			display: none;
			position: fixed;
			inset: 0;
			top: 56px;
			background: rgba(6,9,15,0.96);
			backdrop-filter: blur(20px);
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 2rem;
			font-size: 1.1rem;
			z-index: 1000;
		}
		.nav-links.mobile-open { display: flex; }
		.preview-grid { grid-template-columns: 1fr; }
		.hero { padding: 4rem 1rem 2rem; }
		.footer-inner { flex-direction: column; gap: 0.8rem; text-align: center; }
	}
</style>
