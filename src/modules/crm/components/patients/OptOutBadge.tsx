import { useTranslation } from 'react-i18next';
import { MailX, MessageSquareOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface OptOutBadgeProps {
  consents?: {
    email_opt_out?: boolean;
    sms_opt_out?: boolean;
    [key: string]: unknown;
  } | null;
}

export function OptOutBadge({ consents }: OptOutBadgeProps) {
  const { t } = useTranslation();
  const emailOptOut = consents?.email_opt_out === true;
  const smsOptOut = consents?.sms_opt_out === true;

  if (!emailOptOut && !smsOptOut) return null;

  return (
    <div className="flex items-center gap-1">
      {emailOptOut && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="gap-1 text-xs">
              <MailX className="h-3 w-3" />
              {t('optOut.emailOptOut', { defaultValue: 'Email opt-out' })}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {t('optOut.emailOptOutDesc', { defaultValue: 'This patient has opted out of email communications' })}
          </TooltipContent>
        </Tooltip>
      )}
      {smsOptOut && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="gap-1 text-xs">
              <MessageSquareOff className="h-3 w-3" />
              {t('optOut.smsOptOut', { defaultValue: 'SMS opt-out' })}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {t('optOut.smsOptOutDesc', { defaultValue: 'This patient has opted out of SMS communications' })}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
