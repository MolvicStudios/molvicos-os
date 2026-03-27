const OLLAMA_BASE = 'http://localhost:11434';

export async function detectOllama() {
	try {
		const r = await fetch(`${OLLAMA_BASE}/api/tags`, {
			signal: AbortSignal.timeout(2000)
		});
		if (r.ok) {
			const data = await r.json();
			return { online: true, models: data.models || [] };
		}
	} catch {
		// Ollama not reachable
	}
	return { online: false, models: [] };
}

export async function listModels() {
	try {
		const r = await fetch(`${OLLAMA_BASE}/api/tags`);
		if (r.ok) {
			const data = await r.json();
			return data.models || [];
		}
	} catch {
		// ignore
	}
	return [];
}

export async function pullModel(modelName, onProgress) {
	try {
		const r = await fetch(`${OLLAMA_BASE}/api/pull`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: modelName, stream: true })
		});

		const reader = r.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (!line.trim()) continue;
				try {
					const data = JSON.parse(line);
					if (onProgress) onProgress(data);
				} catch {
					// skip malformed lines
				}
			}
		}

		return { success: true };
	} catch (e) {
		return { success: false, error: e.message };
	}
}

export async function generate(model, prompt, options = {}) {
	try {
		const r = await fetch(`${OLLAMA_BASE}/api/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ model, prompt, stream: false, ...options })
		});
		if (r.ok) {
			return await r.json();
		}
	} catch {
		// ignore
	}
	return null;
}
