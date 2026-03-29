/**
 * Shared helper for computing referrer activity status
 */

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

export const activityStatusConfig = {
  active: {
    color: '#2ecc71',
    label: 'Actif',
    tooltip: 'Actif – a fait un parrainage récemment',
  },
  dormant: {
    color: '#f1c40f',
    label: 'À relancer',
    tooltip: 'À relancer – aucun parrainage dans les 2 derniers mois',
  },
  cold: {
    color: '#e74c3c',
    label: 'Inactif',
    tooltip: 'Inactif – aucun parrainage depuis plus de 6 mois',
  },
} as const;
