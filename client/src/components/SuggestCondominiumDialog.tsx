import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface SuggestCondominiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuggestCondominiumDialog({ open, onOpenChange }: SuggestCondominiumDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState("");

  const suggestMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/condominiums", { name });
    },
    onSuccess: () => {
      toast({
        title: t("suggestion.condo.successTitle"),
        description: t("suggestion.condo.successDesc"),
      });
      setName("");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
    },
    onError: () => {
      toast({
        title: t("suggestion.condo.errorTitle"),
        description: t("suggestion.condo.errorDesc"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      suggestMutation.mutate(name.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-suggest-condominium">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {t("suggestion.condo.title")}
          </DialogTitle>
          <DialogDescription data-testid="text-dialog-description">
            {t("suggestion.condo.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="condominium-name" data-testid="label-condominium-name">
                {t("suggestion.condo.nameLabel")}
              </Label>
              <Input
                id="condominium-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("suggestion.condo.namePlaceholder")}
                data-testid="input-condominium-name"
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              {t("suggestion.condo.cancelButton")}
            </Button>
            <Button
              type="submit"
              disabled={suggestMutation.isPending || !name.trim()}
              data-testid="button-submit-condominium"
            >
              {suggestMutation.isPending ? t("common.loading") : t("suggestion.condo.submitButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
