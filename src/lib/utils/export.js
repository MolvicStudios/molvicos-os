export function exportTXT(content, filename = 'molvicos-export.txt') {
	const blob = new Blob([content], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function exportPDF(content, title = 'Molvicos Export') {
	const win = window.open('', '_blank');
	if (!win) return;
	win.document.write(`<!DOCTYPE html><html><head><title>${title.replace(/</g, '&lt;')}</title>
<style>body{font-family:monospace;font-size:13px;padding:40px;color:#111;line-height:1.7;max-width:800px;margin:0 auto}
h1{font-size:20px;border-bottom:2px solid #000;padding-bottom:8px}pre{white-space:pre-wrap;word-break:break-word}</style>
</head><body><h1>${title.replace(/</g, '&lt;')}</h1><pre>${content.replace(/</g, '&lt;')}</pre>
<script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
	win.document.close();
}

export function generateShareLink(appId, data) {
	const text = JSON.stringify({ appId, data, ts: Date.now() });
	const bytes = new TextEncoder().encode(text);
	const obfuscated = new Uint8Array(bytes.length);
	for (let i = 0; i < bytes.length; i++) obfuscated[i] = bytes[i] ^ 42;
	const payload = btoa(String.fromCharCode(...obfuscated));
	return `${window.location.origin}/share?d=${encodeURIComponent(payload)}&s=${encodeURIComponent(appId)}`;
}

export function copyToClipboard(text) {
	return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}
