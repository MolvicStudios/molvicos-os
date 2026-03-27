export const LS_CONFIG = {
	storeId:        '322391',
	productId:      '926061',
	monthlyVariant: '1456001',
	yearlyVariant:  '1456019',
	storeDomain:    'molvicstudios.lemonsqueezy.com',
};

export function buildCheckoutUrl(variant, userEmail = '', userId = '') {
	const params = new URLSearchParams();
	if (userEmail) params.set('checkout[email]', userEmail);
	if (userId)    params.set('checkout[custom][user_id]', userId);
	params.set('checkout[custom][product]', 'molvicos');

	return `https://${LS_CONFIG.storeDomain}/checkout/buy/${variant}?${params.toString()}`;
}

export async function validateLicense(licenseKey) {
	try {
		const res = await fetch('/api/license', {
			method:  'POST',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify({ licenseKey }),
		});
		const data = await res.json();
		return { valid: data.valid, plan: data.plan, billingPeriod: data.billingPeriod };
	} catch {
		return { valid: false };
	}
}
