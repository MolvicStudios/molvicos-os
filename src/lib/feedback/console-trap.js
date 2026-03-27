const ERROR_LOG = [];
const MAX_ERRORS = 10;

export function initConsoleTrap() {
	if (typeof window === 'undefined') return;

	const originalError = console.error.bind(console);
	const originalWarn  = console.warn.bind(console);

	console.error = (...args) => {
		pushError('error', args);
		originalError(...args);
	};

	console.warn = (...args) => {
		pushError('warn', args);
		originalWarn(...args);
	};

	window.addEventListener('unhandledrejection', (e) => {
		pushError('unhandled', [e.reason?.message || String(e.reason)]);
	});

	window.addEventListener('error', (e) => {
		pushError('error', [`${e.message} (${e.filename}:${e.lineno})`]);
	});
}

function pushError(level, args) {
	const entry = {
		level,
		message: args.map(a => {
			if (typeof a === 'string') return a;
			try { return JSON.stringify(a); } catch { return String(a); }
		}).join(' ').slice(0, 300),
		ts: Date.now(),
	};
	ERROR_LOG.unshift(entry);
	if (ERROR_LOG.length > MAX_ERRORS) ERROR_LOG.pop();
}

export function getErrorLog() {
	return [...ERROR_LOG];
}

export function formatErrorLog() {
	if (ERROR_LOG.length === 0) return 'No console errors recorded.';
	return ERROR_LOG
		.map((e, i) => `${i + 1}. [${e.level.toUpperCase()}] ${new Date(e.ts).toLocaleTimeString()} — ${e.message}`)
		.join('\n');
}

export function clearErrorLog() {
	ERROR_LOG.length = 0;
}
