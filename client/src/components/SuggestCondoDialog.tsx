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

interface SuggestCondoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuggestCondoDialog({ open, onOpenChange }: SuggestCondoDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState("");

  const suggestMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/condominiums", { name });
    },
    onSuccess: () => {
      toast({
        title: "Condominio sugerido",
        description: "Tu sugerencia ha sido enviada para aprobación del administrador.",
      });
      setName("");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums/approved"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar la sugerencia. Intenta de nuevo.",
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
      <DialogContent data-testid="dialog-suggest-condo">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            Sugerir Nuevo Condominio
          </DialogTitle>
          <DialogDescription data-testid="text-dialog-description">
            Proporciona el nombre del condominio. Será revisado y aprobado por un administrador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="condo-name" data-testid="label-condo-name">
                Nombre del Condominio
              </Label>
              <Input
                id="condo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Residencial Las Palmas"
                data-testid="input-condo-name"
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
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={suggestMutation.isPending || !name.trim()}
              data-testid="button-submit-condo"
            >
              {suggestMutation.isPending ? "Enviando..." : "Enviar Sugerencia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
