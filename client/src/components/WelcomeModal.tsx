import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface WelcomeModalProps {
  userRole: "cliente" | "owner";
  hasSeenWelcome: boolean;
  lastWelcomeShown?: string | null;
  onDismiss?: () => void;
}

export function WelcomeModal({ userRole, hasSeenWelcome, lastWelcomeShown, onDismiss }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Don't show if user has permanently dismissed
    if (hasSeenWelcome) {
      setIsOpen(false);
      return;
    }

    // Show if never shown before OR if last shown was not today
    if (!lastWelcomeShown) {
      setIsOpen(true);
      return;
    }

    const lastShown = new Date(lastWelcomeShown);
    const today = new Date();
    const isToday = 
      lastShown.getDate() === today.getDate() &&
      lastShown.getMonth() === today.getMonth() &&
      lastShown.getFullYear() === today.getFullYear();

    setIsOpen(!isToday);
  }, [hasSeenWelcome, lastWelcomeShown]);

  const markAsSeenMutation = useMutation({
    mutationFn: async (dontShow: boolean) => {
      const res = await apiRequest("PATCH", "/api/user/mark-welcome-seen", {
        dontShowAgain: dontShow,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsOpen(false);
      if (onDismiss) {
        onDismiss();
      }
    },
  });

  const handleDismiss = () => {
    markAsSeenMutation.mutate(dontShowAgain);
  };

  const prefix = userRole === "cliente" ? "welcome.client" : "welcome.owner";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="sm:max-w-[500px]" data-testid="modal-welcome" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t(`${prefix}.title`)}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t(`${prefix}.subtitle`)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">{t(`${prefix}.description`)}</p>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span>{t(`${prefix}.feature1`)}</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span>{t(`${prefix}.feature2`)}</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span>{t(`${prefix}.feature3`)}</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span>{t(`${prefix}.feature4`)}</span>
            </li>
          </ul>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="dont-show-again" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              data-testid="checkbox-dont-show-again"
            />
            <label
              htmlFor="dont-show-again"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {t(`${prefix}.dontShowAgain`)}
            </label>
          </div>

          <Button
            onClick={handleDismiss}
            className="w-full"
            size="lg"
            disabled={markAsSeenMutation.isPending}
            data-testid="button-welcome-dismiss"
          >
            {markAsSeenMutation.isPending ? "..." : t(`${prefix}.button`)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
