export async function processWebhookEvent(event) {
	const type = event.meta?.event_name;
	const data = event.data?.attributes;

	switch (type) {
		case 'order_created':
		case 'subscription_created': {
			const licenseKey    = data?.first_order_item?.license_key || data?.license_key || '';
			const userEmail     = data?.user_email || '';
			const variantId     = String(data?.variant_id || data?.first_order_item?.variant_id || '');
			const billingPeriod = variantId === '1451168' ? 'yearly' : 'monthly';

			console.log(`[Webhook] Pro activated: ${userEmail} — ${billingPeriod}`);
			break;
		}

		case 'subscription_cancelled':
		case 'subscription_expired': {
			console.log(`[Webhook] Subscription cancelled: ${data?.user_email}`);
			break;
		}
	}
}
