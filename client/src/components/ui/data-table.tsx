import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

export type SortDirection = "asc" | "desc";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render?: (item: T) => React.ReactNode;
  hideOnMobile?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyState?: {
    icon?: React.ElementType;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (items: number) => void;
    itemsPerPageOptions?: number[];
  };
  sorting?: {
    sortField: string;
    sortOrder: SortDirection;
    onSort: (field: string) => void;
  };
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  rowKey: (item: T) => string;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  mobileCardRender?: (item: T) => React.ReactNode;
  testIdPrefix?: string;
  language?: "en" | "es";
  toolbar?: React.ReactNode;
  showViewModeToggle?: boolean;
  viewMode?: "table" | "cards";
  onViewModeChange?: (mode: "table" | "cards") => void;
}

function DataTableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <div className="w-full" data-testid="table-skeleton">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" data-testid="cards-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  testIdPrefix,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  testIdPrefix?: string;
}) {
  return (
    <div 
      className="flex flex-col items-center justify-center py-12 px-4"
      data-testid={testIdPrefix ? `${testIdPrefix}-empty-state` : "empty-state"}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          data-testid={testIdPrefix ? `${testIdPrefix}-empty-action` : "empty-action"}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 30, 50],
  language = "en",
  isMobile = false,
  testIdPrefix,
}: {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (items: number) => void;
  itemsPerPageOptions?: number[];
  language?: "en" | "es";
  isMobile?: boolean;
  testIdPrefix?: string;
}) {
  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const testId = (suffix: string) =>
    testIdPrefix ? `${testIdPrefix}-${suffix}` : suffix;

  if (isMobile) {
    return (
      <div className="flex items-center justify-between gap-2 py-3 px-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          data-testid={testId("button-prev-page")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          data-testid={testId("button-next-page")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
      {onItemsPerPageChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {language === "es" ? "Mostrar" : "Show"}
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
          >
            <SelectTrigger
              className="w-[70px] h-9 text-sm"
              data-testid={testId("select-items-per-page")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={option.toString()} className="text-sm">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {language === "es" ? "por página" : "per page"}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        {totalItems !== undefined && (
          <span className="text-sm text-muted-foreground mr-2">
            {totalItems} {language === "es" ? "registros" : "records"}
          </span>
        )}
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {language === "es" ? "Página" : "Page"} {currentPage}{" "}
          {language === "es" ? "de" : "of"} {totalPages}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            data-testid={testId("button-prev-page")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            data-testid={testId("button-next-page")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SortIcon({
  field,
  sortField,
  sortOrder,
}: {
  field: string;
  sortField: string;
  sortOrder: SortDirection;
}) {
  if (sortField !== field) {
    return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-40" />;
  }
  return sortOrder === "asc" ? (
    <ChevronUp className="h-3 w-3 ml-1" />
  ) : (
    <ChevronDown className="h-3 w-3 ml-1" />
  );
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyState,
  pagination,
  sorting,
  searchable = false,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  rowKey,
  onRowClick,
  rowClassName,
  mobileCardRender,
  testIdPrefix,
  language = "en",
  toolbar,
  showViewModeToggle = false,
  viewMode: controlledViewMode,
  onViewModeChange,
}: DataTableProps<T>) {
  const isMobile = useMobile();
  const [internalViewMode, setInternalViewMode] = useState<"table" | "cards">("table");
  
  const viewMode = controlledViewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;

  useEffect(() => {
    if (isMobile && mobileCardRender && !controlledViewMode) {
      setInternalViewMode("cards");
    }
  }, [isMobile, mobileCardRender, controlledViewMode]);

  const visibleColumns = useMemo(
    () => columns.filter((col) => !(isMobile && col.hideOnMobile)),
    [columns, isMobile]
  );

  if (isLoading) {
    if (viewMode === "cards" || (isMobile && mobileCardRender)) {
      return <CardsSkeleton count={6} />;
    }
    return <DataTableSkeleton columns={visibleColumns.length} rows={5} />;
  }

  const isEmpty = data.length === 0;

  if (isEmpty && emptyState) {
    return (
      <div className="w-full">
        {(searchable || toolbar) && (
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {searchable && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder || (language === "es" ? "Buscar..." : "Search...")}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-9"
                  data-testid={testIdPrefix ? `${testIdPrefix}-input-search` : "input-search"}
                />
                {searchValue && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => onSearchChange?.("")}
                    data-testid={testIdPrefix ? `${testIdPrefix}-button-clear-search` : "button-clear-search"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            {toolbar}
          </div>
        )}
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          actionLabel={emptyState.actionLabel}
          onAction={emptyState.onAction}
          testIdPrefix={testIdPrefix}
        />
      </div>
    );
  }

  const shouldShowCards = viewMode === "cards" || (isMobile && mobileCardRender);

  return (
    <div className="w-full">
      {(searchable || toolbar) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {searchable && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder || (language === "es" ? "Buscar..." : "Search...")}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-9"
                data-testid={testIdPrefix ? `${testIdPrefix}-input-search` : "input-search"}
              />
              {searchValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => onSearchChange?.("")}
                  data-testid={testIdPrefix ? `${testIdPrefix}-button-clear-search` : "button-clear-search"}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {toolbar}
        </div>
      )}

      {shouldShowCards && mobileCardRender ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <div key={rowKey(item)} data-testid={testIdPrefix ? `${testIdPrefix}-card-${rowKey(item)}` : `card-${rowKey(item)}`}>
              {mobileCardRender(item)}
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn(
                        column.sortable && sorting && "cursor-pointer select-none",
                        column.headerClassName,
                        column.width && `w-[${column.width}]`
                      )}
                      onClick={() => {
                        if (column.sortable && sorting) {
                          sorting.onSort(column.key);
                        }
                      }}
                      data-testid={testIdPrefix ? `${testIdPrefix}-th-${column.key}` : `th-${column.key}`}
                    >
                      <div className="flex items-center">
                        {column.header}
                        {column.sortable && sorting && (
                          <SortIcon
                            field={column.key}
                            sortField={sorting.sortField}
                            sortOrder={sorting.sortOrder}
                          />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow
                    key={rowKey(item)}
                    className={cn(
                      onRowClick && "cursor-pointer",
                      rowClassName?.(item)
                    )}
                    onClick={() => onRowClick?.(item)}
                    data-testid={testIdPrefix ? `${testIdPrefix}-row-${rowKey(item)}` : `row-${rowKey(item)}`}
                  >
                    {visibleColumns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={column.className}
                        data-testid={testIdPrefix ? `${testIdPrefix}-cell-${column.key}-${rowKey(item)}` : `cell-${column.key}-${rowKey(item)}`}
                      >
                        {column.render
                          ? column.render(item)
                          : (item as Record<string, unknown>)[column.key]?.toString() ?? "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 0 && (
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.onPageChange}
          onItemsPerPageChange={pagination.onItemsPerPageChange}
          itemsPerPageOptions={pagination.itemsPerPageOptions}
          language={language}
          isMobile={isMobile}
          testIdPrefix={testIdPrefix}
        />
      )}
    </div>
  );
}

export function useTablePagination<T>(
  data: T[],
  initialItemsPerPage = 10
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  return {
    paginatedData,
    currentPage,
    totalPages,
    totalItems: data.length,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage: (items: number) => {
      setItemsPerPage(items);
      setCurrentPage(1);
    },
  };
}

export function useTableSorting<T>(
  data: T[],
  initialField: string = "",
  initialOrder: SortDirection = "asc"
) {
  const [sortField, setSortField] = useState(initialField);
  const [sortOrder, setSortOrder] = useState<SortDirection>(initialOrder);

  const sortedData = useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortField];
      const bVal = (b as Record<string, unknown>)[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;

      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return {
    sortedData,
    sortField,
    sortOrder,
    handleSort,
    setSortField,
    setSortOrder,
  };
}

export function useTableSearch<T>(
  data: T[],
  searchFields: (keyof T)[],
  initialSearchValue = ""
) {
  const [searchValue, setSearchValue] = useState(initialSearchValue);

  const filteredData = useMemo(() => {
    if (!searchValue.trim()) return data;

    const lowerSearch = searchValue.toLowerCase();
    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, searchFields, searchValue]);

  return {
    filteredData,
    searchValue,
    setSearchValue,
  };
}
