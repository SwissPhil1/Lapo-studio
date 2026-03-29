import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/shared/hooks/use-toast';
import { Target, Sparkles, Users, Trash2, Play, Megaphone, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Segment {
  id: string;
  name: string;
  type: string;
  ai_query: string | null;
  patient_ids: string[] | null;
  created_at: string;
}

interface SavedSegmentsListProps {
  onApplySegment: (segment: Segment) => void;
  onCreateCampaign: (segment: Segment) => void;
}

export function SavedSegmentsList({ onApplySegment, onCreateCampaign }: SavedSegmentsListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: segments = [] } = useQuery({
    queryKey: ['crm_segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_segments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Segment[];
    },
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: async (segmentId: string) => {
      const { error } = await supabase
        .from('crm_segments')
        .delete()
        .eq('id', segmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_segments'] });
      setSegmentToDelete(null);
      toast({ title: 'Segment supprimé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleApply = (segment: Segment) => {
    onApplySegment(segment);
    setIsOpen(false);
  };

  if (segments.length === 0) {
    return null;
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Target className="h-4 w-4 text-primary" />
            Segments
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {segments.length}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">Segments sauvegardés</h4>
            <p className="text-xs text-muted-foreground">Appliquez un segment ou créez une campagne</p>
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="p-2 space-y-1">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h5 className="font-medium text-sm text-foreground truncate flex-1">
                      {segment.name}
                    </h5>
                    <Badge 
                      variant={segment.type === 'dynamic' ? 'default' : 'secondary'}
                      className="text-[10px] h-5 shrink-0"
                    >
                      {segment.type === 'dynamic' ? (
                        <><Sparkles className="h-2.5 w-2.5 mr-1" /> IA</>
                      ) : (
                        <><Users className="h-2.5 w-2.5 mr-1" /> {segment.patient_ids?.length || 0}</>
                      )}
                    </Badge>
                  </div>
                  
                  {segment.type === 'dynamic' && segment.ai_query && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2 italic">
                      "{segment.ai_query}"
                    </p>
                  )}

                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 h-7 text-xs"
                          onClick={() => handleApply(segment)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Appliquer
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Filtrer la liste par ce segment</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs px-2"
                          onClick={() => {
                            onCreateCampaign(segment);
                            setIsOpen(false);
                          }}
                        >
                          <Megaphone className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Créer une campagne avec ce segment</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setSegmentToDelete(segment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Supprimer ce segment</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Delete Segment Confirmation */}
      <AlertDialog open={!!segmentToDelete} onOpenChange={() => setSegmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce segment ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le segment sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => segmentToDelete && deleteSegmentMutation.mutate(segmentToDelete)}
            >
              {deleteSegmentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
