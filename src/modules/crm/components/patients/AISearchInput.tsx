import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkles, HelpCircle, ChevronDown, Loader2, X, Lightbulb } from 'lucide-react';

interface AISearchInputProps {
  onSearch: (query: string) => Promise<void>;
  onClear: () => void;
  isSearching: boolean;
  explanation: string;
  resultCount: number | null;
}

const EXAMPLE_QUERIES = [
  "Patients ayant eu du Botox il y a plus de 6 mois sans nouveau RDV",
  "Patients de Paris ayant dépensé plus de 1000 euros",
  "Patients avec historique de no-show",
  "Patients inactifs depuis 3 mois",
  "Nouveaux patients du dernier mois",
  "Patients ayant eu du filler cette année",
];

export function AISearchInput({ 
  onSearch, 
  onClear, 
  isSearching, 
  explanation, 
  resultCount 
}: AISearchInputProps) {
  const [query, setQuery] = useState('');

  const handleSearch = async () => {
    if (query.trim()) {
      await onSearch(query.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <div className="space-y-3 p-4 bg-accent/30 rounded-lg border border-accent">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Recherche intelligente</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              Décrivez en langage naturel les patients que vous recherchez. 
              L'IA analysera votre demande et trouvera les patients correspondants.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vos données patients restent privées - seule la structure de la requête est analysée.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Textarea
        placeholder="Ex: Patients ayant eu du Botox il y a plus de 6 mois sans nouveau rendez-vous..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[80px] resize-none bg-background"
        disabled={isSearching}
      />

      <div className="flex flex-wrap gap-2 items-center">
        <Button 
          onClick={handleSearch} 
          disabled={!query.trim() || isSearching}
          variant="gradient"
          size="sm"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Recherche...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Rechercher avec l'IA
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Lightbulb className="h-4 w-4 mr-2" />
              Exemples
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[320px]">
            {EXAMPLE_QUERIES.map((example, index) => (
              <DropdownMenuItem 
                key={index}
                onClick={() => handleExampleClick(example)}
                className="cursor-pointer text-sm"
              >
                {example}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(explanation || resultCount !== null) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        )}
      </div>

      {explanation && (
        <Alert className="bg-background border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <span className="font-medium">{resultCount} patient{resultCount !== 1 ? 's' : ''} trouvé{resultCount !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground"> — {explanation}</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
