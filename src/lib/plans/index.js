export const PLANS = {
	free: {
		id:              'free',
		name:            'Free',
		price:           0,
		creditsPerMonth: 30,
		betaUnlimited:   false,
		workspaces:      1,
		promptLibMax:    25,
		themes:          ['noir', 'icaro'],
		miraFull:        false,
		mobileApp:       false,
		earlyAccess:     false,
	},
	pro: {
		id:              'pro',
		name:            'Pro',
		priceMonthly:    24,
		priceYearly:     199,
		creditsPerMonth: null,
		betaUnlimited:   true,
		workspaces:      5,
		promptLibMax:    null,
		themes:          ['noir', 'icaro', 'synthwave', 'ocean', 'matrix'],
		miraFull:        true,
		mobileApp:       true,
		earlyAccess:     true,
	},
};

export const CREDIT_COSTS = {
	prompt_optimizer:  2,
	repurposer:        3,
	brief_gen:         3,
	workflow_builder:  5,
	mira_message:      1,
	ollama:            0,
	prospectly:        2,
	aiworksuite:       1,
};

export function getPlan(planId) {
	return PLANS[planId] || PLANS.free;
}

export function isPro(planId) {
	return planId === 'pro';
}

export function isBetaMode() {
	return PLANS.free.betaUnlimited;
}
