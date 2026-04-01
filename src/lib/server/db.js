/**
 * D1 helpers — uses the `users` table as source of truth.
 *
 * plan column: 'free' | 'monthly' | 'annual'
 *   'monthly' and 'annual' both mean Pro tier.
 *
 * All functions accept the D1 binding (platform.env.DB) as first arg
 * and return null gracefully if DB is unavailable (local dev without D1).
 */

/** @typedef {{ id:string, clerk_id:string, email:string, plan:string, status:string,
 *              ls_customer_id:string|null, ls_subscription_id:string|null,
 *              ls_variant_id:string|null, current_period_ends_at:string|null }} DBUser */

/** Returns true if the given plan value means Pro access. */
export function isPlanPro(plan) {
	return plan === 'monthly' || plan === 'annual';
}

/** Map our internal billingPeriod ('monthly'|'yearly') to the DB plan column. */
function billingPeriodToPlan(billingPeriod) {
	return billingPeriod === 'yearly' || billingPeriod === 'annual' ? 'annual' : 'monthly';
}

/** @param {D1Database} db @param {string} clerkId @returns {Promise<DBUser|null>} */
export async function getUserByClerkId(db, clerkId) {
	if (!db) return null;
	return db.prepare('SELECT * FROM users WHERE clerk_id = ?').bind(clerkId).first();
}

/** @param {D1Database} db @param {string} email @returns {Promise<DBUser|null>} */
export async function getUserByEmail(db, email) {
	if (!db) return null;
	return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
}

/**
 * Insert or update a user row and activate Pro.
 *
 * @param {D1Database} db
 * @param {{ clerkId: string, email: string, billingPeriod?: string,
 *           lsCustomerId?: string, lsSubscriptionId?: string,
 *           lsVariantId?: string, currentPeriodEndsAt?: string }} data
 */
export async function activateUserPro(db, data) {
	if (!db) return;
	const {
		clerkId,
		email,
		billingPeriod      = 'monthly',
		lsCustomerId       = null,
		lsSubscriptionId   = null,
		lsVariantId        = null,
		currentPeriodEndsAt = null,
	} = data;

	const plan = billingPeriodToPlan(billingPeriod);
	const id   = crypto.randomUUID();

	await db.prepare(`
		INSERT INTO users
			(id, clerk_id, email, plan, status, ls_customer_id, ls_subscription_id, ls_variant_id, current_period_ends_at, updated_at)
		VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, datetime('now'))
		ON CONFLICT (clerk_id) DO UPDATE SET
			email                  = excluded.email,
			plan                   = excluded.plan,
			status                 = 'active',
			ls_customer_id         = excluded.ls_customer_id,
			ls_subscription_id     = excluded.ls_subscription_id,
			ls_variant_id          = excluded.ls_variant_id,
			current_period_ends_at = excluded.current_period_ends_at,
			updated_at             = datetime('now')
	`).bind(id, clerkId, email, plan, lsCustomerId, lsSubscriptionId, lsVariantId, currentPeriodEndsAt).run();
}

/**
 * Set user status to cancelled / plan to free.
 * Accepts either clerkId or email (webhook may not have clerkId).
 *
 * @param {D1Database} db
 * @param {{ clerkId?: string, email?: string }} identifiers
 */
export async function deactivateUser(db, { clerkId, email }) {
	if (!db) return;
	if (clerkId) {
		await db.prepare(`
			UPDATE users
			SET plan = 'free', status = 'cancelled', updated_at = datetime('now')
			WHERE clerk_id = ?
		`).bind(clerkId).run();
	} else if (email) {
		await db.prepare(`
			UPDATE users
			SET plan = 'free', status = 'cancelled', updated_at = datetime('now')
			WHERE email = ?
		`).bind(email).run();
	}
}

/**
 * Log a raw LemonSqueezy event for audit trail.
 *
 * @param {D1Database} db
 * @param {{ email?: string, eventType: string, lsEventId?: string, payload: object }} data
 */
export async function logSubscriptionEvent(db, data) {
	if (!db) return;
	const { email = null, eventType, lsEventId = null, payload } = data;
	await db.prepare(`
		INSERT INTO subscription_events (user_email, event_type, ls_event_id, payload)
		VALUES (?, ?, ?, ?)
	`).bind(email, eventType, lsEventId, JSON.stringify(payload)).run();
}
