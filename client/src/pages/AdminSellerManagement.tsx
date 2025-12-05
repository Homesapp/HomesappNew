import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Users, 
  TrendingUp, 
  FileText, 
  Home,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

interface SellerData {
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
    phone?: string;
  };
  stats: {
    totalAssignedLeads: number;
    totalRegisteredLeads: number;
    totalRecommendations: number;
    leadsByStatus: {
      nuevo: number;
      contactado: number;
      calificado: number;
      propuesta: number;
      negociacion: number;
      ganado: number;
      perdido: number;
    };
  };
  assignedLeads: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: string;
    source?: string;
    createdAt: string;
  }>;
  registeredLeads: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: string;
    source?: string;
    createdAt: string;
  }>;
  recentRecommendations: Array<{
    id: string;
    propertyId: string;
    clientId: string;
    message?: string;
    isRead: boolean;
    isInterested?: boolean;
    createdAt: string;
    property?: {
      id: string;
      title: string;
      location: string;
    };
  }>;
}

type SortField = "name" | "assigned" | "registered" | "rate";
type SortOrder = "asc" | "desc";

export default function AdminSellerManagement() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<SellerData | null>(null);
  
  const [gridPage, setGridPage] = useState(1);
  const [gridPerPage, setGridPerPage] = useState(9);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  
  const [assignedPage, setAssignedPage] = useState(1);
  const [registeredPage, setRegisteredPage] = useState(1);
  const [recommendationsPage, setRecommendationsPage] = useState(1);
  const [detailPerPage, setDetailPerPage] = useState(10);

  const { data: sellersData = [], isLoading } = useQuery<SellerData[]>({
    queryKey: ["/api/admin/sellers/all"],
  });

  useEffect(() => {
    setGridPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setAssignedPage(1);
    setRegisteredPage(1);
    setRecommendationsPage(1);
  }, [selectedSeller]);

  const filteredAndSortedSellers = useMemo(() => {
    const filtered = sellersData.filter(seller =>
      `${seller.seller.firstName} ${seller.seller.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.seller.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = `${a.seller.firstName} ${a.seller.lastName}`.localeCompare(`${b.seller.firstName} ${b.seller.lastName}`);
          break;
        case "assigned":
          comparison = a.stats.totalAssignedLeads - b.stats.totalAssignedLeads;
          break;
        case "registered":
          comparison = a.stats.totalRegisteredLeads - b.stats.totalRegisteredLeads;
          break;
        case "rate":
          const rateA = a.stats.totalAssignedLeads > 0 ? a.stats.leadsByStatus.ganado / a.stats.totalAssignedLeads : 0;
          const rateB = b.stats.totalAssignedLeads > 0 ? b.stats.leadsByStatus.ganado / b.stats.totalAssignedLeads : 0;
          comparison = rateA - rateB;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [sellersData, searchTerm, sortField, sortOrder]);

  const gridTotalPages = Math.max(1, Math.ceil(filteredAndSortedSellers.length / gridPerPage));
  const safeGridPage = Math.min(gridPage, gridTotalPages);
  
  const paginatedSellers = useMemo(() => {
    const start = (safeGridPage - 1) * gridPerPage;
    return filteredAndSortedSellers.slice(start, start + gridPerPage);
  }, [filteredAndSortedSellers, safeGridPage, gridPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setGridPage(1);
  };

  const assignedTotalPages = useMemo(() => 
    Math.max(1, Math.ceil((selectedSeller?.assignedLeads.length || 0) / detailPerPage)),
    [selectedSeller, detailPerPage]
  );
  const safeAssignedPage = Math.min(assignedPage, assignedTotalPages);
  const paginatedAssigned = useMemo(() => {
    if (!selectedSeller) return [];
    const start = (safeAssignedPage - 1) * detailPerPage;
    return selectedSeller.assignedLeads.slice(start, start + detailPerPage);
  }, [selectedSeller, safeAssignedPage, detailPerPage]);

  const registeredTotalPages = useMemo(() => 
    Math.max(1, Math.ceil((selectedSeller?.registeredLeads.length || 0) / detailPerPage)),
    [selectedSeller, detailPerPage]
  );
  const safeRegisteredPage = Math.min(registeredPage, registeredTotalPages);
  const paginatedRegistered = useMemo(() => {
    if (!selectedSeller) return [];
    const start = (safeRegisteredPage - 1) * detailPerPage;
    return selectedSeller.registeredLeads.slice(start, start + detailPerPage);
  }, [selectedSeller, safeRegisteredPage, detailPerPage]);

  const recommendationsTotalPages = useMemo(() => 
    Math.max(1, Math.ceil((selectedSeller?.recentRecommendations.length || 0) / detailPerPage)),
    [selectedSeller, detailPerPage]
  );
  const safeRecommendationsPage = Math.min(recommendationsPage, recommendationsTotalPages);
  const paginatedRecommendations = useMemo(() => {
    if (!selectedSeller) return [];
    const start = (safeRecommendationsPage - 1) * detailPerPage;
    return selectedSeller.recentRecommendations.slice(start, start + detailPerPage);
  }, [selectedSeller, safeRecommendationsPage, detailPerPage]);

  useEffect(() => {
    if (assignedPage > assignedTotalPages && assignedTotalPages > 0) {
      setAssignedPage(assignedTotalPages);
    }
  }, [assignedTotalPages, assignedPage]);

  useEffect(() => {
    if (registeredPage > registeredTotalPages && registeredTotalPages > 0) {
      setRegisteredPage(registeredTotalPages);
    }
  }, [registeredTotalPages, registeredPage]);

  useEffect(() => {
    if (recommendationsPage > recommendationsTotalPages && recommendationsTotalPages > 0) {
      setRecommendationsPage(recommendationsTotalPages);
    }
  }, [recommendationsTotalPages, recommendationsPage]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      nuevo: "outline",
      contactado: "secondary",
      calificado: "default",
      propuesta: "default",
      negociacion: "default",
      ganado: "default",
      perdido: "destructive",
    };
    return variants[status] || "outline";
  };

  const getStatusLabel = (status: string) => {
    return t(`leadStatus.${status}` as any) || status;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {t("adminSellers.title")}
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          {t("adminSellers.description")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("adminSellers.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-sellers"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortField} onValueChange={(val) => handleSort(val as SortField)}>
            <SelectTrigger className="w-[150px]" data-testid="select-sort-field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t("adminSellers.name")}</SelectItem>
              <SelectItem value="assigned">{t("adminSellers.assigned")}</SelectItem>
              <SelectItem value="registered">{t("adminSellers.registered")}</SelectItem>
              <SelectItem value="rate">{t("adminSellers.successRate")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            data-testid="button-toggle-sort"
          >
            {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <Badge variant="outline" data-testid="badge-seller-count">
          {filteredAndSortedSellers.length} {t("adminSellers.sellersCount")}
        </Badge>
      </div>

      {!selectedSeller ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedSellers.map((sellerData) => {
            const { seller, stats } = sellerData;
            return (
              <Card 
                key={seller.id} 
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedSeller(sellerData)}
                data-testid={`card-seller-${seller.id}`}
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <Avatar className="h-12 w-12">
                    {seller.profileImageUrl && (
                      <AvatarImage src={seller.profileImageUrl} />
                    )}
                    <AvatarFallback>
                      {getInitials(seller.firstName, seller.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {seller.firstName} {seller.lastName}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {seller.email}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold" data-testid={`text-assigned-${seller.id}`}>
                        {stats.totalAssignedLeads}
                      </div>
                      <div className="text-xs text-muted-foreground">{t("adminSellers.assigned")}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid={`text-registered-${seller.id}`}>
                        {stats.totalRegisteredLeads}
                      </div>
                      <div className="text-xs text-muted-foreground">{t("adminSellers.registered")}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid={`text-recommendations-${seller.id}`}>
                        {stats.totalRecommendations}
                      </div>
                      <div className="text-xs text-muted-foreground">{t("adminSellers.properties")}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {Object.entries(stats.leadsByStatus).map(([status, count]) => {
                      if (count === 0) return null;
                      return (
                        <Badge 
                          key={status} 
                          variant={getStatusBadgeVariant(status)}
                          className="text-xs"
                          data-testid={`badge-status-${status}-${seller.id}`}
                        >
                          {getStatusLabel(status)}: {count}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground" data-testid="text-sellers-pagination-info">
                {t("common.showing")} {Math.min((safeGridPage - 1) * gridPerPage + 1, filteredAndSortedSellers.length)}-{Math.min(safeGridPage * gridPerPage, filteredAndSortedSellers.length)} {t("common.of")} {filteredAndSortedSellers.length}
              </span>
              <Select
                value={gridPerPage.toString()}
                onValueChange={(val) => {
                  setGridPerPage(Number(val));
                  setGridPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]" data-testid="select-sellers-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="18">18</SelectItem>
                  <SelectItem value="27">27</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGridPage(p => Math.max(1, p - 1))}
                disabled={safeGridPage <= 1}
                data-testid="button-sellers-prev-page"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("common.previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {safeGridPage} / {gridTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGridPage(p => Math.min(gridTotalPages, p + 1))}
                disabled={safeGridPage >= gridTotalPages}
                data-testid="button-sellers-next-page"
              >
                {t("common.next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedSeller(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
              data-testid="button-back"
            >
              ← {t("adminSellers.backToList")}
            </button>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <Avatar className="h-16 w-16">
                {selectedSeller.seller.profileImageUrl && (
                  <AvatarImage src={selectedSeller.seller.profileImageUrl} />
                )}
                <AvatarFallback>
                  {getInitials(selectedSeller.seller.firstName, selectedSeller.seller.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">
                  {selectedSeller.seller.firstName} {selectedSeller.seller.lastName}
                </CardTitle>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{selectedSeller.seller.email}</span>
                  </div>
                  {selectedSeller.seller.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{selectedSeller.seller.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("adminSellers.assignedLeads")}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedSeller.stats.totalAssignedLeads}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("adminSellers.registeredLeads")}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedSeller.stats.totalRegisteredLeads}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("adminSellers.recommendations")}
                </CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedSeller.stats.totalRecommendations}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("adminSellers.successRate")}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedSeller.stats.totalAssignedLeads > 0
                    ? Math.round(
                        (selectedSeller.stats.leadsByStatus.ganado /
                          selectedSeller.stats.totalAssignedLeads) *
                          100
                      )
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="assigned" className="space-y-4">
            <TabsList>
              <TabsTrigger value="assigned" data-testid="tab-assigned">
                {t("adminSellers.assignedLeads")} ({selectedSeller.assignedLeads.length})
              </TabsTrigger>
              <TabsTrigger value="registered" data-testid="tab-registered">
                {t("adminSellers.registeredLeads")} ({selectedSeller.registeredLeads.length})
              </TabsTrigger>
              <TabsTrigger value="recommendations" data-testid="tab-recommendations">
                {t("adminSellers.recommendations")} ({selectedSeller.recentRecommendations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assigned" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("adminSellers.assignedLeads")}</CardTitle>
                  <CardDescription>
                    {t("adminSellers.assignedLeadsDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSeller.assignedLeads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("adminSellers.noAssignedLeads")}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("adminSellers.name")}</TableHead>
                            <TableHead>{t("adminSellers.email")}</TableHead>
                            <TableHead>{t("adminSellers.phone")}</TableHead>
                            <TableHead>{t("adminSellers.status")}</TableHead>
                            <TableHead>{t("adminSellers.source")}</TableHead>
                            <TableHead>{t("adminSellers.date")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedAssigned.map((lead) => (
                            <TableRow key={lead.id} data-testid={`row-assigned-${lead.id}`}>
                              <TableCell className="font-medium">
                                {lead.firstName} {lead.lastName}
                              </TableCell>
                              <TableCell>{lead.email}</TableCell>
                              <TableCell>{lead.phone || "-"}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(lead.status)}>
                                  {getStatusLabel(lead.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>{lead.source || "-"}</TableCell>
                              <TableCell>
                                {new Date(lead.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground" data-testid="text-assigned-pagination-info">
                          {t("common.showing")} {Math.min((safeAssignedPage - 1) * detailPerPage + 1, selectedSeller.assignedLeads.length)}-{Math.min(safeAssignedPage * detailPerPage, selectedSeller.assignedLeads.length)} {t("common.of")} {selectedSeller.assignedLeads.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssignedPage(p => Math.max(1, p - 1))}
                            disabled={safeAssignedPage <= 1}
                            data-testid="button-assigned-prev-page"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {t("common.previous")}
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {safeAssignedPage} / {assignedTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssignedPage(p => Math.min(assignedTotalPages, p + 1))}
                            disabled={safeAssignedPage >= assignedTotalPages}
                            data-testid="button-assigned-next-page"
                          >
                            {t("common.next")}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registered" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("adminSellers.registeredLeads")}</CardTitle>
                  <CardDescription>
                    {t("adminSellers.registeredLeadsDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSeller.registeredLeads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("adminSellers.noRegisteredLeads")}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("adminSellers.name")}</TableHead>
                            <TableHead>{t("adminSellers.email")}</TableHead>
                            <TableHead>{t("adminSellers.phone")}</TableHead>
                            <TableHead>{t("adminSellers.status")}</TableHead>
                            <TableHead>{t("adminSellers.source")}</TableHead>
                            <TableHead>{t("adminSellers.date")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedRegistered.map((lead) => (
                            <TableRow key={lead.id} data-testid={`row-registered-${lead.id}`}>
                              <TableCell className="font-medium">
                                {lead.firstName} {lead.lastName}
                              </TableCell>
                              <TableCell>{lead.email}</TableCell>
                              <TableCell>{lead.phone || "-"}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(lead.status)}>
                                  {getStatusLabel(lead.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>{lead.source || "-"}</TableCell>
                              <TableCell>
                                {new Date(lead.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground" data-testid="text-registered-pagination-info">
                          {t("common.showing")} {Math.min((safeRegisteredPage - 1) * detailPerPage + 1, selectedSeller.registeredLeads.length)}-{Math.min(safeRegisteredPage * detailPerPage, selectedSeller.registeredLeads.length)} {t("common.of")} {selectedSeller.registeredLeads.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRegisteredPage(p => Math.max(1, p - 1))}
                            disabled={safeRegisteredPage <= 1}
                            data-testid="button-registered-prev-page"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {t("common.previous")}
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {safeRegisteredPage} / {registeredTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRegisteredPage(p => Math.min(registeredTotalPages, p + 1))}
                            disabled={safeRegisteredPage >= registeredTotalPages}
                            data-testid="button-registered-next-page"
                          >
                            {t("common.next")}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("adminSellers.recommendedProperties")}</CardTitle>
                  <CardDescription>
                    {t("adminSellers.recommendedPropertiesDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSeller.recentRecommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("adminSellers.noRecommendations")}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("adminSellers.property")}</TableHead>
                            <TableHead>{t("adminSellers.location")}</TableHead>
                            <TableHead>{t("adminSellers.message")}</TableHead>
                            <TableHead>{t("adminSellers.read")}</TableHead>
                            <TableHead>{t("adminSellers.interest")}</TableHead>
                            <TableHead>{t("adminSellers.date")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedRecommendations.map((rec) => (
                            <TableRow key={rec.id} data-testid={`row-recommendation-${rec.id}`}>
                              <TableCell className="font-medium">
                                {rec.property?.title || t("adminSellers.deletedProperty")}
                              </TableCell>
                              <TableCell>
                                {rec.property?.location || "-"}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {rec.message || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={rec.isRead ? "secondary" : "outline"}>
                                  {rec.isRead ? t("adminSellers.yes") : t("adminSellers.no")}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {rec.isInterested === null ? (
                                  <Badge variant="outline">{t("adminSellers.noResponse")}</Badge>
                                ) : rec.isInterested ? (
                                  <Badge variant="default">{t("adminSellers.interested")}</Badge>
                                ) : (
                                  <Badge variant="destructive">{t("adminSellers.notInterested")}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {new Date(rec.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground" data-testid="text-recommendations-pagination-info">
                          {t("common.showing")} {Math.min((safeRecommendationsPage - 1) * detailPerPage + 1, selectedSeller.recentRecommendations.length)}-{Math.min(safeRecommendationsPage * detailPerPage, selectedSeller.recentRecommendations.length)} {t("common.of")} {selectedSeller.recentRecommendations.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRecommendationsPage(p => Math.max(1, p - 1))}
                            disabled={safeRecommendationsPage <= 1}
                            data-testid="button-recommendations-prev-page"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {t("common.previous")}
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {safeRecommendationsPage} / {recommendationsTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRecommendationsPage(p => Math.min(recommendationsTotalPages, p + 1))}
                            disabled={safeRecommendationsPage >= recommendationsTotalPages}
                            data-testid="button-recommendations-next-page"
                          >
                            {t("common.next")}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
