import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface ButtonMultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  allowManual?: boolean;
  placeholder?: string;
  "data-testid"?: string;
}

export default function ButtonMultiSelect({
  options,
  value,
  onChange,
  allowManual = true,
  placeholder = "Agregar personalizado...",
  "data-testid": dataTestId,
}: ButtonMultiSelectProps) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const addManualValue = () => {
    if (manualValue.trim() && !value.includes(manualValue.trim())) {
      onChange([...value, manualValue.trim()]);
      setManualValue("");
      setShowManualInput(false);
    }
  };

  const removeValue = (option: string) => {
    onChange(value.filter((v) => v !== option));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value.includes(option);
          return (
            <Button
              key={option}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleOption(option)}
              data-testid={`${dataTestId}-option-${option.toLowerCase().replace(/\s+/g, "-")}`}
              className="transition-all"
            >
              {option}
              {isSelected && <X className="ml-1 h-3 w-3" />}
            </Button>
          );
        })}
        {allowManual && !showManualInput && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowManualInput(true)}
            data-testid={`${dataTestId}-add-manual`}
            className="border-dashed"
          >
            <Plus className="h-3 w-3 mr-1" />
            Carga Manual
          </Button>
        )}
      </div>

      {showManualInput && (
        <div className="flex gap-2">
          <Input
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addManualValue();
              }
            }}
            data-testid={`${dataTestId}-manual-input`}
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={addManualValue}
            data-testid={`${dataTestId}-manual-add`}
          >
            Agregar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowManualInput(false);
              setManualValue("");
            }}
            data-testid={`${dataTestId}-manual-cancel`}
          >
            Cancelar
          </Button>
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t">
          {value.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="gap-1"
              data-testid={`${dataTestId}-selected-${item.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {item}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeValue(item)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
