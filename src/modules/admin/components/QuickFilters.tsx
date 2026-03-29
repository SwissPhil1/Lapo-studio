import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface QuickFiltersProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function QuickFilters<T extends string>({
  options,
  value,
  onChange,
  className,
}: QuickFiltersProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(option.value)}
          className="h-8"
        >
          {option.label}
          {option.count !== undefined && (
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded text-xs",
              value === option.value 
                ? "bg-primary-foreground/20 text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {option.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
