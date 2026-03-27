import PromptLab from '../components/apps/PromptLab.svelte';
import Prospectly from '../components/apps/Prospectly.svelte';
import AIWorkSuite from '../components/apps/AIWorkSuite.svelte';
import Repurposer from '../components/apps/Repurposer.svelte';
import BriefGen from '../components/apps/BriefGen.svelte';
import WorkflowBuilder from '../components/apps/WorkflowBuilder.svelte';
import LocalModels from '../components/apps/LocalModels.svelte';
import AITerminal from '../components/apps/AITerminal.svelte';
import AppStore from '../components/apps/AppStore.svelte';
import Dashboard from '../components/apps/Dashboard.svelte';
import Settings from '../components/apps/Settings.svelte';

export const APPS = [
	{
		id: 'promptlab',
		component: PromptLab,
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
		component: Prospectly,
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
		component: AIWorkSuite,
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
		component: Repurposer,
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
		component: BriefGen,
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
		component: WorkflowBuilder,
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
		component: LocalModels,
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
		component: AITerminal,
		emoji: '💻',
		colorClass: 'icon-red',
		dockSlot: null,
		defaultSize: { w: 680, h: 480 },
		credits: 1,
		section: 'power',
		status: 'active'
	},
	{
		id: 'appstore',
		component: AppStore,
		emoji: '🌐',
		colorClass: 'icon-gray',
		dockSlot: null,
		defaultSize: { w: 760, h: 560 },
		credits: 0,
		section: 'power',
		status: 'coming-soon'
	},
	{
		id: 'dashboard',
		component: Dashboard,
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
		component: Settings,
		emoji: '⚙️',
		colorClass: 'icon-gray',
		dockSlot: null,
		defaultSize: { w: 680, h: 520 },
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
