const ACTION_LOG = [];
const MAX_ACTIONS = 5;

export function trackAction(action) {
	ACTION_LOG.unshift({ ...action, ts: Date.now() });
	if (ACTION_LOG.length > MAX_ACTIONS) ACTION_LOG.pop();
}

export function getActionLog() {
	return [...ACTION_LOG];
}

export const Actions = {
	OPEN_APP:     (appId)   => trackAction({ type: 'open_app',     detail: appId }),
	CLOSE_APP:    (appId)   => trackAction({ type: 'close_app',    detail: appId }),
	AI_CALL:      (appId)   => trackAction({ type: 'ai_call',      detail: appId }),
	CHANGE_THEME: (theme)   => trackAction({ type: 'change_theme', detail: theme }),
	CHANGE_LANG:  (lang)    => trackAction({ type: 'change_lang',  detail: lang }),
	CMD_PALETTE:  (query)   => trackAction({ type: 'cmd_palette',  detail: query?.slice(0, 40) }),
	MIRA_MSG:     (snippet) => trackAction({ type: 'mira_message', detail: snippet?.slice(0, 40) }),
	NAV:          (route)   => trackAction({ type: 'navigate',     detail: route }),
	// Funnel conversion events
	ONBOARDING_START:  ()       => trackAction({ type: 'onboarding_started',  detail: '' }),
	ONBOARDING_STEP:   (step)   => trackAction({ type: 'onboarding_step',     detail: step }),
	ONBOARDING_DONE:   ()       => trackAction({ type: 'onboarding_complete', detail: '' }),
	FIRST_AI_CALL:     (appId)  => trackAction({ type: 'first_ai_call',       detail: appId }),
	CREDIT_DEPLETED:   ()       => trackAction({ type: 'credit_depleted',     detail: '' }),
	UPGRADE_MODAL:     (reason) => trackAction({ type: 'upgrade_modal',       detail: reason?.slice(0, 40) }),
};

export function formatActionLog() {
	if (ACTION_LOG.length === 0) return 'No actions recorded yet.';
	return ACTION_LOG
		.map((a, i) => `${i + 1}. [${new Date(a.ts).toLocaleTimeString()}] ${a.type}: ${a.detail}`)
		.join('\n');
}
