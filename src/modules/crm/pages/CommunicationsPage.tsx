import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Loader2, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isToday, isYesterday, isThisWeek, startOfDay, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SendMessageDialog } from '@/modules/crm/components/communications/SendMessageDialog';
import { CommunicationItem } from '@/modules/crm/components/communications/CommunicationItem';
import { CommunicationMetrics } from '@/modules/crm/components/communications/CommunicationMetrics';
import { CommunicationFilters } from '@/modules/crm/components/communications/CommunicationFilters';
import type { CommunicationLog, ChannelFilter, StatusFilter, DirectionFilter, PeriodFilter } from '@/shared/types/communications';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 50;

function groupCommunicationsByDate(communications: CommunicationLog[], todayLabel: string, yesterdayLabel: string) {
  const groups: Record<string, CommunicationLog[]> = {};

  communications.forEach(comm => {
    const date = new Date(comm.sent_at);
    let groupKey: string;

    if (isToday(date)) {
      groupKey = todayLabel;
    } else if (isYesterday(date)) {
      groupKey = yesterdayLabel;
    } else if (isThisWeek(date)) {
      groupKey = format(date, 'EEEE d MMMM', { locale: fr });
      groupKey = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
    } else {
      groupKey = format(date, 'MMMM yyyy', { locale: fr });
      groupKey = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(comm);
  });

  return groups;
}

export default function Communications() {
  const { t } = useTranslation(['communications', 'common']);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: queryResult, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['crm-communication-logs', channelFilter, statusFilter, directionFilter, periodFilter, debouncedSearch, displayCount],
    queryFn: async () => {
      let query = supabase
        .from('crm_communication_logs')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' })
        .order('sent_at', { ascending: false });
      
      // Channel filter
      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'delivered') {
          query = query.not('delivered_at', 'is', null);
        } else if (statusFilter === 'failed') {
          query = query.not('bounced_at', 'is', null);
        } else {
          query = query.eq('status', statusFilter);
        }
      }
      
      // Direction filter
      if (directionFilter !== 'all') {
        query = query.eq('direction', directionFilter);
      }
      
      // Period filter
      if (periodFilter !== 'all') {
        const now = new Date();
        let fromDate: Date;
        
        if (periodFilter === 'today') {
          fromDate = startOfDay(now);
        } else if (periodFilter === 'week') {
          fromDate = subDays(now, 7);
        } else {
          fromDate = subDays(now, 30);
        }
        
        query = query.gte('sent_at', fromDate.toISOString());
      }
      
      // Search filter (server-side for subject/preview)
      if (debouncedSearch) {
        query = query.or(`subject.ilike.%${debouncedSearch}%,message_preview.ilike.%${debouncedSearch}%`);
      }

      // Server-side pagination: only fetch what we need
      query = query.range(0, displayCount - 1);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Client-side patient name filter if needed (cannot do server-side join filter)
      let filtered = data as CommunicationLog[];
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase();
        filtered = filtered.filter(comm => {
          const patientName = comm.patients 
            ? `${comm.patients.first_name} ${comm.patients.last_name}`.toLowerCase()
            : '';
          const subject = (comm.subject || '').toLowerCase();
          const preview = (comm.message_preview || '').toLowerCase();
          return patientName.includes(search) || subject.includes(search) || preview.includes(search);
        });
      }
      
      return { communications: filtered, totalCount: count || 0 };
    },
  });

  const communications = queryResult?.communications || [];
  const totalCount = queryResult?.totalCount || 0;

  const displayedCommunications = communications;
  const hasMore = communications.length >= displayCount && communications.length < totalCount;
  const groupedCommunications = groupCommunicationsByDate(displayedCommunications, t('communications:today'), t('communications:yesterday'));

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics dashboard */}
      <CommunicationMetrics />

      {/* Header with filters and send button */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <CommunicationFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          channelFilter={channelFilter}
          onChannelChange={setChannelFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          directionFilter={directionFilter}
          onDirectionChange={setDirectionFilter}
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          onRefresh={handleRefresh}
          isRefreshing={isFetching}
        />

        <Button onClick={() => setSendDialogOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {t('communications:sendMessage')}
        </Button>
      </div>

      {/* Count indicator */}
      {totalCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {displayCount >= totalCount
            ? t('communications:messageCount', { count: totalCount })
            : t('communications:displayOf', { displayed: displayCount, total: totalCount })
          }
        </p>
      )}

      {/* Communications timeline */}
      {Object.keys(groupedCommunications).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedCommunications).map(([dateGroup, comms]) => (
            <div key={dateGroup} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-2 z-10">
                {dateGroup} ({comms.length})
              </h3>
              <div className="space-y-2">
                {comms.map((comm, index) => (
                  <CommunicationItem 
                    key={comm.id} 
                    communication={comm} 
                    index={index}
                  />
                ))}
              </div>
            </div>
          ))}
          
          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleLoadMore}>
                {t('communications:loadMore', { remaining: communications.length - displayCount })}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="card-elevated p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('communications:noCommunications')}</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || channelFilter !== 'all' || statusFilter !== 'all' || directionFilter !== 'all' || periodFilter !== 'all'
              ? t('communications:noResultsFilters')
              : t('communications:emptyDescription')
            }
          </p>
          <Button onClick={() => setSendDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('communications:sendMessage')}
          </Button>
        </div>
      )}

      {/* Send message dialog */}
      <SendMessageDialog 
        open={sendDialogOpen} 
        onOpenChange={setSendDialogOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
