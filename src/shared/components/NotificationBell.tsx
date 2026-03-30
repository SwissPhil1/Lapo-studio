import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, Check, Kanban, Calendar, X } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';

interface AppNotification {
  id: string;
  type: 'pipeline' | 'booking';
  title: string;
  timestamp: Date;
  read: boolean;
}

const MAX_NOTIFICATIONS = 20;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation(['notifications', 'common']);
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'read'>) => {
    setNotifications((prev) => {
      const newNotif: AppNotification = {
        ...notif,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        read: false,
      };
      return [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const pipelineChannel = supabase
      .channel('notification-pipeline')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pipeline_patients' },
        () => {
          addNotification({
            type: 'pipeline',
            title: t('notifications:patientMovedStage', { defaultValue: 'Patient moved to a new stage' }),
            timestamp: new Date(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pipeline_patients' },
        () => {
          addNotification({
            type: 'pipeline',
            title: t('notifications:patientAddedPipeline', { defaultValue: 'Patient added to pipeline' }),
            timestamp: new Date(),
          });
        }
      )
      .subscribe();

    const bookingChannel = supabase
      .channel('notification-bookings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        () => {
          addNotification({
            type: 'booking',
            title: t('notifications:newAppointmentBooked', { defaultValue: 'New appointment booked' }),
            timestamp: new Date(),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pipelineChannel);
      supabase.removeChannel(bookingChannel);
    };
  }, [addNotification, t]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative rounded-lg p-2 transition-colors',
          'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-wow-coral text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-xl z-50">
          <div className="flex items-center justify-between border-b border-border p-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t('notifications:title', { defaultValue: 'Notifications' })}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Check className="h-3 w-3" />
                {t('notifications:markAllRead', { defaultValue: 'Mark all as read' })}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {t('notifications:empty', { defaultValue: 'No notifications yet' })}
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-3 p-3 border-b border-border/50 last:border-b-0 transition-colors',
                    !notif.read && 'bg-primary/5'
                  )}
                >
                  <div className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    notif.type === 'pipeline' ? 'bg-primary/10' : 'bg-success/10'
                  )}>
                    {notif.type === 'pipeline' ? (
                      <Kanban className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Calendar className="h-3.5 w-3.5 text-success" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', !notif.read ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: dateLocale })}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissNotification(notif.id)}
                    className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
