/**
 * Plans — app is now 100% free. All features unlocked.
 */
export const PLANS = {
	free: {
		id:              'free',
		name:            'Free',
		price:           0,
		creditsPerMonth: null,
		betaUnlimited:   true,
		workspaces:      999,
		promptLibMax:    null,
		themes:          ['noir', 'icaro', 'synthwave', 'ocean', 'matrix'],
		miraFull:        true,
		mobileApp:       true,
		earlyAccess:     true,
	},
	pro: {
		id:              'pro',
		name:            'Pro',
		priceMonthly:    0,
		priceYearly:     0,
		creditsPerMonth: null,
		betaUnlimited:   true,
		workspaces:      999,
		promptLibMax:    null,
		themes:          ['noir', 'icaro', 'synthwave', 'ocean', 'matrix'],
		miraFull:        true,
		mobileApp:       true,
		earlyAccess:     true,
	},
};

/** All credit costs are 0 — no restrictions */
export const CREDIT_COSTS = {
	prompt_optimizer:  0,
	repurposer:        0,
	brief_gen:         0,
	workflow_builder:  0,
	mira_message:      0,
	ollama:            0,
	prospectly:        0,
	aiworksuite:       0,
	quoteforge:        0,
	contractgen:       0,
	invoiceai:         0,
};

export function getPlan(planId) {
	return PLANS[planId] || PLANS.free;
}

export function isPro() {
	return true;
}

export function isBetaMode() {
	return true;
}

Object.freeze(PLANS.free);
Object.freeze(PLANS.pro);
Object.freeze(PLANS);
Object.freeze(CREDIT_COSTS);
