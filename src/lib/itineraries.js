export const ITINERARIES = [
	{
		id: 'freelance-launch',
		icon: '🚀',
		difficulty: 'beginner',
		estimatedMinutes: 15,
		steps: [
			{ appId: 'brandname' },
			{ appId: 'quoteforge' },
			{ appId: 'contractgen' },
			{ appId: 'invoiceai' },
		],
	},
	{
		id: 'outreach-campaign',
		icon: '📧',
		difficulty: 'beginner',
		estimatedMinutes: 10,
		steps: [
			{ appId: 'prospectly' },
			{ appId: 'mailcraft' },
			{ appId: 'toneshifter' },
		],
	},
	{
		id: 'content-multiplatform',
		icon: '✍️',
		difficulty: 'beginner',
		estimatedMinutes: 10,
		steps: [
			{ appId: 'promptlab' },
			{ appId: 'repurposer' },
			{ appId: 'summarizer' },
		],
	},
	{
		id: 'business-strategy',
		icon: '📊',
		difficulty: 'intermediate',
		estimatedMinutes: 20,
		steps: [
			{ appId: 'dafo' },
			{ appId: 'briefgen' },
			{ appId: 'workflow' },
		],
	},
	{
		id: 'local-ai-setup',
		icon: '🤖',
		difficulty: 'intermediate',
		estimatedMinutes: 15,
		steps: [
			{ appId: 'settings' },
			{ appId: 'localmodels' },
			{ appId: 'terminal' },
		],
	},
	{
		id: 'first-automation',
		icon: '⚙️',
		difficulty: 'intermediate',
		estimatedMinutes: 12,
		steps: [
			{ appId: 'promptlab' },
			{ appId: 'workflow' },
			{ appId: 'extensions' },
		],
	},
	{
		id: 'first-ai-team',
		icon: '💼',
		difficulty: 'beginner',
		estimatedMinutes: 10,
		steps: [
			{ appId: 'aiworksuite' },
			{ appId: 'mailcraft' },
			{ appId: 'contractgen' },
		],
	},
];

const STORAGE_KEY = 'ms_itinerary_progress';

export function getProgress() {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
	} catch {
		return {};
	}
}

export function markStepDone(itineraryId, stepIndex) {
	const progress = getProgress();
	if (!progress[itineraryId]) progress[itineraryId] = [];
	if (!progress[itineraryId].includes(stepIndex)) {
		progress[itineraryId].push(stepIndex);
	}
	localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
	return progress;
}

export function resetProgress(itineraryId) {
	const progress = getProgress();
	delete progress[itineraryId];
	localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
	return progress;
}
