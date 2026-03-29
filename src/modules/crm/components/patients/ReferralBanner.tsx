import { Gift, AlertTriangle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

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
              Referred by {referrerName || referrerCode}
            </span>
            {discountPercent && (
              <span className="text-sm text-primary font-medium">
                • {discountPercent}% discount
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
                  ? `Expires in ${daysUntilExpiry} days` 
                  : `Expires: ${new Date(expiresAt).toLocaleDateString()}`
                }
              </span>
            </div>
          )}
          {isExpired && (
            <span className="text-sm text-destructive">Referral expired</span>
          )}
        </div>
      </div>
    </div>
  );
}
