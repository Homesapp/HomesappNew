import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ExternalPaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  language: 'en' | 'es';
  itemsPerPageOptions?: number[];
  testIdPrefix?: string;
  isMobile?: boolean;
}

export function ExternalPaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  language,
  itemsPerPageOptions = [10, 20, 30, 40],
  testIdPrefix = '',
  isMobile = false,
}: ExternalPaginationControlsProps) {
  const handlePrevPage = () => {
    onPageChange(Math.max(1, currentPage - 1));
  };

  const handleNextPage = () => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  };

  const testId = (suffix: string) => testIdPrefix ? `${testIdPrefix}-${suffix}` : suffix;

  if (isMobile) {
    return (
      <div className="flex items-center justify-between gap-2 py-2 px-1">
        <Button 
          variant="outline" 
          size="icon"
          className="h-9 w-9"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          data-testid={testId('button-prev-page')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {currentPage}/{totalPages}
        </span>
        <Button 
          variant="outline" 
          size="icon"
          className="h-9 w-9"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          data-testid={testId('button-next-page')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {language === 'es' ? 'Mostrar' : 'Show'}
        </span>
        <Select 
          value={itemsPerPage.toString()} 
          onValueChange={(value) => onItemsPerPageChange(Number(value))}
        >
          <SelectTrigger className="w-[70px] h-9 text-sm" data-testid={testId('select-items-per-page')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map(option => (
              <SelectItem key={option} value={option.toString()} className="text-sm">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {language === 'es' ? 'por página' : 'per page'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {language === 'es' ? 'Página' : 'Page'} {currentPage} {language === 'es' ? 'de' : 'of'} {totalPages}
        </span>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            data-testid={testId('button-prev-page')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            data-testid={testId('button-next-page')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
