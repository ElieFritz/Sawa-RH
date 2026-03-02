export type SessionUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR' | 'RH_PRO' | 'CANDIDATE' | 'RECRUITER';
  profile: {
    completionStatus: 'INCOMPLETE' | 'COMPLETE';
    verificationStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
    verifiedBadge?: boolean;
    fullName?: string | null;
  } | null;
};

export type AppSession = {
  user: SessionUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

const storageKey = 'sawa-rh.session';

export function saveSession(session: AppSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(session));
}

export function getSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(storageKey);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AppSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(storageKey);
}
