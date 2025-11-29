import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Users, Building2, Phone, Mail, DollarSign, Percent, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReferrerGroup {
  referrerName: string;
  referrerPhone: string | null;
  referrerEmail: string | null;
  units: {
    id: string;
    unitNumber: string;
    condominiumName: string | null;
    monthlyRent12: number | null;
    status: string;
  }[];
  totalUnits: number;
  estimatedCommission: number;
}

export default function ExternalReferralNetwork() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedReferrers, setExpandedReferrers] = useState<Set<string>>(new Set());

  const { data: referrers, isLoading } = useQuery<ReferrerGroup[]>({
    queryKey: ['/api/external/referral-network'],
  });

  const text = {
    title: language === "es" ? "Red de Referidos" : "Referral Network",
    subtitle: language === "es" 
      ? "Gestiona la red de referidos y sus propiedades asignadas" 
      : "Manage the referral network and their assigned properties",
    back: language === "es" ? "Volver" : "Back",
    search: language === "es" ? "Buscar referido..." : "Search referrer...",
    noReferrers: language === "es" ? "No hay referidos registrados" : "No referrers registered",
    noReferrersDesc: language === "es" 
      ? "Las propiedades con comisión tipo 'referido' aparecerán aquí" 
      : "Properties with 'referido' commission type will appear here",
    units: language === "es" ? "unidades" : "units",
    unit: language === "es" ? "unidad" : "unit",
    estimatedCommission: language === "es" ? "Comisión estimada" : "Estimated commission",
    monthlyRent: language === "es" ? "Renta mensual" : "Monthly rent",
    totalReferrers: language === "es" ? "Total de referidos" : "Total referrers",
    totalUnits: language === "es" ? "Unidades referidas" : "Referred units",
    totalCommission: language === "es" ? "Comisión total estimada" : "Total estimated commission",
    viewUnit: language === "es" ? "Ver unidad" : "View unit",
  };

  const filteredReferrers = referrers?.filter(r => 
    r.referrerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.referrerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.referrerPhone?.includes(searchQuery)
  ) || [];

  const toggleReferrer = (name: string) => {
    const newSet = new Set(expandedReferrers);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setExpandedReferrers(newSet);
  };

  const totalStats = {
    referrers: filteredReferrers.length,
    units: filteredReferrers.reduce((sum, r) => sum + r.totalUnits, 0),
    commission: filteredReferrers.reduce((sum, r) => sum + r.estimatedCommission, 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/external/dashboard")}
            data-testid="link-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">{text.title}</h1>
            <p className="text-muted-foreground text-sm">{text.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="card-stat-referrers">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-referrers">{totalStats.referrers}</p>
                  <p className="text-sm text-muted-foreground">{text.totalReferrers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-units">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-units">{totalStats.units}</p>
                  <p className="text-sm text-muted-foreground">{text.totalUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-commission">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-commission">{formatCurrency(totalStats.commission)}</p>
                  <p className="text-sm text-muted-foreground">{text.totalCommission}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {text.title}
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={text.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-referrer"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredReferrers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium" data-testid="text-no-referrers">{text.noReferrers}</p>
                <p className="text-sm text-muted-foreground">{text.noReferrersDesc}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReferrers.map((referrer) => (
                  <Collapsible
                    key={referrer.referrerName}
                    open={expandedReferrers.has(referrer.referrerName)}
                    onOpenChange={() => toggleReferrer(referrer.referrerName)}
                  >
                    <div 
                      className="border rounded-lg overflow-hidden"
                      data-testid={`referrer-card-${referrer.referrerName.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="p-4 cursor-pointer hover-elevate flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium truncate" data-testid={`text-referrer-name-${referrer.referrerName.replace(/\s+/g, '-').toLowerCase()}`}>{referrer.referrerName}</p>
                                <Badge variant="outline" className="h-5 text-[10px] shrink-0" data-testid={`badge-commission-${referrer.referrerName.replace(/\s+/g, '-').toLowerCase()}`}>
                                  <Percent className="h-3 w-3 mr-1" />
                                  20%
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                                {referrer.referrerEmail && (
                                  <span className="flex items-center gap-1" data-testid={`text-referrer-email-${referrer.referrerName.replace(/\s+/g, '-').toLowerCase()}`}>
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[150px]">{referrer.referrerEmail}</span>
                                  </span>
                                )}
                                {referrer.referrerPhone && (
                                  <span className="flex items-center gap-1" data-testid={`text-referrer-phone-${referrer.referrerName.replace(/\s+/g, '-').toLowerCase()}`}>
                                    <Phone className="h-3 w-3" />
                                    {referrer.referrerPhone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-medium">
                                {referrer.totalUnits} {referrer.totalUnits === 1 ? text.unit : text.units}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(referrer.estimatedCommission)}
                              </p>
                            </div>
                            {expandedReferrers.has(referrer.referrerName) ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t bg-muted/30 p-3 space-y-2">
                          {referrer.units.map((unit) => (
                            <div
                              key={unit.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-md bg-background border"
                              data-testid={`unit-row-${unit.id}`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {unit.condominiumName} - {unit.unitNumber}
                                  </p>
                                  {unit.monthlyRent12 && (
                                    <p className="text-xs text-muted-foreground">
                                      {formatCurrency(unit.monthlyRent12)}/mes
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge 
                                  variant={unit.status === 'available' ? 'default' : 'secondary'}
                                  className="h-5 text-[10px]"
                                >
                                  {unit.status === 'available' 
                                    ? (language === "es" ? "Disponible" : "Available")
                                    : (language === "es" ? "Ocupada" : "Occupied")}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="h-7"
                                  data-testid={`button-view-unit-${unit.id}`}
                                >
                                  <Link href={`/external/units/${unit.id}`}>
                                    {text.viewUnit}
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
