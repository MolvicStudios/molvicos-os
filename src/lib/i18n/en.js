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
		prospectly: { name: 'Prospectly', desc: 'B2B AI Outreach' },
		aiworksuite: { name: 'AIWorkSuite', desc: 'Freelance Productivity', teams: 'AI Teams', invoice: 'Invoice', proposal: 'Proposal', contract: 'Contract', time: 'Time', rate: 'Rate', teamName: 'Team Name', teamProject: 'Project Context', teamProjectPh: 'Describe the project this team will work on...', createAITeam: 'Create AI Team', detectingRoles: 'Detecting roles...', openChat: 'Open Team Chat', messageTeam: 'Message the team...', agentsThinking: 'Agents are thinking...', teamsEmpty: 'Create your first AI team to get started.', clientName: 'Client Name', services: 'Services Rendered', totalAmount: 'Total Amount', dueDate: 'Due Date', generate: 'Generate', projectDesc: 'Project Description', budget: 'Budget Range', timeline: 'Timeline', projectScope: 'Project / Scope', ratePayment: 'Rate / Payment', scopeNotes: 'Scope Notes', annualIncome: 'Desired Annual Income', billableWeeks: 'Billable Weeks/Year', billableHours: 'Billable Hours/Week', overheadPct: 'Overhead % (taxes, tools...)', calculateRate: 'Calculate Rate', copy: 'Copy' },
		repurposer: { name: 'Repurposer', desc: 'Content × 6 formats', inputLabel: 'Source content', inputPlaceholder: 'Paste the content you want to repurpose...', wordCount: '{n} words', selectAll: 'Select all', selectNone: 'Select none', outputLang: 'Output language', repurposeBtn: 'Repurpose' },
		briefgen: { name: 'Brief Gen', desc: 'SEO Briefs AI', keyword: 'Primary keyword', secondaryKw: 'Secondary keywords', contentType: 'Content type', audience: 'Target audience', competitors: 'Competitor URLs', language: 'Language', wordTarget: 'Word target', generateBtn: 'Generate Brief' },
		workflow: { name: 'Automations', desc: 'n8n · Make · Scripts', descLabel: 'Description', descPlaceholder: 'Describe what you want to automate...', triggerType: 'Trigger type', complexity: 'Complexity', errorHandling: 'Include error handling', generateBtn: 'Generate', primaryModule: 'Primary module', resourceType: 'Resource type', level: 'Level', levelBasic: 'Basic', levelAdvanced: 'Advanced' },
		localmodels: { name: 'Local Models', desc: 'Ollama Bridge' },
		terminal: { name: 'AI Terminal', desc: 'Conversational CLI' },
		appstore: { name: 'App Store', desc: 'Marketplace' },
		mailcraft: { name: 'MailCraft', desc: 'AI Email Writer', input: 'Recipient & context' },
		dafo: { name: 'DAFO Analysis', desc: 'SWOT Strategy AI' },
		brandname: { name: 'Brand Name', desc: 'Name Generator AI' },
		summarizer: { name: 'Summarizer', desc: 'Text Summarizer AI' },
		toneshifter: { name: 'ToneShifter', desc: 'Tone Translator AI', input: 'Original text' },
		analytics: { name: 'Analytics', desc: 'Site Analytics', connectDesc: 'Connect to your MolvicStudios Analytics Worker' },
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
			help: 'How can I help?'
		}
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
		favoriteApp: 'Favorite app'
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
		openTutorial: 'Open Tutorial'
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
			desc: 'Configure API keys (Groq, OpenAI, Anthropic, Gemini, Mistral), change themes, manage your license, and connect n8n automation.'
		},
		ready: {
			title: 'You\'re all set!',
			desc: 'Start exploring your AI OS. Open any app from the Desktop or Dock. Remember: Cmd+K for quick access, and MIRA is always there to help.'
		}
	}
};
