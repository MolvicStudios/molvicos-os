export const PROVIDERS = {
	groq: {
		id: 'groq',
		name: 'Groq',
		logo: '⚡',
		desc: 'Ultra-fast inference. 30 req/min free.',
		keyPrefix: 'gsk_',
		docsUrl: 'https://console.groq.com',
		tier: 'free',
		recommended: true
	},
	gemini: {
		id: 'gemini',
		name: 'Gemini',
		logo: '✦',
		desc: 'Google AI. 1M tokens/month free.',
		keyPrefix: 'AIza',
		docsUrl: 'https://aistudio.google.com',
		tier: 'free'
	},
	mistral: {
		id: 'mistral',
		name: 'Mistral',
		logo: '◈',
		desc: 'European AI. Free tier available.',
		keyPrefix: 'mis_',
		docsUrl: 'https://console.mistral.ai',
		tier: 'free'
	},
	openai: {
		id: 'openai',
		name: 'OpenAI',
		logo: '○',
		desc: 'GPT-4o, o1. Pay per token.',
		keyPrefix: 'sk-',
		docsUrl: 'https://platform.openai.com',
		tier: 'paid'
	},
	anthropic: {
		id: 'anthropic',
		name: 'Anthropic',
		logo: '△',
		desc: 'Claude 3.5+. Pay per token.',
		keyPrefix: 'sk-ant-',
		docsUrl: 'https://console.anthropic.com',
		tier: 'paid'
	}
};

export const getFreeProviders = () => Object.values(PROVIDERS).filter((p) => p.tier === 'free');
export const getPaidProviders = () => Object.values(PROVIDERS).filter((p) => p.tier === 'paid');

export async function validateKey(provider, key) {
	try {
		const r = await fetch(
			`/api/validate-key?provider=${encodeURIComponent(provider)}&key=${encodeURIComponent(key)}`
		);
		if (r.ok) {
			const data = await r.json();
			return data.valid;
		}
	} catch {
		// ignore
	}
	return false;
}
