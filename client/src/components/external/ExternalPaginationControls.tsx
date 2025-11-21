import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ExternalPaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  language: 'en' | 'es';
  itemsPerPageOptions?: number[];
  testIdPrefix?: string;
}

export function ExternalPaginationControls({
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  language,
  itemsPerPageOptions = [10, 20, 30, 40],
  testIdPrefix = '',
}: ExternalPaginationControlsProps) {
  const handlePrevPage = () => {
    onPageChange(Math.max(1, currentPage - 1));
  };

  const handleNextPage = () => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  };

  const testId = (suffix: string) => testIdPrefix ? `${testIdPrefix}-${suffix}` : suffix;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {language === 'es' ? 'Mostrar' : 'Show'}
        </span>
        <Select 
          value={itemsPerPage.toString()} 
          onValueChange={(value) => onItemsPerPageChange(Number(value))}
        >
          <SelectTrigger className="w-[60px] h-8 text-xs" data-testid={testId('select-items-per-page')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map(option => (
              <SelectItem key={option} value={option.toString()} className="text-xs">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {language === 'es' ? 'por página' : 'per page'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {language === 'es' ? 'Página' : 'Page'} {currentPage} {language === 'es' ? 'de' : 'of'} {totalPages}
        </span>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            data-testid={testId('button-prev-page')}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            data-testid={testId('button-next-page')}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
