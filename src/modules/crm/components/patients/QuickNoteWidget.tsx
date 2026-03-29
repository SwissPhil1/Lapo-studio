import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/shared/lib/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface QuickNoteWidgetProps {
  patientId: string;
}

export function QuickNoteWidget({ patientId }: QuickNoteWidgetProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!note.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          user_id: patientId,
          title: 'Note rapide',
          content: note.trim(),
          note_type: 'general',
          priority: 'normal',
          created_by: user?.id || null,
        });
      
      if (error) throw error;
      
      toast.success('Note ajoutée');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['patient-detail', patientId] });
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">Note rapide</h3>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ajouter une note..."
        className="min-h-[80px] resize-none text-sm"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">⌘ + Entrée pour envoyer</span>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!note.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              Ajouter
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
