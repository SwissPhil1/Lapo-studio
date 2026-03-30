import { useTranslation } from 'react-i18next';
import { Gift, AlertTriangle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { getLocale } from '@/shared/lib/format';

interface ReferralBannerProps {
  referrerCode: string;
  referrerName?: string;
  discountPercent?: number;
  expiresAt?: string;
}

export function ReferralBanner({
  referrerCode,
  referrerName,
  discountPercent,
  expiresAt
}: ReferralBannerProps) {
  const { t } = useTranslation(['referrers']);
  const daysUntilExpiry = expiresAt
    ? differenceInDays(parseISO(expiresAt), new Date())
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">
              {t('referrers:referredBy', { name: referrerName || referrerCode })}
            </span>
            {discountPercent && (
              <span className="text-sm text-primary font-medium">
                • {t('referrers:discountPercent', { percent: discountPercent })}
              </span>
            )}
          </div>
          {expiresAt && !isExpired && (
            <div className="flex items-center gap-1 mt-1">
              {isExpiringSoon && (
                <AlertTriangle className="h-3 w-3 text-warning" />
              )}
              <span className={`text-sm ${isExpiringSoon ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                {isExpiringSoon
                  ? t('referrers:expiresInDays', { days: daysUntilExpiry })
                  : t('referrers:expiresOn', { date: new Date(expiresAt).toLocaleDateString(getLocale()) })
                }
              </span>
            </div>
          )}
          {isExpired && (
            <span className="text-sm text-destructive">{t('referrers:referralExpired')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
