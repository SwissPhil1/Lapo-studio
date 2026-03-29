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
  return (
    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
      {/* Search */}
      <div className="relative flex-1 w-full lg:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un patient..."
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
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="phone">Téléphone</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Statut</SelectItem>
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="delivered">Délivré</SelectItem>
            <SelectItem value="failed">Échec</SelectItem>
          </SelectContent>
        </Select>

        {/* Direction filter */}
        <Select value={directionFilter} onValueChange={(v) => onDirectionChange(v as DirectionFilter)}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Direction</SelectItem>
            <SelectItem value="outbound">Sortants</SelectItem>
            <SelectItem value="inbound">Entrants</SelectItem>
          </SelectContent>
        </Select>

        {/* Period filter */}
        <Select value={periodFilter} onValueChange={(v) => onPeriodChange(v as PeriodFilter)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toute période</SelectItem>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">7 derniers jours</SelectItem>
            <SelectItem value="month">30 derniers jours</SelectItem>
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
