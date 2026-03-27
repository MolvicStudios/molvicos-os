import { writable, get } from 'svelte/store';
import en from './en.js';
import es from './es.js';
import de from './de.js';
import fr from './fr.js';
import zh from './zh.js';

const LANGS = { en, es, de, fr, zh };

export const currentLang = writable('en');

export function setLang(code) {
	if (LANGS[code]) {
		currentLang.set(code);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('ms_lang', code);
		}
		if (typeof document !== 'undefined') {
			document.documentElement.lang = code;
		}
	}
}

export function t(key) {
	const lang = get(currentLang);
	const dict = LANGS[lang] || LANGS.en;
	return key.split('.').reduce((o, k) => o?.[k], dict) ?? key;
}

export function detectLang() {
	if (typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem('ms_lang');
		if (saved && LANGS[saved]) return setLang(saved);
	}
	if (typeof navigator !== 'undefined') {
		const browser = navigator.language?.slice(0, 2);
		if (LANGS[browser]) return setLang(browser);
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
