export default {
	os: {
		credits: 'credits',
		openApp: 'Open',
		close: 'Close',
		minimize: 'Minimize',
		maximize: 'Maximize',
		clock: 'Clock'
	},
	onboarding: {
		welcome: 'Welcome to Molvicos',
		subtitle: 'Your AI Operating System',
		skip: 'Skip',
		back: 'Back',
		next: 'Next',
		stepOf: 'Step {step} of {total}',
		step1: {
			title: 'Choose your language',
			desc: 'You can change this anytime in settings'
		},
		step2: {
			title: 'Scanning your hardware',
			desc: "We'll recommend the best AI models for your machine",
			scanning: 'Scanning...',
			done: 'Scan complete',
			profile_high: 'High Performance',
			profile_mid: 'Balanced',
			profile_low: 'Light Mode',
			cores: 'cores found',
			memory: 'detected',
			gpu: 'GPU',
			benchmark: 'Benchmark',
			profileDesc_high: '32GB+ RAM detected. You can run the best models.',
			profileDesc_mid: '16GB RAM detected. Great mid-range models available.',
			profileDesc_low: '8GB RAM detected. Optimized lightweight models recommended.'
		},
		step3: {
			title: 'Connect your AI providers',
			desc: 'Add API keys to unlock all features. Free tiers available.',
			free: 'Free Tier',
			paid: 'Paid',
			get_key: 'Get free key →',
			validate: 'Validate',
			valid: 'Valid ✓',
			invalid: 'Invalid ✗',
			skip: 'Skip for now',
			recommended: 'RECOMMENDED'
		},
		step4: {
			title: 'Local AI Models',
			desc: 'Run AI models privately on your machine. No API keys needed.',
			ollama_offline: 'Ollama not detected',
			ollama_online: 'Ollama connected',
			install_ollama: 'Install Ollama',
			detect: 'Detect Ollama',
			recommended: 'Recommended for your PC',
			download: 'Download',
			downloading: 'Downloading...',
			installed: 'Installed',
			skip: 'Skip, use cloud only',
			installStep1: '1. Download Ollama from ollama.com',
			installStep2: '2. Install and run it (it starts automatically)',
			installStep3: '3. Come back here and click "Detect Ollama"'
		},
		step5: {
			title: "You're all set!",
			desc: "Here's a quick tour of your new AI OS",
			launch: 'Launch Molvicos OS',
			tourTopbar: 'Switch languages, check credits, toggle theme',
			tourDesktop: 'All your AI tools in one place. Double-click to open.',
			tourDock: 'Quick access to your favorite apps',
			tourCredits: 'Each AI operation costs credits. Free plan: 30/month.',
			tourCmd: 'Press Cmd+K anytime to search apps and actions',
			tourLocal: 'Run AI privately on your machine. No credits needed.'
		}
	},
	apps: {
		promptlab: { name: 'Prompt Lab', desc: 'Optimizer & Library', tabOptimizer: 'Optimizer', tabLibrary: 'Library', inputLabel: 'Your prompt', inputPlaceholder: 'Paste or write a prompt to optimize...', targetModel: 'Target model', optimizeBtn: 'Optimize', librarySearch: 'Search prompts...', libraryAdd: 'New prompt', libraryEmpty: 'Your library is empty' },
		prospectly: { name: 'Prospectly', desc: 'B2B AI Outreach', tabFinder: 'Finder', tabIcp: 'ICP', tabEmails: 'Emails', tabFollowup: 'Follow-up', tabScript: 'Call Script', tabObjections: 'Objections', tabLinkedin: 'LinkedIn', tabSaved: 'Saved' },
		aiworksuite: { name: 'AIWorkSuite', desc: 'Freelance Productivity', teams: 'AI Teams', invoice: 'Invoice', proposal: 'Proposal', contract: 'Contract', time: 'Time', rate: 'Rate', teamName: 'Team Name', teamProject: 'Project Context', teamProjectPh: 'Describe the project this team will work on...', createAITeam: 'Create AI Team', detectingRoles: 'Detecting roles...', openChat: 'Open Team Chat', messageTeam: 'Message the team...', agentsThinking: 'Agents are thinking...', teamsEmpty: 'Create your first AI team to get started.', clientName: 'Client Name', services: 'Services Rendered', totalAmount: 'Total Amount', dueDate: 'Due Date', generate: 'Generate', projectDesc: 'Project Description', budget: 'Budget Range', timeline: 'Timeline', projectScope: 'Project / Scope', ratePayment: 'Rate / Payment', scopeNotes: 'Scope Notes', annualIncome: 'Desired Annual Income', billableWeeks: 'Billable Weeks/Year', billableHours: 'Billable Hours/Week', overheadPct: 'Overhead % (taxes, tools...)', calculateRate: 'Calculate Rate', copy: 'Copy' },
		repurposer: { name: 'Repurposer', desc: 'Content × 6 formats', inputLabel: 'Source content', inputPlaceholder: 'Paste the content you want to repurpose...', wordCount: '{n} words', selectAll: 'Select all', selectNone: 'Select none', outputLang: 'Output language', repurposeBtn: 'Repurpose' },
		briefgen: { name: 'Brief Gen', desc: 'SEO Briefs AI', keyword: 'Primary keyword', secondaryKw: 'Secondary keywords', contentType: 'Content type', audience: 'Target audience', competitors: 'Competitor URLs', language: 'Language', wordTarget: 'Word target', generateBtn: 'Generate Brief' },
		workflow: { name: 'Automations', desc: 'n8n · Make · Scripts', descLabel: 'Description', descPlaceholder: 'Describe what you want to automate...', triggerType: 'Trigger type', complexity: 'Complexity', errorHandling: 'Include error handling', generateBtn: 'Generate', primaryModule: 'Primary module', resourceType: 'Resource type', level: 'Level', levelBasic: 'Basic', levelAdvanced: 'Advanced' },
		localmodels: { name: 'Local Models', desc: 'Ollama Bridge' },
		terminal: { name: 'AI Terminal', desc: 'Conversational CLI' },
		appstore: { name: 'App Store', desc: 'Marketplace' },
		extensions: { name: 'Extensions', desc: 'Connect services to MIRA' },
		mailcraft: { name: 'MailCraft', desc: 'AI Email Writer', input: 'Recipient & context' },
		dafo: { name: 'DAFO Analysis', desc: 'SWOT Strategy AI' },
		brandname: { name: 'Brand Name', desc: 'Name Generator AI' },
		summarizer: { name: 'Summarizer', desc: 'Text Summarizer AI' },
		toneshifter: { name: 'ToneShifter', desc: 'Tone Translator AI', input: 'Original text' },
		analytics: { name: 'Analytics', desc: 'Site Analytics', connectDesc: 'Connect to your MolvicStudios Analytics Worker' },
		quoteforge: { name: 'QuoteForge', desc: 'AI Quote Generator', projectType: 'Project type', projectDesc: 'Project description', projectDescPh: 'Describe the project you need a quote for...', complexity: 'Complexity', currency: 'Currency', region: 'Region', clientType: 'Client type', timeline: 'Estimated timeline', generateBtn: 'Generate Quote', generating: 'Generating', newQuote: 'New Quote' },
		contractgen: { name: 'ContractGen', desc: 'AI Contract Generator', serviceType: 'Service type', projectDesc: 'Project description', projectDescPh: 'Describe the project scope for the contract...', price: 'Price', deadline: 'Deadline', deliverables: 'Deliverables', deliverablesPh: 'List key deliverables...', payment: 'Payment terms', jurisdiction: 'Jurisdiction', tone: 'Tone', generateBtn: 'Generate Contract', generating: 'Generating', newContract: 'New Contract', disclaimer: 'This document is a template and NOT a substitute for professional legal advice.' },
		invoiceai: { name: 'InvoiceAI', desc: 'AI Invoice Generator', providerInfo: 'Provider details', providerName: 'Name / Company', taxId: 'Tax ID', address: 'Address', clientInfo: 'Client details', clientName: 'Client name', clientCompany: 'Company', clientAddress: 'Client address', invoiceDetails: 'Invoice details', invoiceNum: 'Invoice #', currency: 'Currency', taxRegime: 'Tax regime', services: 'Services / Items', servicesPh: 'Describe services rendered and prices...', generateBtn: 'Generate Invoice', generating: 'Generating', newInvoice: 'New Invoice' },
		itineraries: { name: 'Itineraries', desc: 'Guided AI Workflows' },
		codestudio: { name: 'Code Studio', desc: 'AI Code Editor', edit: 'Edit', preview: 'Preview', download: 'Download', editorPlaceholder: 'Start writing code or use AI to generate...', noCode: 'No code yet.', aiGenerate: 'AI Generate', modelLabel: 'Model', promptLabel: 'Instruction', promptPlaceholder: 'Describe the code to generate or modify...', generateBtn: 'Generate', generating: 'Generating...', noKey: 'No API key configured.', aiHint: 'Enter ↵ to generate · Ctrl+Z to undo' },
		teambuilder: { name: 'Team Builder', desc: 'Multidisciplinary AI Teams', team: 'Team', teamTab: 'Team', chatTab: 'Chat', templates: 'Templates', addMember: 'Add', editMember: 'Edit Member', newMember: 'New Member', memberName: 'Name', memberRole: 'Role', systemPrompt: 'Role system prompt...', emptyTeam: 'Add members or load a template to start.', roundrobin: 'Round-Robin (all respond)', consensus: 'Consensus (summarized)', chatEmpty: 'Ask the team something to get started.', inputPlaceholder: 'Message the team...', addMemberFirst: 'Add team members first', synthesis: 'Team Synthesis' },
		comingSoon: 'Coming Soon',
		comingSoonHint: 'This app is being integrated into the OS.'
	},
	cmd: {
		placeholder: 'Search apps, prompts, actions...',
		apps: 'APPS',
		actions: 'ACTIONS',
		prompts: 'MY PROMPTS',
		settings: 'SETTINGS',
		noResults: 'No results found',
		actionOpenApp: 'Open {app}',
		actionSwitchLang: 'Switch language to {lang}',
		actionToggleTheme: 'Toggle theme',
		actionOpenSettings: 'Open settings',
		actionClearCredits: 'Clear credits history'
	},
	common: {
		loading: 'Loading...',
		error: 'Error',
		success: 'Success',
		cancel: 'Cancel',
		save: 'Save',
		signIn: 'Sign in to sync',
		free: 'Free',
		pro: 'Pro',
		agency: 'Agency'
	},
	mira: {
		name: 'MIRA',
		subtitle: 'Intelligent Research Assistant',
		inputPlaceholder: 'Ask MIRA anything...',
		clearChat: 'Clear chat',
		close: 'Close',
		thinking: 'Thinking...',
		searching: 'Searching the web...',
		noApiKey: 'No API key configured',
		suggestions: {
			openApp: 'Open an app',
			changeTheme: 'Switch theme',
			help: 'How can I help?',
			configKeys: '🔑 Configure API keys',
			openPromptLab: 'Open Prompt Lab',
			exploreLocalModels: 'Explore Local Models',
			tryLightTheme: 'Try light theme',
			switchDarkMode: 'Switch to dark mode',
			helpWritePrompt: 'Help me write a prompt'
		},
		welcomeMsg: "👋 Welcome! I noticed you don't have any API keys configured yet. To use AI features, add at least one key in **Settings → AI & Models**. Groq and Gemini offer free tiers! Alternatively, install **Ollama** for free local AI."
	},
	feedback: {
		title: 'Send Feedback',
		reportBug: 'Report a bug',
		tab_bug: 'Bug',
		tab_feedback: 'Feedback',
		tab_feature: 'Feature',
		severity: 'Severity',
		sev_low: 'Low',
		sev_medium: 'Medium',
		sev_high: 'High',
		sev_critical: 'Critical',
		titleLabel: 'Title',
		titlePlaceholder: 'Brief summary...',
		descLabel: 'Description',
		descPlaceholder: 'Describe in detail...',
		autoCapture: 'Auto-captured data',
		appsOpen: 'apps open',
		actions: 'actions',
		errors: 'errors',
		submit: 'Send',
		sending: 'Sending...',
		thankYou: 'Thank you for your feedback!',
		closeHow: 'How was',
		skip: 'Skip'
	},
	plans: {
		upgradeTitle: 'Upgrade to Pro',
		unlimitedCredits: 'Unlimited AI credits',
		workspaces: 'Up to 5 workspaces',
		miraFull: 'Full MIRA OS control',
		premiumThemes: 'Premium themes',
		mobileApp: 'Mobile app access',
		save89: 'Save $89/year',
		cancelAnytime: 'Cancel anytime',
		creditsLow: 'Credits running low',
		creditsEmpty: 'No credits remaining'
	},
	dashboard: {
		creditsThisMonth: 'Credits this month',
		today: 'Today',
		thisWeek: 'This week',
		thisMonth: 'This month',
		totalActions: 'Total actions',
		favoriteApp: 'Favorite app',
		itineraries: 'Itineraries',
		itinerariesSub: 'Step-by-step guides to get the most out of your apps',
		steps: 'steps',
		min: 'min',
		beginner: 'Beginner',
		intermediate: 'Intermediate',
		openApp: 'Open',
		done: 'Done',
		completed: 'Completed',
		reset: 'Restart',
		itin: {
			'freelance-launch': { name: 'Launch your Freelance', desc: 'Brand, quote, contract and invoice — everything to start.', steps: ['Generate your brand name', 'Create your first quote', 'Draft a base contract', 'Prepare your first invoice'] },
			'outreach-campaign': { name: 'Outreach Campaign', desc: 'Find prospects, write emails and adjust your tone.', steps: ['Find and analyze prospects', 'Write personalized emails', 'Adjust tone for each audience'] },
			'content-multiplatform': { name: 'Multi-platform Content', desc: 'Optimize prompts, repurpose and summarize for every channel.', steps: ['Optimize your base prompt', 'Repurpose into 6 formats', 'Summarize for quick sharing'] },
			'business-strategy': { name: 'Business Strategy', desc: 'SWOT analysis, SEO brief and automation workflow.', steps: ['Run a SWOT analysis', 'Generate an SEO brief', 'Create an automation workflow'] },
			'local-ai-setup': { name: 'Set up Local AI', desc: 'Configure providers, install models and test in the terminal.', steps: ['Configure AI keys in Settings', 'Install local models with Ollama', 'Test your models in the terminal'] },
			'first-automation': { name: 'Your First Automation', desc: 'Craft a prompt, generate a workflow and connect services.', steps: ['Craft the perfect prompt', 'Generate a workflow from it', 'Connect external services'] },
			'first-ai-team': { name: 'Launch your AI Team', desc: 'Create a collaborative team, send emails and sign a contract.', steps: ['Create your AI team in AIWorkSuite', 'Draft outreach emails', 'Generate the collaboration contract'] },
		},
	},
	settings: {
		title: 'Settings',
		general: 'General',
		appearance: 'Appearance',
		ai: 'AI & Models',
		account: 'Account & Plan',
		about: 'About',
		dock: 'Dock',
		language: 'Language',
		languageSub: 'OS interface language',
		keysLocal: 'All keys are stored locally in your browser.',
		ollamaStatus: 'Ollama Status',
		licenseKey: 'License Key',
		licenseKeySub: 'Already purchased? Enter your key below.',
		activate: 'Activate',
		deactivate: 'Deactivate',
		n8nUrl: 'n8n Instance URL',
		n8nUrlSub: 'Connect your self-hosted n8n',
		saved: 'Saved',
		openTutorial: 'Open Tutorial',
		feedback: 'Feedback & Bugs',
		desktops: 'Desktops',
		demoModeBanner: 'Demo Mode — Add an API key in Settings for full AI access',
		modelSelect: 'Default model',
		modelSelectSub: 'Model used by default for this provider',
		kofiTitle: 'Support Molvicos',
		kofiSub: 'If you enjoy Molvicos OS, consider buying us a coffee!',
		kofiButton: 'Buy a Coffee'
	},
	tutorial: {
		skip: 'Skip',
		launch: 'Start using Molvicos',
		welcome: {
			title: 'Welcome to Molvicos OS',
			desc: 'Your AI-powered operating system running in the browser. Let\'s take a quick tour of everything you can do.',
			sub: 'You can reopen this tutorial anytime from Settings.'
		},
		desktop: {
			title: 'Your Desktop',
			desc: 'All your AI apps live here. Double-click any icon to open it. Drag icons to rearrange them to your liking.'
		},
		dock: {
			title: 'The Dock',
			desc: 'Your favorite apps pinned at the bottom for quick access. Click to open, click again to minimize. Active apps show a dot indicator.'
		},
		topbar: {
			title: 'Top Bar',
			desc: 'Switch languages, check your credit balance, toggle between light and dark themes, and access your account — all from the top bar.'
		},
		cmdk: {
			title: 'Command Palette (Cmd+K)',
			desc: 'Press Cmd+K (or Ctrl+K) anytime to quickly search and open apps, switch language, toggle theme, and more. Your productivity shortcut.'
		},
		promptlab: {
			title: '🔧 Prompt Lab',
			desc: 'Optimize any prompt for better AI results. Paste your prompt, choose target model, and get an enhanced version. Save favorites to your library.'
		},
		prospectly: {
			title: '🎯 Prospectly',
			desc: 'AI-powered B2B outreach tool. Analyze prospects, generate personalized cold emails, and manage your outreach pipeline.'
		},
		aiworksuite: {
			title: '💼 AIWorkSuite',
			desc: 'Complete freelancer toolkit: create AI Teams for collaborative projects, generate invoices, proposals, contracts, and calculate your ideal rate.'
		},
		repurposer: {
			title: '📝 Repurposer',
			desc: 'Transform one piece of content into 6 different formats: tweets, LinkedIn posts, emails, blog intros, video scripts, and more.'
		},
		briefgen: {
			title: '🔍 Brief Gen',
			desc: 'Generate comprehensive SEO content briefs with keywords, structure, competitor analysis, and word targets.'
		},
		workflow: {
			title: '⚙️ Automations',
			desc: 'Generate n8n and Make automation workflows, plus custom scripts. Describe what you want to automate and get ready-to-use code.'
		},
		terminal: {
			title: '💻 AI Terminal',
			desc: 'Conversational command-line interface. Ask questions, generate code, or have natural conversations with AI — in a terminal style.'
		},
		localmodels: {
			title: '🤖 Local Models',
			desc: 'Run AI models privately on your machine via Ollama. No API keys needed, no credits consumed. Full privacy, zero cost.'
		},
		mailcraft: {
			title: '✉️ MailCraft',
			desc: 'Generate professional emails with AI. Set recipient, context, and tone — get perfectly crafted messages in seconds.'
		},
		dafo: {
			title: '📋 DAFO Analysis',
			desc: 'AI-powered SWOT/DAFO analysis for your business or project. Get insights on Strengths, Weaknesses, Opportunities, and Threats.'
		},
		brandname: {
			title: '💡 BrandName',
			desc: 'Generate creative brand names for your business. Set industry, values, and style — get unique naming suggestions with domain availability.'
		},
		summarizer: {
			title: '📄 Summarizer',
			desc: 'Paste any long text and get a concise summary. Perfect for articles, reports, documentation, and meeting notes.'
		},
		toneshifter: {
			title: '🔄 ToneShifter',
			desc: 'Rewrite any text in a different tone: professional, casual, friendly, formal, humorous, or technical.'
		},
		extensions: {
			title: '🔌 Extensions',
			desc: 'Connect external services (GitHub, Cloudflare, Stripe, Telegram, etc.) so MIRA can control them with natural language commands.'
		},
		quoteforge: {
			title: '💰 QuoteForge',
			desc: 'Generate professional project quotes with AI. Set project type, complexity, and region — get a phase-by-phase breakdown with market pricing.'
		},
		contractgen: {
			title: '📑 ContractGen',
			desc: 'Generate contracts and legal proposals with AI. Choose jurisdiction, payment terms, and tone — get a complete contract ready to sign.'
		},
		invoiceai: {
			title: '🧾 InvoiceAI',
			desc: 'Create professional invoices with AI. Save your tax details, add client and services — invoice ready with automatic tax calculations.'
		},
		mira: {
			title: '🧠 MIRA Assistant',
			desc: 'Your intelligent OS assistant. MIRA can open apps, change settings, search the web, and answer questions. Click the floating button to chat.'
		},
		credits: {
			title: '💎 Credits System',
			desc: 'Each AI action consumes credits. Free plan: 30 credits/month. Local models via Ollama use zero credits. Upgrade to Pro for unlimited.'
		},
		settings: {
			title: '⚙️ Settings',
			desc: 'Configure API keys (Groq, OpenAI, Anthropic, Gemini, Mistral, GitHub Models), change themes, manage your license, and customize your Dock.'
		},
		ready: {
			title: 'You\'re all set!',
			desc: 'Start exploring your AI OS. Open any app from the Desktop or Dock. Remember: Cmd+K for quick access, and MIRA is always there to help.'
		}
	},
	landing: {
		nav: {
			features: 'Features',
			apps: 'Apps',
			faq: 'FAQ',
			openApp: 'Open app →'
		},
		hero: {
			badge: '✦ 100% Free — No registration required',
			social: '✅ Made by MolvicStudios · Built in Spain · Support in Spanish & English',
			title: 'Your AI Operating System',
			sub: '12+ built-in apps for prompt engineering, outreach, SEO, invoicing & automation. Runs in your browser. Privacy-first. 100% free.',
			cta: 'Use now →',
			note: 'No registration · No credit card · Installs as PWA · Works offline'
		},
		features: {
			heading: 'Built Different',
			sub: 'Not another SaaS dashboard. A full AI-native operating system.',
			items: [
				{ icon: '🧠', title: 'AI-Native Desktop', desc: 'Every app is built around AI — not bolted on. Your entire workflow, reimagined.' },
				{ icon: '🔒', title: 'Privacy First', desc: 'Runs in your browser. API keys stay local. No data leaves your machine.' },
				{ icon: '⚡', title: '12+ Built-in Apps', desc: 'From prompt engineering to outreach to invoicing — everything in one OS.' },
				{ icon: '🌍', title: '5 Languages', desc: 'Full i18n support: English, Español, Deutsch, Français, 中文.' },
				{ icon: '🎨', title: 'Themeable', desc: 'Multiple themes — Cyberpunk dark, warm light, and more. All free.' },
				{ icon: '🤖', title: 'MIRA Assistant', desc: 'Built-in AI copilot that understands your OS and helps across all apps.' }
			]
		},
		apps: {
			heading: '12+ Apps. One Desktop.',
			sub: 'Every tool you need — integrated, not scattered.',
			items: [
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
				{ emoji: '🧾', name: 'InvoiceAI', desc: 'Smart invoices with tax-aware formatting' }
			]
		},
		faq: {
			heading: 'FAQ',
			items: [
				{ q: 'Is Molvicos really free?', a: 'Yes, 100% free with no registration required. All features are unlocked. Just open the app and start working.' },
				{ q: 'What happens to my data?', a: "Everything stays in your browser's localStorage. API keys never leave your device. We don't collect or store any of your data." },
				{ q: 'Can I use my own API keys?', a: "Absolutely. Bring your OpenAI, Groq, Anthropic, or Ollama keys. You're always in control." },
				{ q: 'Do I need to create an account?', a: 'No. There is no sign-up, no login, no registration. Just open and use.' },
				{ q: 'Is it a real OS?', a: "It's a Progressive Web App that looks and feels like an OS. Install it on any device — it works offline too." },
				{ q: 'What AI providers are supported?', a: 'Groq, OpenAI, Anthropic, Gemini, Mistral, GitHub Models, and local Ollama models.' }
			]
		},
		cta: {
			title: 'Ready to run your AI desktop?',
			sub: 'All features unlocked. No sign-up needed. Start now.',
			btn: 'Open app →'
		},
		footer: {
			features: 'Features',
			apps: 'Apps',
			privacy: 'Privacy',
			terms: 'Terms',
			cookies: 'Cookies'
		}
	}
};
