import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Loader2 } from 'lucide-react';
import { usePipelineActions } from '@/shared/hooks/usePipelineActions';

interface PipelineStage {
  id: string;
  name: string;
  order_index: number;
}

interface AddToPipelineDialogProps {
  stages: PipelineStage[];
  existingPatientIds: string[];
}

export function AddToPipelineDialog({ stages, existingPatientIds }: AddToPipelineDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string>(stages[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<string>('medium');

  const { addPatient } = usePipelineActions();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['available-patients', search, existingPatientIds],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .order('last_name');

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      
      // Filter out patients already in pipeline
      return (data || []).filter(p => !existingPatientIds.includes(p.id));
    },
    enabled: open,
  });

  const handleSubmit = () => {
    if (!selectedPatientId || !selectedStageId) return;

    addPatient.mutate(
      {
        patientId: selectedPatientId,
        stageId: selectedStageId,
        notes: notes || undefined,
        priority,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSearch('');
          setSelectedPatientId(null);
          setNotes('');
          setPriority('medium');
        },
      }
    );
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un patient au pipeline</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Search */}
          <div className="space-y-2">
            <Label>Rechercher un patient</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nom, prénom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Patient List */}
          <div className="border rounded-lg max-h-40 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : patients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun patient disponible
              </p>
            ) : (
              patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors ${
                    selectedPatientId === patient.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <p className="font-medium text-sm">
                    {patient.first_name} {patient.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{patient.email}</p>
                </button>
              ))
            )}
          </div>

          {selectedPatient && (
            <p className="text-sm text-primary">
              Sélectionné: {selectedPatient.first_name} {selectedPatient.last_name}
            </p>
          )}

          {/* Stage Selection */}
          <div className="space-y-2">
            <Label>Étape du pipeline</Label>
            <Select value={selectedStageId} onValueChange={setSelectedStageId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une étape" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              placeholder="Ajouter des notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPatientId || !selectedStageId || addPatient.isPending}
          >
            {addPatient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
