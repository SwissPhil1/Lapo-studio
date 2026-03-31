import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isToday, isPast, type Locale } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import {
  Inbox,
  Bell,
  ListTodo,
  Zap,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
  type AppNotification,
} from '@/shared/hooks/useNotifications';
import {
  useReactivationTasks,
  type ReactivationTask,
} from '@/shared/hooks/useReactivationTasks';

export default function InboxPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language === 'fr' ? frLocale : enUS;
  const [activeTab, setActiveTab] = useState('tasks');

  const { data: notifications = [], isLoading: notifsLoading } = useNotifications();
  const { data: tasks = [], isLoading: tasksLoading } = useReactivationTasks({
    status: ['pending', 'in_progress'],
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = notifications.filter(n => !n.read).length;
  const todayTasks = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)));
  const overdueTasks = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)));

  const isLoading = notifsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Inbox className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('inbox.title', { defaultValue: 'Inbox' })}</h1>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="mr-1 h-4 w-4" />
            {t('inbox.markAllRead', { defaultValue: 'Mark all read' })}
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setActiveTab('tasks')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
            <p className="text-xs text-muted-foreground">{t('inbox.overdueTasks', { defaultValue: 'Overdue' })}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setActiveTab('tasks')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{todayTasks.length}</p>
            <p className="text-xs text-muted-foreground">{t('inbox.todayTasks', { defaultValue: 'Due Today' })}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setActiveTab('notifications')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{unreadCount}</p>
            <p className="text-xs text-muted-foreground">{t('inbox.unread', { defaultValue: 'Unread' })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks" className="gap-1">
            <ListTodo className="h-4 w-4" />
            {t('inbox.tasks', { defaultValue: 'Tasks' })}
            <Badge variant="secondary" className="ml-1">{tasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1">
            <Bell className="h-4 w-4" />
            {t('inbox.notifications', { defaultValue: 'Notifications' })}
            {unreadCount > 0 && <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {t('inbox.noTasks', { defaultValue: 'No pending tasks' })}
                </div>
              ) : (
                tasks.map(task => (
                  <TaskInboxItem
                    key={task.id}
                    task={task}
                    locale={locale}
                    onClick={() => navigate(`/crm/patients/${task.patient_id}`)}
                    t={t}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="notifications">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {t('inbox.noNotifications', { defaultValue: 'No notifications' })}
                </div>
              ) : (
                notifications.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    locale={locale}
                    onClick={() => {
                      if (!notif.read) markRead.mutate(notif.id);
                      if (notif.link) navigate(notif.link);
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskInboxItem({
  task,
  locale,
  onClick,
  t,
}: {
  task: ReactivationTask;
  locale: Locale;
  onClick: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
  const patientName = task.patients
    ? `${task.patients.first_name} ${task.patients.last_name}`
    : t('inbox.unknownPatient', { defaultValue: 'Unknown' });

  return (
    <button
      className={`w-full text-left rounded-lg border p-3 hover:bg-accent/50 transition-colors ${isOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{patientName}</span>
          <Badge variant="outline" className="text-xs">{task.task_type.replace(/_/g, ' ')}</Badge>
          {isOverdue && <Badge variant="destructive" className="text-xs">{t('inbox.overdue', { defaultValue: 'Overdue' })}</Badge>}
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        {task.due_date && (
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {t('inbox.due', { defaultValue: 'Due' })}: {format(parseISO(task.due_date), 'dd MMM', { locale })}
          </span>
        )}
        <span>{task.priority}</span>
        {task.notes && <span className="truncate max-w-[200px]">{task.notes}</span>}
      </div>
    </button>
  );
}

function NotificationItem({
  notification,
  locale,
  onClick,
}: {
  notification: AppNotification;
  locale: Locale;
  onClick: () => void;
}) {
  const ICONS: Record<string, typeof Bell> = {
    task_due: ListTodo,
    workflow_alert: Zap,
    pipeline_move: Inbox,
    new_booking: Inbox,
    campaign_sent: Bell,
    general: Bell,
  };
  const Icon = ICONS[notification.type] || Bell;

  return (
    <button
      className={`w-full text-left rounded-lg border p-3 hover:bg-accent/50 transition-colors ${!notification.read ? 'bg-primary/5 border-primary/20' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
          {notification.title}
        </span>
        {!notification.read && <div className="h-2 w-2 rounded-full bg-primary" />}
        <span className="ml-auto text-xs text-muted-foreground">
          {format(parseISO(notification.created_at), 'dd MMM, HH:mm', { locale })}
        </span>
      </div>
      {notification.body && (
        <p className="mt-1 text-xs text-muted-foreground truncate">{notification.body}</p>
      )}
    </button>
  );
}
