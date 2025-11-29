import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface MultiSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  category?: string;
}

interface SearchableMultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  maxDisplayedItems?: number;
  showSelectedBelow?: boolean;
  className?: string;
  triggerClassName?: string;
  "data-testid"?: string;
}

export function SearchableMultiSelect({
  value = [],
  onValueChange,
  options,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  disabled = false,
  maxDisplayedItems = 3,
  showSelectedBelow = true,
  className,
  triggerClassName,
  "data-testid": dataTestId,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query) ||
        opt.category?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const groupedOptions = useMemo(() => {
    const groups: Record<string, MultiSelectOption[]> = {};
    filteredOptions.forEach((opt) => {
      const category = opt.category || "";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(opt);
    });
    return groups;
  }, [filteredOptions]);

  const hasCategories = Object.keys(groupedOptions).some((key) => key !== "");

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onValueChange(newValue);
  };

  const handleRemove = (optionValue: string) => {
    onValueChange(value.filter((v) => v !== optionValue));
  };

  const handleClearAll = () => {
    onValueChange([]);
  };

  const selectedLabels = value
    .map((v) => options.find((opt) => opt.value === v)?.label || v)
    .slice(0, maxDisplayedItems);

  const remainingCount = value.length - maxDisplayedItems;

  const displayText =
    value.length === 0
      ? placeholder
      : selectedLabels.join(", ") +
        (remainingCount > 0 ? ` +${remainingCount}` : "");

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal min-h-9",
              value.length === 0 && "text-muted-foreground",
              triggerClassName
            )}
            data-testid={dataTestId}
          >
            <span className="truncate text-left flex-1">{displayText}</span>
            <div className="flex items-center gap-1 shrink-0">
              {value.length > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-xs font-normal">
                  {value.length}
                </Badge>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("w-[var(--radix-popover-trigger-width)] p-0", className)}
          align="start"
        >
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              data-testid={`${dataTestId}-search`}
            />
            {value.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                data-testid={`${dataTestId}-clear-all`}
              >
                Limpiar
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-[280px]">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : hasCategories ? (
              <div className="p-1">
                {Object.entries(groupedOptions).map(([category, opts]) => (
                  <div key={category || "default"}>
                    {category && (
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {category}
                      </div>
                    )}
                    {opts.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          "relative flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                          value.includes(option.value) && "bg-accent/50"
                        )}
                        onClick={() => handleToggle(option.value)}
                        data-testid={`${dataTestId}-option-${option.value}`}
                      >
                        <div
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0 rounded border flex items-center justify-center",
                            value.includes(option.value)
                              ? "bg-primary border-primary"
                              : "border-input"
                          )}
                        >
                          {value.includes(option.value) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="flex items-center gap-2 truncate">
                            {option.icon}
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground truncate">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      value.includes(option.value) && "bg-accent/50"
                    )}
                    onClick={() => handleToggle(option.value)}
                    data-testid={`${dataTestId}-option-${option.value}`}
                  >
                    <div
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0 rounded border flex items-center justify-center",
                        value.includes(option.value)
                          ? "bg-primary border-primary"
                          : "border-input"
                      )}
                    >
                      {value.includes(option.value) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="flex items-center gap-2 truncate">
                        {option.icon}
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {showSelectedBelow && value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => {
            const option = options.find((opt) => opt.value === v);
            return (
              <Badge
                key={v}
                variant="secondary"
                className="gap-1 pr-1 text-xs font-normal"
                data-testid={`${dataTestId}-selected-${v}`}
              >
                {option?.label || v}
                <button
                  type="button"
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(v);
                  }}
                  data-testid={`${dataTestId}-remove-${v}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
