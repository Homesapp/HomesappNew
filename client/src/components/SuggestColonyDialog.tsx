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

interface SuggestColonyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuggestColonyDialog({ open, onOpenChange }: SuggestColonyDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState("");

  const suggestMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/colonies", { name });
    },
    onSuccess: () => {
      toast({
        title: t("suggestion.colony.successTitle"),
        description: t("suggestion.colony.successDesc"),
      });
      setName("");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/colonies"] });
    },
    onError: () => {
      toast({
        title: t("suggestion.colony.errorTitle"),
        description: t("suggestion.colony.errorDesc"),
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
      <DialogContent data-testid="dialog-suggest-colony">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {t("suggestion.colony.title")}
          </DialogTitle>
          <DialogDescription data-testid="text-dialog-description">
            {t("suggestion.colony.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="colony-name" data-testid="label-colony-name">
                {t("suggestion.colony.nameLabel")}
              </Label>
              <Input
                id="colony-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("suggestion.colony.namePlaceholder")}
                data-testid="input-colony-name"
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
              {t("suggestion.colony.cancelButton")}
            </Button>
            <Button
              type="submit"
              disabled={suggestMutation.isPending || !name.trim()}
              data-testid="button-submit-colony"
            >
              {suggestMutation.isPending ? t("common.loading") : t("suggestion.colony.submitButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
