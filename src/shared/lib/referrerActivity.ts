/**
 * Shared helper for computing referrer activity status
 */

import i18n from '@/i18n';

export type ReferrerActivityStatus = 'active' | 'dormant' | 'cold';

interface ActivityStatusParams {
  createdAt: string | Date;
  lastReferralAt: string | Date | null;
}

export function getReferrerActivityStatus({
  createdAt,
  lastReferralAt,
}: ActivityStatusParams): ReferrerActivityStatus {
  const now = new Date();
  const created = new Date(createdAt);
  const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

  // Special case: first 60 days after account creation → always GREEN
  if (daysSinceCreation <= 60) {
    return 'active';
  }

  // If no referrals and past 60 days → RED
  if (!lastReferralAt) {
    return 'cold';
  }

  // Has referrals: check recency
  const lastReferral = new Date(lastReferralAt);
  const daysSinceLastReferral = (now.getTime() - lastReferral.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastReferral <= 60) {
    return 'active';
  } else if (daysSinceLastReferral <= 180) {
    return 'dormant';
  } else {
    return 'cold';
  }
}

export function getActivityStatusConfig() {
  return {
    active: {
      color: '#2ecc71',
      label: i18n.t('common:activityActive'),
      tooltip: i18n.t('common:activityActiveTooltip'),
    },
    dormant: {
      color: '#f1c40f',
      label: i18n.t('common:activityDormant'),
      tooltip: i18n.t('common:activityDormantTooltip'),
    },
    cold: {
      color: '#e74c3c',
      label: i18n.t('common:activityCold'),
      tooltip: i18n.t('common:activityColdTooltip'),
    },
  };
}

/** @deprecated Use getActivityStatusConfig() instead */
export const activityStatusConfig = {
  active: {
    color: '#2ecc71',
    get label() { return i18n.t('common:activityActive'); },
    get tooltip() { return i18n.t('common:activityActiveTooltip'); },
  },
  dormant: {
    color: '#f1c40f',
    get label() { return i18n.t('common:activityDormant'); },
    get tooltip() { return i18n.t('common:activityDormantTooltip'); },
  },
  cold: {
    color: '#e74c3c',
    get label() { return i18n.t('common:activityCold'); },
    get tooltip() { return i18n.t('common:activityColdTooltip'); },
  },
} as const;
