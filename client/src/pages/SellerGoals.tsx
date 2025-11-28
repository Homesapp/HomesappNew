import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp, Users, DollarSign, Calendar, Trophy, Star, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type SellerGoal = {
  id: string;
  name?: string;
  description?: string;
  nameKey?: string;
  descriptionKey?: string;
  type: 'leads' | 'conversions' | 'revenue' | 'showings';
  target: number;
  current: number;
  period: 'weekly' | 'monthly' | 'quarterly';
  startDate: string;
  endDate: string;
};

type SellerGoalsData = {
  activeGoals: SellerGoal[];
  achievedCount: number;
  totalPoints: number;
  rank: number;
};

const GOAL_TYPE_ICONS: Record<string, typeof Target> = {
  leads: Users,
  conversions: TrendingUp,
  revenue: DollarSign,
  showings: Calendar,
};

const GOAL_TYPE_LABELS: Record<string, Record<string, string>> = {
  es: {
    leads: "Leads",
    conversions: "Conversiones",
    revenue: "Ingresos",
    showings: "Visitas",
  },
  en: {
    leads: "Leads",
    conversions: "Conversions",
    revenue: "Revenue",
    showings: "Showings",
  },
};

const PERIOD_LABELS: Record<string, Record<string, string>> = {
  es: {
    weekly: "Semanal",
    monthly: "Mensual",
    quarterly: "Trimestral",
  },
  en: {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
  },
};

export default function SellerGoals() {
  const { language, t } = useLanguage();

  const { data: goalsData, isLoading } = useQuery<SellerGoalsData>({
    queryKey: ['/api/external-dashboard/seller-goals'],
  });

  const stats = goalsData || {
    activeGoals: [],
    achievedCount: 0,
    totalPoints: 0,
    rank: 0,
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {language === "es" ? "Mis Metas y Objetivos" : "My Goals & Objectives"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "es" 
            ? "Seguimiento de tus metas de ventas y rendimiento"
            : "Track your sales goals and performance"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-achieved">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Metas Alcanzadas" : "Goals Achieved"}
            </CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-achieved-count">
                {stats.achievedCount}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {language === "es" ? "Este período" : "This period"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-points">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Puntos Totales" : "Total Points"}
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-points">
                {stats.totalPoints}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {language === "es" ? "Puntos acumulados" : "Accumulated points"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-rank">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Mi Ranking" : "My Ranking"}
            </CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" data-testid="text-rank">
                  #{stats.rank || "-"}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {language === "es" ? "Entre vendedores" : "Among sellers"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {language === "es" ? "Metas Activas" : "Active Goals"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Progreso de tus metas actuales"
              : "Progress on your current goals"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : stats.activeGoals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {language === "es" 
                  ? "No hay metas activas asignadas"
                  : "No active goals assigned"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "es" 
                  ? "Contacta a tu administrador para recibir objetivos"
                  : "Contact your admin to receive objectives"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.activeGoals.map((goal) => {
                const Icon = GOAL_TYPE_ICONS[goal.type] || Target;
                const percentage = goal.target > 0 
                  ? Math.min(100, Math.round((goal.current / goal.target) * 100))
                  : 0;
                const isCompleted = percentage >= 100;
                
                return (
                  <div 
                    key={goal.id}
                    className={`p-4 rounded-lg border ${isCompleted ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''}`}
                    data-testid={`goal-item-${goal.id}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg ${isCompleted ? 'bg-green-100 dark:bg-green-900' : 'bg-primary/10'} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-5 w-5 ${isCompleted ? 'text-green-600' : 'text-primary'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {goal.nameKey ? t(goal.nameKey) : goal.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {goal.descriptionKey ? t(goal.descriptionKey) : goal.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline">
                          {PERIOD_LABELS[language]?.[goal.period] || goal.period}
                        </Badge>
                        {isCompleted && (
                          <Badge className="bg-green-500">
                            {language === "es" ? "Completada" : "Completed"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {GOAL_TYPE_LABELS[language]?.[goal.type] || goal.type}
                        </span>
                        <span className="font-medium">
                          {goal.current} / {goal.target}
                        </span>
                      </div>
                      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {percentage}% {language === "es" ? "completado" : "complete"}
                        </span>
                        {goal.endDate && (
                          <span className="text-xs text-muted-foreground">
                            {language === "es" ? "Vence: " : "Due: "}
                            {new Date(goal.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
