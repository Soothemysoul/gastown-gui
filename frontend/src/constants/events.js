/**
 * Gas Town GUI - Event Constants
 *
 * Centralized event name constants to avoid magic strings.
 */

// Status & Refresh Events
export const STATUS_REFRESH = 'status:refresh';
export const STATUS_UPDATED = 'status:updated';
export const DASHBOARD_REFRESH = 'dashboard:refresh';
export const RIGS_REFRESH = 'rigs:refresh';
export const WORK_REFRESH = 'work:refresh';
export const MAIL_REFRESH = 'mail:refresh';
export const CREW_REFRESH = 'crew:refresh';

// Navigation & Detail Events
export const BEAD_DETAIL = 'bead:detail';
export const BEAD_CREATED = 'bead:created';
export const BEAD_SLING = 'bead:sling';

export const CONVOY_DETAIL = 'convoy:detail';
export const CONVOY_CREATED = 'convoy:created';
export const CONVOY_ESCALATE = 'convoy:escalate';
export const CONVOY_ESCALATED = 'convoy:escalated';

export const AGENT_DETAIL = 'agent:detail';
export const AGENT_NUDGE = 'agent:nudge';
export const AGENT_PEEK = 'agent:peek';

export const POLECAT_ACTION = 'polecat:action';

export const ISSUE_DETAIL = 'issue:detail';

export const MAIL_DETAIL = 'mail:detail';
export const MAIL_READ = 'mail:read';
export const MAIL_REPLY = 'mail:reply';

// Modal & UI Events
export const MODAL_SHOW = 'modal:show';
export const MODAL_CLOSE = 'modal:close';
export const SLING_OPEN = 'sling:open';
export const WORK_SLUNG = 'work:slung';
export const TOAST_SHOW = 'toast:show';
export const ONBOARDING_COMPLETE = 'onboarding:complete';
