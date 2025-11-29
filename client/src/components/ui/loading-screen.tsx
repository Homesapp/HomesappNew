import { cn } from "@/lib/utils"
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png"
import { useLanguage } from "@/contexts/LanguageContext"

interface LoadingScreenProps {
  className?: string;
}

export function LoadingScreen({ className }: LoadingScreenProps) {
  const { t } = useLanguage();
  
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 min-h-[200px]", className)}>
      <div className="flex flex-col items-center">
        <img 
          src={logoPath} 
          alt="HomesApp" 
          className="h-16 w-auto animate-pulse-color"
          data-testid="img-loading-logo"
        />
        <span className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">Smart Real Estate</span>
      </div>
      <p className="text-muted-foreground" data-testid="text-loading">
        {t("common.loading")}
      </p>
    </div>
  );
}
