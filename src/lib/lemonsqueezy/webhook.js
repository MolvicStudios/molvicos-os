import { activateUserPro, deactivateUser, logSubscriptionEvent } from '$lib/server/db.js';

const YEARLY_VARIANT = '1456019';

/**
 * Process a LemonSqueezy webhook event and persist to D1.
 *
 * @param {object} event  — parsed LemonSqueezy webhook payload
 * @param {D1Database|null} db — platform.env.DB
 */
export async function processWebhookEvent(event, db) {
	const type    = event.meta?.event_name;
	const data    = event.data?.attributes;
	const eventId = event.data?.id || null;

	// Log every event for audit trail
	await logSubscriptionEvent(db, {
		email:     data?.user_email || null,
		eventType: type,
		lsEventId: eventId,
		payload:   event,
	});

	switch (type) {
		case 'order_created':
		case 'subscription_created': {
			const userEmail        = data?.user_email || '';
			const variantId        = String(data?.variant_id || data?.first_order_item?.variant_id || '');
			const billingPeriod    = variantId === YEARLY_VARIANT ? 'yearly' : 'monthly';
			const lsCustomerId     = String(data?.customer_id || '');
			const lsSubscriptionId = String(data?.id || '');

			// Clerk userId injected at checkout via checkout[custom][user_id]
			const clerkId = event.meta?.custom_data?.user_id || '';

			if (!clerkId) {
				console.warn(`[Webhook] No Clerk userId in custom_data for email=${userEmail} — activation pending license entry`);
				break;
			}
			if (!userEmail) {
				console.error('[Webhook] Missing user_email in payload');
				break;
			}

			await activateUserPro(db, {
				clerkId,
				email:           userEmail,
				billingPeriod,
				lsCustomerId:    lsCustomerId  || null,
				lsSubscriptionId: lsSubscriptionId || null,
				lsVariantId:     variantId     || null,
			});

			console.log(`[Webhook] Pro activated: ${userEmail} (${billingPeriod})`);
			break;
		}

		case 'subscription_renewed': {
			const userEmail = data?.user_email || '';
			const clerkId   = event.meta?.custom_data?.user_id || '';
			const endsAt    = data?.renewed_at || null;
			const variantId = String(data?.variant_id || '');
			const billingPeriod = variantId === YEARLY_VARIANT ? 'yearly' : 'monthly';

			if (clerkId) {
				await activateUserPro(db, {
					clerkId,
					email:              userEmail,
					billingPeriod,
					lsVariantId:        variantId || null,
					currentPeriodEndsAt: endsAt,
				});
			}
			console.log(`[Webhook] Subscription renewed: ${userEmail}`);
			break;
		}

		case 'subscription_cancelled':
		case 'subscription_expired': {
			const userEmail = data?.user_email || '';
			const clerkId   = event.meta?.custom_data?.user_id || '';

			await deactivateUser(db, { clerkId: clerkId || undefined, email: userEmail || undefined });
			console.log(`[Webhook] Subscription deactivated: ${userEmail}`);
			break;
		}

		default:
			console.log(`[Webhook] Unhandled event: ${type}`);
	}
}
