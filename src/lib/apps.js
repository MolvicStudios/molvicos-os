const lazy = (loader) => loader;

export const APPS = [
	{
		id: 'promptlab',
		loader: lazy(() => import('../components/apps/PromptLab.svelte')),
		emoji: '🔧',
		colorClass: 'icon-purple',
		dockSlot: 1,
		defaultSize: { w: 700, h: 500 },
		credits: 2,
		section: 'core',
		status: 'active'
	},
	{
		id: 'prospectly',
		loader: lazy(() => import('../components/apps/Prospectly.svelte')),
		emoji: '🎯',
		colorClass: 'icon-cyan',
		dockSlot: 2,
		defaultSize: { w: 900, h: 640 },
		credits: 2,
		section: 'core',
		status: 'active'
	},
	{
		id: 'aiworksuite',
		loader: lazy(() => import('../components/apps/AIWorkSuite.svelte')),
		emoji: '💼',
		colorClass: 'icon-green',
		dockSlot: 3,
		defaultSize: { w: 900, h: 640 },
		credits: 1,
		section: 'core',
		status: 'active'
	},
	{
		id: 'repurposer',
		loader: lazy(() => import('../components/apps/Repurposer.svelte')),
		emoji: '📝',
		colorClass: 'icon-amber',
		dockSlot: 4,
		defaultSize: { w: 680, h: 520 },
		credits: 3,
		section: 'core',
		status: 'active'
	},
	{
		id: 'briefgen',
		loader: lazy(() => import('../components/apps/BriefGen.svelte')),
		emoji: '🔍',
		colorClass: 'icon-pink',
		dockSlot: 5,
		defaultSize: { w: 720, h: 560 },
		credits: 3,
		section: 'core',
		status: 'active'
	},
	{
		id: 'workflow',
		loader: lazy(() => import('../components/apps/WorkflowBuilder.svelte')),
		emoji: '⚙️',
		colorClass: 'icon-teal',
		dockSlot: null,
		defaultSize: { w: 800, h: 600 },
		credits: 5,
		section: 'power',
		status: 'active'
	},
	{
		id: 'localmodels',
		loader: lazy(() => import('../components/apps/LocalModels.svelte')),
		emoji: '🤖',
		colorClass: 'icon-blue',
		dockSlot: null,
		defaultSize: { w: 660, h: 500 },
		credits: 0,
		section: 'power',
		status: 'active'
	},
	{
		id: 'terminal',
		loader: lazy(() => import('../components/apps/AITerminal.svelte')),
		emoji: '💻',
		colorClass: 'icon-red',
		dockSlot: null,
		defaultSize: { w: 680, h: 480 },
		credits: 1,
		section: 'power',
		status: 'active'
	},
	{
		id: 'dashboard',
		loader: lazy(() => import('../components/apps/Dashboard.svelte')),
		emoji: '📊',
		colorClass: 'icon-gold',
		dockSlot: null,
		defaultSize: { w: 560, h: 480 },
		credits: 0,
		section: 'power',
		status: 'active'
	},
	{
		id: 'settings',
		loader: lazy(() => import('../components/apps/Settings.svelte')),
		emoji: '⚙️',
		colorClass: 'icon-gray',
		dockSlot: null,
		defaultSize: { w: 680, h: 520 },
		credits: 0,
		section: 'power',
		status: 'active'
	},
	{
		id: 'mailcraft',
		loader: lazy(() => import('../components/apps/MailCraft.svelte')),
		emoji: '✉️',
		colorClass: 'icon-cyan',
		dockSlot: null,
		defaultSize: { w: 760, h: 520 },
		credits: 2,
		section: 'tools',
		status: 'active'
	},
	{
		id: 'dafo',
		loader: lazy(() => import('../components/apps/DAFOAnalysis.svelte')),
		emoji: '📋',
		colorClass: 'icon-amber',
		dockSlot: null,
		defaultSize: { w: 720, h: 560 },
		credits: 2,
		section: 'tools',
		status: 'active'
	},
	{
		id: 'brandname',
		loader: lazy(() => import('../components/apps/BrandName.svelte')),
		emoji: '💡',
		colorClass: 'icon-purple',
		dockSlot: null,
		defaultSize: { w: 700, h: 520 },
		credits: 2,
		section: 'tools',
		status: 'active'
	},
	{
		id: 'summarizer',
		loader: lazy(() => import('../components/apps/Summarizer.svelte')),
		emoji: '📄',
		colorClass: 'icon-teal',
		dockSlot: null,
		defaultSize: { w: 740, h: 520 },
		credits: 1,
		section: 'tools',
		status: 'active'
	},
	{
		id: 'toneshifter',
		loader: lazy(() => import('../components/apps/ToneShifter.svelte')),
		emoji: '🔄',
		colorClass: 'icon-pink',
		dockSlot: null,
		defaultSize: { w: 760, h: 520 },
		credits: 2,
		section: 'tools',
		status: 'active'
	},
	{
		id: 'analytics',
		loader: lazy(() => import('../components/apps/Analytics.svelte')),
		emoji: '📈',
		colorClass: 'icon-green',
		dockSlot: null,
		defaultSize: { w: 800, h: 600 },
		credits: 0,
		section: 'power',
		status: 'active'
	},
	{
		id: 'appstore',
		loader: lazy(() => import('../components/apps/AppStore.svelte')),
		emoji: '🏪',
		colorClass: 'icon-blue',
		dockSlot: null,
		defaultSize: { w: 700, h: 560 },
		credits: 0,
		section: 'power',
		status: 'active'
	},
	{
		id: 'extensions',
		loader: lazy(() => import('../components/apps/Extensions.svelte')),
		emoji: '🔌',
		colorClass: 'icon-teal',
		dockSlot: null,
		defaultSize: { w: 820, h: 560 },
		credits: 0,
		section: 'power',
		status: 'active'
	}
];

export const getApp = (id) => APPS.find((a) => a.id === id);
export const getDockApps = () =>
	APPS.filter((a) => a.dockSlot !== null).sort((a, b) => a.dockSlot - b.dockSlot);
export const getCoreApps = () => APPS.filter((a) => a.section === 'core');
export const getPowerApps = () => APPS.filter((a) => a.section === 'power');
export const getToolsApps = () => APPS.filter((a) => a.section === 'tools');
