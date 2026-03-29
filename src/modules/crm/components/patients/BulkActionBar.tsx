import { Mail, X, Users, Bookmark, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BulkActionBarProps {
  selectedCount: number;
  onSendEmail: () => void;
  onSaveSegment: () => void;
  onCreateCampaign: () => void;
  onClearSelection: () => void;
  hasAIQuery?: boolean;
}

export function BulkActionBar({ 
  selectedCount, 
  onSendEmail, 
  onSaveSegment,
  onCreateCampaign,
  onClearSelection,
  hasAIQuery,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg border border-primary/20">
        <div className="flex items-center gap-2 border-r border-primary-foreground/20 pr-4">
          <Users className="h-4 w-4" />
          <span className="font-medium">{selectedCount} patient{selectedCount > 1 ? 's' : ''}</span>
        </div>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onSendEmail}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </TooltipTrigger>
          <TooltipContent>Envoyer un email rapide</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSaveSegment}
              className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Segment
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasAIQuery ? 'Sauvegarder comme segment dynamique' : 'Sauvegarder comme segment'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCreateCampaign}
              className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Campagne
            </Button>
          </TooltipTrigger>
          <TooltipContent>Créer une campagne trackée</TooltipContent>
        </Tooltip>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 ml-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
