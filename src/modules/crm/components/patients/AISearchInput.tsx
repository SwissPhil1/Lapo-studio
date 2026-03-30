import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export function AISearchInput({
  onSearch,
  onClear,
  isSearching,
  explanation,
  resultCount
}: AISearchInputProps) {
  const { t } = useTranslation(['patients']);
  const [query, setQuery] = useState('');

  const EXAMPLE_QUERIES = [
    t('patients:aiExample1'),
    t('patients:aiExample2'),
    t('patients:aiExample3'),
    t('patients:aiExample4'),
    t('patients:aiExample5'),
    t('patients:aiExample6'),
  ];

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
        <span className="text-sm font-medium text-foreground">{t('patients:aiSmartSearch')}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              {t('patients:aiSearchTooltip')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('patients:aiSearchPrivacy')}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Textarea
        placeholder={t('patients:aiSearchPlaceholder')}
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
              {t('patients:aiSearching')}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {t('patients:aiSearchButton')}
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Lightbulb className="h-4 w-4 mr-2" />
              {t('patients:aiExamples')}
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
            {t('patients:aiClear')}
          </Button>
        )}
      </div>

      {explanation && (
        <Alert className="bg-background border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <span className="font-medium">{t('patients:aiResultCount', { count: resultCount ?? 0 })}</span>
            <span className="text-muted-foreground"> — {explanation}</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
