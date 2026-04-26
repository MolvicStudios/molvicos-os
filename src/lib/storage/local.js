const SCHEMA = {
	version: 1,
	keys: {
		MS_LANG: 'ms_lang',
		MS_THEME: 'ms_theme',
		MS_ONBOARDING: 'ms_onboarding_complete',
		MS_API_KEYS: 'ms_api_keys',
		MS_USER_PROFILE: 'ms_user_profile',
		MS_ICON_POSITIONS: 'ms_icon_positions',
		MS_PROMPT_LIBRARY: 'ms_prompt_library',
		MS_CREDITS: 'ms_credits',
		MS_HARDWARE: 'ms_hardware_profile'
	}
};

export const storage = {
	get: (key) => {
		try {
			return JSON.parse(localStorage.getItem(key));
		} catch {
			return null;
		}
	},
	set: (key, value) => {
		try {
			localStorage.setItem(key, JSON.stringify(value));
			return true;
		} catch {
			return false;
		}
	},
	remove: (key) => localStorage.removeItem(key),
	clear: () => localStorage.clear(),

	getLang: () => storage.get(SCHEMA.keys.MS_LANG) || 'en',
	getTheme: () => storage.get(SCHEMA.keys.MS_THEME) || 'noir',
	setTheme: (theme) => storage.set(SCHEMA.keys.MS_THEME, theme),
	isOnboardingComplete: () => !!storage.get(SCHEMA.keys.MS_ONBOARDING),
	setOnboardingComplete: (v) => storage.set(SCHEMA.keys.MS_ONBOARDING, v),
	getApiKeys: () => storage.get(SCHEMA.keys.MS_API_KEYS) || {},
	setApiKeys: (keys) => storage.set(SCHEMA.keys.MS_API_KEYS, keys),
	getHardware: () => storage.get(SCHEMA.keys.MS_HARDWARE),
	setHardware: (profile) => storage.set(SCHEMA.keys.MS_HARDWARE, profile),
	getIconPositions: () => storage.get(SCHEMA.keys.MS_ICON_POSITIONS) || {},
	setIconPositions: (pos) => storage.set(SCHEMA.keys.MS_ICON_POSITIONS, pos),
	getUserProfile: () => storage.get(SCHEMA.keys.MS_USER_PROFILE),
	setUserProfile: (p) => storage.set(SCHEMA.keys.MS_USER_PROFILE, p)
};

/** Safe localStorage getter with try/catch */
export function safeGet(key) {
	try {
		const val = localStorage.getItem(key);
		return val;
	} catch {
		return null;
	}
}

/** Safe localStorage setter with try/catch */
export function safeSet(key, value) {
	try {
		localStorage.setItem(key, value);
		return true;
	} catch {
		return false;
	}
}

export { SCHEMA };
