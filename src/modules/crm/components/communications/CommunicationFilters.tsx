import { useTranslation } from 'react-i18next';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ChannelFilter, StatusFilter, DirectionFilter, PeriodFilter } from '@/shared/types/communications';

interface CommunicationFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  channelFilter: ChannelFilter;
  onChannelChange: (value: ChannelFilter) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  directionFilter: DirectionFilter;
  onDirectionChange: (value: DirectionFilter) => void;
  periodFilter: PeriodFilter;
  onPeriodChange: (value: PeriodFilter) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function CommunicationFilters({
  searchQuery,
  onSearchChange,
  channelFilter,
  onChannelChange,
  statusFilter,
  onStatusChange,
  directionFilter,
  onDirectionChange,
  periodFilter,
  onPeriodChange,
  onRefresh,
  isRefreshing,
}: CommunicationFiltersProps) {
  const { t } = useTranslation(['communications']);

  return (
    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
      {/* Search */}
      <div className="relative flex-1 w-full lg:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('communications:searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Channel filter */}
        <Select value={channelFilter} onValueChange={(v) => onChannelChange(v as ChannelFilter)}>
          <SelectTrigger className="w-[110px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('communications:filterAll')}</SelectItem>
            <SelectItem value="email">{t('communications:channelEmail')}</SelectItem>
            <SelectItem value="sms">{t('communications:channelSms')}</SelectItem>
            <SelectItem value="phone">{t('communications:filterPhone')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder={t('communications:filterStatusLabel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('communications:filterStatusLabel')}</SelectItem>
            <SelectItem value="sent">{t('communications:filterStatusSent')}</SelectItem>
            <SelectItem value="delivered">{t('communications:filterStatusDelivered')}</SelectItem>
            <SelectItem value="failed">{t('communications:filterStatusFailed')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Direction filter */}
        <Select value={directionFilter} onValueChange={(v) => onDirectionChange(v as DirectionFilter)}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder={t('communications:filterDirectionLabel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('communications:filterDirectionLabel')}</SelectItem>
            <SelectItem value="outbound">{t('communications:filterOutbound')}</SelectItem>
            <SelectItem value="inbound">{t('communications:filterInbound')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Period filter */}
        <Select value={periodFilter} onValueChange={(v) => onPeriodChange(v as PeriodFilter)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={t('communications:filterPeriodAll')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('communications:filterPeriodAll')}</SelectItem>
            <SelectItem value="today">{t('communications:filterToday')}</SelectItem>
            <SelectItem value="week">{t('communications:filterWeek')}</SelectItem>
            <SelectItem value="month">{t('communications:filterMonth')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-10 w-10"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
