/**
 * In-app feedback: builds pre-filled GitHub "new issue" URLs.
 * No tokens and no API calls — the user submits the issue with their own
 * GitHub account. Only the app version and a trimmed user agent are sent;
 * never any task data.
 */
export const REPO_URL = 'https://github.com/lance6x5/home-maintenance-tracker';
export const ISSUES_URL = `${REPO_URL}/issues`;

const MAX_ENV_LENGTH = 160;

/** Trim and shorten a user-agent string so the URL stays short. */
export function trimEnvironment(ua) {
  const s = String(ua || '').replace(/\s+/g, ' ').trim();
  return s.length > MAX_ENV_LENGTH ? `${s.slice(0, MAX_ENV_LENGTH - 1)}…` : s;
}

/**
 * Build a new-issue URL.
 * @param {'bug'|'feature'} kind
 * @param {{ version?: string, userAgent?: string }} [opts]
 */
export function buildIssueUrl(kind, { version = '', userAgent = '' } = {}) {
  const params = new URLSearchParams();
  if (kind === 'bug') {
    params.set('template', 'bug_report.yml');
    params.set('title', '[Bug]: ');
  } else if (kind === 'feature') {
    params.set('template', 'feature_request.yml');
    params.set('title', '[Feature]: ');
  } else {
    throw new Error(`Unknown feedback kind: ${kind}`);
  }
  if (version) params.set('version', String(version));
  if (kind === 'bug') {
    const env = trimEnvironment(userAgent);
    if (env) params.set('environment', env);
  }
  // URLSearchParams encodes spaces as "+"; use %20 for maximum compatibility.
  return `${ISSUES_URL}/new?${params.toString().replace(/\+/g, '%20')}`;
}
