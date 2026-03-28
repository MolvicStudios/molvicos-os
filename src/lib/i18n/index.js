import { writable, derived, get } from 'svelte/store';
import en from './en.js';

const LANGS = { en };
const LOADERS = {
	es: () => import('./es.js'),
	de: () => import('./de.js'),
	fr: () => import('./fr.js'),
	zh: () => import('./zh.js'),
};
const VALID = new Set(['en', ...Object.keys(LOADERS)]);

export const currentLang = writable('en');

export async function setLang(code) {
	if (!VALID.has(code)) return;
	if (!LANGS[code] && LOADERS[code]) {
		const mod = await LOADERS[code]();
		LANGS[code] = mod.default;
	}
	currentLang.set(code);
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('ms_lang', code);
	}
	if (typeof document !== 'undefined') {
		document.documentElement.lang = code;
	}
}

/** Reactive translation store — use as $t('key') in .svelte files */
export const t = derived(currentLang, ($lang) => {
	return (key) => {
		const dict = LANGS[$lang] || LANGS.en;
		return key.split('.').reduce((o, k) => o?.[k], dict) ?? key;
	};
});

/** Non-reactive translation for use in plain .js files */
export function tGet(key) {
	const lang = get(currentLang);
	const dict = LANGS[lang] || LANGS.en;
	return key.split('.').reduce((o, k) => o?.[k], dict) ?? key;
}

export function detectLang() {
	if (typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem('ms_lang');
		if (saved && VALID.has(saved)) return setLang(saved);
	}
	if (typeof navigator !== 'undefined') {
		const browser = navigator.language?.slice(0, 2);
		if (VALID.has(browser)) return setLang(browser);
	}
	setLang('en');
}

export const SUPPORTED_LANGS = [
	{ code: 'en', flag: '🇬🇧', name: 'English', native: 'English' },
	{ code: 'es', flag: '🇪🇸', name: 'Spanish', native: 'Español' },
	{ code: 'de', flag: '🇩🇪', name: 'German', native: 'Deutsch' },
	{ code: 'fr', flag: '🇫🇷', name: 'French', native: 'Français' },
	{ code: 'zh', flag: '🇨🇳', name: 'Chinese', native: '中文' }
];
