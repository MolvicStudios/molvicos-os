export async function scanHardware() {
	const cores = navigator.hardwareConcurrency || 2;
	const memory = navigator.deviceMemory || 4;

	let gpu = 'Unknown';
	try {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		if (gl) {
			const ext = gl.getExtension('WEBGL_debug_renderer_info');
			if (ext) gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
		}
	} catch {
		// GPU detection not available
	}

	const start = performance.now();
	let n = 0;
	for (let i = 0; i < 5_000_000; i++) n += Math.sqrt(i);
	const benchMs = Math.round(performance.now() - start);

	let profile;
	if (memory >= 32 && cores >= 8 && benchMs < 200) profile = 'high';
	else if (memory >= 16 && cores >= 4 && benchMs < 500) profile = 'mid';
	else profile = 'low';

	return { cores, memory, gpu, benchMs, profile, n };
}

export const MODEL_RECOMMENDATIONS = {
	high: [
		{
			name: 'llama3.3:70b',
			size: '43GB',
			speed: '⚡⚡⚡',
			quality: '★★★★★',
			desc: 'Best quality, needs 64GB RAM'
		},
		{
			name: 'qwen2.5:32b',
			size: '20GB',
			speed: '⚡⚡⚡',
			quality: '★★★★☆',
			desc: 'Excellent multilingual'
		},
		{
			name: 'deepseek-r1:14b',
			size: '9GB',
			speed: '⚡⚡⚡⚡',
			quality: '★★★★☆',
			desc: 'Great for reasoning'
		}
	],
	mid: [
		{
			name: 'llama3.2:8b',
			size: '5GB',
			speed: '⚡⚡⚡⚡',
			quality: '★★★★☆',
			desc: 'Best balance for 16GB'
		},
		{
			name: 'mistral:7b',
			size: '4GB',
			speed: '⚡⚡⚡⚡',
			quality: '★★★☆☆',
			desc: 'Fast and capable'
		},
		{
			name: 'qwen2.5:7b',
			size: '4.7GB',
			speed: '⚡⚡⚡⚡',
			quality: '★★★★☆',
			desc: 'Strong multilingual'
		}
	],
	low: [
		{
			name: 'llama3.2:3b',
			size: '2GB',
			speed: '⚡⚡⚡⚡⚡',
			quality: '★★★☆☆',
			desc: 'Lightweight, runs on 8GB'
		},
		{
			name: 'phi3.5:mini',
			size: '2.2GB',
			speed: '⚡⚡⚡⚡⚡',
			quality: '★★★☆☆',
			desc: 'Microsoft, very efficient'
		},
		{
			name: 'gemma2:2b',
			size: '1.6GB',
			speed: '⚡⚡⚡⚡⚡',
			quality: '★★★☆☆',
			desc: 'Google, runs anywhere'
		}
	]
};
