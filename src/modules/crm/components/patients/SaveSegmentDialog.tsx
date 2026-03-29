import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useToast } from '@/shared/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Bookmark, Sparkles, Users } from 'lucide-react';

interface SaveSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientIds: string[];
  aiQuery?: string;
  patientCount: number;
  onSuccess?: () => void;
}

export function SaveSegmentDialog({
  open,
  onOpenChange,
  patientIds,
  aiQuery,
  patientCount,
  onSuccess,
}: SaveSegmentDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'static' | 'dynamic'>(aiQuery ? 'dynamic' : 'static');
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const segmentData: Record<string, unknown> = {
        name,
        type,
      };

      if (type === 'dynamic' && aiQuery) {
        segmentData.ai_query = aiQuery;
        segmentData.filter_json = { ai_query: aiQuery };
      } else {
        segmentData.patient_ids = patientIds;
        segmentData.filter_json = { patient_ids: patientIds };
      }

      const { error } = await supabase
        .from('crm_segments')
        .insert([segmentData]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Segment sauvegardé',
        description: `Le segment "${name}" a été créé avec succès.`,
      });
      setName('');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un nom pour le segment.',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Sauvegarder le segment
          </DialogTitle>
          <DialogDescription>
            Créez un segment réutilisable à partir de votre recherche.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="segment-name">Nom du segment</Label>
            <Input
              id="segment-name"
              placeholder="ex: Botox > 6 mois"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {aiQuery && (
            <div className="space-y-3">
              <Label>Type de segment</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as 'static' | 'dynamic')}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="dynamic" id="dynamic" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="dynamic" className="flex items-center gap-2 cursor-pointer font-medium">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Dynamique (recommandé)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Se met à jour automatiquement. Les nouveaux patients correspondants seront inclus.
                    </p>
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
                      "{aiQuery}"
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="static" id="static" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="static" className="flex items-center gap-2 cursor-pointer font-medium">
                      <Users className="h-4 w-4" />
                      Statique
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Liste fixe des {patientCount} patients actuellement sélectionnés.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {!aiQuery && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{patientCount} patients</span>
                <span className="text-muted-foreground">seront inclus dans ce segment</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={saveMutation.isPending || !name.trim()}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bookmark className="h-4 w-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
