import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface WelcomeModalProps {
  userRole: "cliente" | "owner";
  hasSeenWelcome: boolean;
  onDismiss?: () => void;
}

export function WelcomeModal({ userRole, hasSeenWelcome, onDismiss }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!hasSeenWelcome) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [hasSeenWelcome]);

  const markAsSeenMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/user/mark-welcome-seen", {
        method: "PATCH",
      });
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
    markAsSeenMutation.mutate();
  };

  const prefix = userRole === "cliente" ? "welcome.client" : "welcome.owner";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-[500px]" data-testid="modal-welcome">
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
