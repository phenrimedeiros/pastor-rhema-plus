const DISMISS_PREFIX = "rhema_satisfaction_survey_dismissed:";
const COMPLETED_PREFIX = "rhema_satisfaction_survey_completed:";

export function getSurveyDismissKey(userId) {
  return `${DISMISS_PREFIX}${userId}`;
}

export function getSurveyCompletedKey(userId) {
  return `${COMPLETED_PREFIX}${userId}`;
}

export function isSurveyDismissedForSession(userId) {
  if (typeof window === "undefined" || !userId) return false;

  try {
    return window.sessionStorage.getItem(getSurveyDismissKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function dismissSurveyForSession(userId) {
  if (typeof window === "undefined" || !userId) return;

  try {
    window.sessionStorage.setItem(getSurveyDismissKey(userId), "1");
  } catch {}
}

export function clearSurveySessionDismissal(userId) {
  if (typeof window === "undefined" || !userId) return;

  try {
    window.sessionStorage.removeItem(getSurveyDismissKey(userId));
  } catch {}
}

export function markSurveyCompleted(userId) {
  if (typeof window === "undefined" || !userId) return;

  try {
    window.localStorage.setItem(getSurveyCompletedKey(userId), "1");
  } catch {}
}

export function isSurveyCompletedLocally(userId) {
  if (typeof window === "undefined" || !userId) return false;

  try {
    return window.localStorage.getItem(getSurveyCompletedKey(userId)) === "1";
  } catch {
    return false;
  }
}
